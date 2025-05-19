"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { ArrowLeft, Plus, Loader2, Download, X, Check, Calculator } from "lucide-react"
import { useRouter } from "next/navigation"
import axios, { AxiosError } from "axios"
import QRCode from "qrcode"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Home } from "lucide-react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

const CATEGORIES = [
  "Imported Marble",
  "Imported Granite",
  "Exotics",
  "Onyx",
  "Travertine",
  "Indian Marble",
  "Indian Granite",
  "Semi Precious Stone",
  "Quartzite",
  "Sandstone",
] as const

const APPLICATION_AREAS = ["Flooring", "Countertops", "Walls", "Exterior", "Interior"] as const

type Category = (typeof CATEGORIES)[number]
type ApplicationArea = (typeof APPLICATION_AREAS)[number]

interface MessageState {
  text: string
  type: "error" | "success"
}

interface FormValues extends z.infer<typeof formSchema> {
  images?: FileList
}

interface ApiResponse {
  success: boolean
  msg?: string
  data?: {
    postId: string
    [key: string]: any
  }
}

interface ProductFormProps {
  mode?: "create" | "edit"
  initialData?: {
    _id: string
    postId: string
    name: string
    category: string
    price: string
    quantityAvailable: string
    size?: string
    sizeUnit?: string
    numberOfPieces?: string
    thickness?: string
    finishes?: string
    applicationAreas: string
    description?: string
    image: string[]
  }
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]

const formSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters"),
  category: z.string().min(1, "Please select a category"),
  price: z.string().min(1, "Price is required"),
  quantityAvailable: z.string().min(1, "Quantity is required"),
  size: z.string().optional(),
  sizeLength: z.string().optional(),
  sizeHeight: z.string().optional(),
  sizeUnit: z.string().default("in"),
  numberOfPieces: z.string().optional(),
  thickness: z.string().optional(),
  finishes: z.array(z.string()).optional().default([]),
  applicationAreas: z.array(z.string()).min(1, "Please select at least one application area"),
  description: z.string().optional(),
})

const parseSizeString = (sizeStr: string): { length: number; height: number } | null => {
  // Handle different formats: "60x120", "60 x 120", "60*120", "60 * 120"
  const cleanedStr = sizeStr.replace(/\s+/g, "").toLowerCase()

  // Try to match patterns like 60x120, 60*120, 60-120
  const match = cleanedStr.match(/^(\d+(?:\.\d+)?)[x*-](\d+(?:\.\d+)?)$/)

  if (match) {
    return {
      length: Number.parseFloat(match[1]),
      height: Number.parseFloat(match[2]),
    }
  }

  return null
}

// Helper function to parse finishes string into array
const parseFinishes = (finishesStr: string | undefined): string[] => {
  if (!finishesStr) return []
  return finishesStr.split(",").map((f) => f.trim().toLowerCase())
}

export default function ProductForm({ mode = "create", initialData }: ProductFormProps) {
  const router = useRouter()
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<MessageState | null>(null)
  const [postId, setPostId] = useState<string | null>(initialData?.postId || null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("")
  const [newImageCount, setNewImageCount] = useState<number>(0)
  const [autoCalculateQuantity, setAutoCalculateQuantity] = useState(true)
  const [sizeParseError, setSizeParseError] = useState<string | null>(null)
  const [calculationPreview, setCalculationPreview] = useState<string | null>(null)
  // No need for focus state variables

  // Parse finishes from initialData
  const initialFinishes = parseFinishes(initialData?.finishes)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      category: initialData?.category || "",
      price: initialData?.price || "",
      quantityAvailable: initialData?.quantityAvailable || "",
      size: initialData?.size || "",
      sizeLength: initialData?.size ? initialData.size.split(/[x*-]/)[0] : "",
      sizeHeight: initialData?.size ? initialData.size.split(/[x*-]/)[1] : "",
      sizeUnit: initialData?.sizeUnit || "in",
      numberOfPieces: initialData?.numberOfPieces || "",
      thickness: initialData?.thickness || "",
      finishes: initialFinishes,
      applicationAreas: initialData?.applicationAreas ? initialData.applicationAreas.split(",") : [],
      description: initialData?.description || "",
    },
  })

  useEffect(() => {
    if (mode === "edit" && initialData?.image) {
      setPreviews(initialData.image)
    }
  }, [mode, initialData])

  // Calculate quantity based on size, unit, and number of pieces
  useEffect(() => {
    if (!autoCalculateQuantity) {
      setCalculationPreview(null)
      return
    }

    const sizeLength = form.getValues("sizeLength")
    const sizeHeight = form.getValues("sizeHeight")
    const sizeUnit = form.getValues("sizeUnit")
    const numberOfPieces = form.getValues("numberOfPieces")

    // Only calculate if we have all required values
    if (!sizeLength || !sizeHeight || !numberOfPieces) {
      setSizeParseError(null)
      setCalculationPreview(null)
      return
    }

    setSizeParseError(null)
    const length = Number.parseFloat(sizeLength)
    const height = Number.parseFloat(sizeHeight)
    const pieces = Number.parseFloat(numberOfPieces)

    if (isNaN(length) || isNaN(height) || isNaN(pieces)) {
      setSizeParseError("Please enter valid numbers for size and pieces")
      setCalculationPreview(null)
      return
    }

    let calculatedQuantity: number
    let formula: string

    if (sizeUnit === "in") {
      // For inches: (length * height * numberOfPieces) / 144 = quantity available
      calculatedQuantity = (length * height * pieces) / 144
      formula = `(${length} × ${height} × ${pieces}) ÷ 144 = ${calculatedQuantity.toFixed(2)} sqft`
    } else {
      // For cm: (length * height * numberOfPieces) / 929 = quantity available
      calculatedQuantity = (length * height * pieces) / 929
      formula = `(${length} × ${height} × ${pieces}) ÷ 929 = ${calculatedQuantity.toFixed(2)} sqft`
    }

    // Round to 2 decimal places
    calculatedQuantity = Math.round(calculatedQuantity * 100) / 100

    // Update the form
    form.setValue("quantityAvailable", calculatedQuantity.toString())
    setCalculationPreview(formula)
  }, [
    form.watch("sizeLength"),
    form.watch("sizeHeight"),
    form.watch("sizeUnit"),
    form.watch("numberOfPieces"),
    autoCalculateQuantity,
  ])

  const validateImage = (file: File): boolean => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setMessage({ text: "Invalid file type. Only JPG, PNG and WebP are allowed", type: "error" })
      return false
    }

    if (file.size > MAX_FILE_SIZE) {
      setMessage({ text: "File size too large. Maximum size is 5MB", type: "error" })
      return false
    }

    return true
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileArray = Array.from(e.target.files)

      // Check if adding these new files would exceed the limit
      const totalImagesAfterAddition = images.length + fileArray.length
      if (totalImagesAfterAddition > 10) {
        setMessage({ text: "You can only upload up to 10 images in total", type: "error" })
        return
      }

      const validFiles = fileArray.filter(validateImage)
      if (validFiles.length !== fileArray.length) return

      // Append new files to existing ones instead of replacing
      setImages((prevImages) => [...prevImages, ...validFiles])
      setNewImageCount((prevCount) => prevCount + validFiles.length)

      // Create object URLs for new images and append to existing previews
      const newPreviews = validFiles.map((file) => URL.createObjectURL(file))
      setPreviews((prevPreviews) => [...prevPreviews, ...newPreviews])
    }
  }

  const removeImage = (index: number) => {
    if (mode === "edit" && index < (initialData?.image.length || 0)) {
      // Removing an existing image from the server
      const newPreviews = [...previews]
      newPreviews.splice(index, 1)
      setPreviews(newPreviews)
    } else {
      // Removing a newly added image
      const adjustedIndex = mode === "edit" ? index - (initialData?.image.length || 0) : index

      // Remove the file from images array
      setImages((prev) => {
        const newImages = [...prev]
        newImages.splice(adjustedIndex, 1)
        return newImages
      })

      // Remove the preview and revoke the object URL
      setPreviews((prev) => {
        const urlToRevoke = prev[index]
        URL.revokeObjectURL(urlToRevoke)

        const newPreviews = [...prev]
        newPreviews.splice(index, 1)
        return newPreviews
      })

      setNewImageCount((prev) => prev - 1)
    }
  }

  const generateQRCode = async (postId: string): Promise<string> => {
    try {
      const url = `${window.location.origin}/product/${postId}`
      return await QRCode.toDataURL(url, {
        width: 200,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      })
    } catch (error) {
      console.error("Error generating QR code:", error)
      throw new Error("Failed to generate QR code")
    }
  }

  const handleDownloadQR = () => {
    if (!qrCodeUrl || !postId) return

    const link = document.createElement("a")
    link.href = qrCodeUrl
    link.download = `product-qr-${postId}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true)
      setMessage(null)

      if (previews.length === 0) {
        throw new Error("You must have at least one image")
      }

      const formData = new FormData()

      // Log the form values before sending
      console.log("Form values before sending:", values)

      // Convert arrays to strings for FormData
      const formValues = {
        ...values,
        applicationAreas: values.applicationAreas.join(","),
        finishes: values.finishes ? values.finishes.join(",") : "",
      }

      // Log the processed form values
      console.log("Processed form values:", formValues)

      Object.entries(formValues).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString())
        }
      })

      // Log the FormData entries without using for...of
      console.log("Form data keys:", Object.fromEntries(Object.keys(formValues).map((key) => [key, formData.get(key)])))

      // Add this right after setting formData:
      console.log("Form data details:", {
        size: {
          value: values.size,
          type: typeof values.size,
          isEmpty: values.size === "",
          isUndefined: values.size === undefined,
        },
        numberOfPieces: {
          value: values.numberOfPieces,
          type: typeof values.numberOfPieces,
          isEmpty: values.numberOfPieces === "",
          isUndefined: values.numberOfPieces === undefined,
        },
        thickness: {
          value: values.thickness,
          type: typeof values.thickness,
          isEmpty: values.thickness === "",
          isUndefined: values.thickness === undefined,
        },
      })

      // Ensure optional fields are always included
      if (!formData.has("size")) formData.append("size", values.size || "")
      if (!formData.has("numberOfPieces")) formData.append("numberOfPieces", values.numberOfPieces || "")
      if (!formData.has("thickness")) formData.append("thickness", values.thickness || "")
      if (!formData.has("sizeUnit")) formData.append("sizeUnit", values.sizeUnit || "in")
      if (!formData.has("finishes")) formData.append("finishes", values.finishes ? values.finishes.join(",") : "")

      // Handle images based on mode
      if (mode === "edit") {
        const existingImages = initialData?.image || []
        const existingImagesInPreviews = previews.filter((url) => existingImages.includes(url))
        formData.append("existingImages", JSON.stringify(existingImagesInPreviews))

        if (images.length > 0) {
          images.forEach((image) => formData.append("images", image))
        }
      } else {
        images.forEach((image) => formData.append("images", image))
      }

      const endpoint =
        mode === "edit" ? `${API_URL}/api/updateProduct/${initialData?.postId}` : `${API_URL}/api/create-post`

      const response = await axios.post<ApiResponse>(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      // Log the response
      console.log("Server response:", response.data)

      if (response.data.success) {
        if (mode === "create" && response.data.data?.postId) {
          const newPostId = response.data.data.postId
          setPostId(newPostId)
          const qrCode = await generateQRCode(newPostId)
          setQrCodeUrl(qrCode)
        }

        setMessage({
          text: mode === "edit" ? "Product updated successfully!" : "Product created successfully!",
          type: "success",
        })

        if (mode === "create") {
          form.reset()
          setImages([])
          setPreviews([])
          setNewImageCount(0)
        } else {
          setTimeout(() => router.push("/admin/dashboard/products"), 1500)
        
        }
      } else {
        throw new Error(response.data.msg || `Failed to ${mode} product`)
      }
    } catch (error) {
      let errorMessage = `Error ${mode === "edit" ? "updating" : "creating"} product`

      if (error instanceof AxiosError) {
        errorMessage = error.response?.data?.msg || error.message
      } else if (error instanceof Error) {
        errorMessage = error.message
      }

      setMessage({ text: errorMessage, type: "error" })
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto bg-white min-h-screen">
      {/* Header */}

     
      <div className="sticky top-0 z-50 bg-white">
        <div className="p-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>

          <div className="text-center mt-4 mb-6">
            <h1 className="text-3xl font-bold text-[#181818]">
              {mode === "edit" ? "Edit Product" : "Add New Product"}
            </h1>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="px-6 pb-10">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Product Name */}
            <div className="form-field">
              <FormLabel className="text-[#181818] font-bold block mb-2">Product Name</FormLabel>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="Enter product name"
                        className="rounded-md border-[#e3e3e3] h-12 focus-visible:ring-[#194a95]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Category */}
            <div className="form-field relative z-40">
              <FormLabel className="text-[#181818] font-bold block mb-2">Select Product Category</FormLabel>
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-md border-[#e3e3e3] h-12 focus:ring-[#194a95]">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent
                        className="bg-white border rounded-md shadow-lg z-50"
                        position="popper"
                        sideOffset={5}
                      >
                        {CATEGORIES.map((category) => (
                          <SelectItem
                            key={category}
                            value={category}
                            className="px-3 py-2 focus:bg-gray-100 cursor-pointer hover:bg-gray-50"
                          >
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Price and Thickness Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-field">
                <FormLabel className="text-[#181818] font-bold block mb-2">Price (per sqft)</FormLabel>
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="per sqft"
                          className="rounded-md border-[#e3e3e3] h-12 focus-visible:ring-[#194a95]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="form-field">
                <FormLabel className="text-[#181818] font-bold block mb-2">Thickness (in mm)</FormLabel>
                <FormField
                  control={form.control}
                  name="thickness"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          placeholder="e.g., 20mm"
                          className="rounded-md border-[#e3e3e3] h-12 focus-visible:ring-[#194a95]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Size with Unit, Number of Pieces, and Quantity */}
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-5">
                <FormLabel className="text-[#181818] font-bold block mb-2 text-lg">Size</FormLabel>
                <div className="flex items-center gap-3">
                  <div className="w-[100px]">
                    <FormField
                      control={form.control}
                      name="sizeLength"
                      render={({ field }) => (
                        <FormItem className="mb-0">
                          <FormControl>
                            <Input
                              type="text"
                              inputMode="numeric"
                              placeholder="L"
                              className="rounded-md border-[#e3e3e3] h-14 text-lg focus-visible:ring-[#194a95] pl-3"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e)
                                // Update the size field with the combined value
                                const length = e.target.value
                                const height = form.getValues("sizeHeight") || ""
                                if (length && height) {
                                  form.setValue("size", `${length}x${height}`)
                                } else {
                                  form.setValue("size", "")
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex items-center justify-center w-5">
                    <span className="text-gray-500 text-xl font-bold">×</span>
                  </div>

                  <div className="w-[100px]">
                    <FormField
                      control={form.control}
                      name="sizeHeight"
                      render={({ field }) => (
                        <FormItem className="mb-0">
                          <FormControl>
                            <Input
                              type="text"
                              inputMode="numeric"
                              placeholder="H"
                              className="rounded-md border-[#e3e3e3] h-14 text-lg focus-visible:ring-[#194a95] pl-3"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e)
                                // Update the size field with the combined value
                                const height = e.target.value
                                const length = form.getValues("sizeLength") || ""
                                if (length && height) {
                                  form.setValue("size", `${length}x${height}`)
                                } else {
                                  form.setValue("size", "")
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="sizeUnit"
                    render={({ field }) => (
                      <FormItem>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="rounded-md border-[#e3e3e3] h-14 focus:ring-[#194a95] w-16 text-lg">
                              <SelectValue placeholder="Unit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent
                            className="bg-white border rounded-md shadow-lg z-50"
                            position="popper"
                            sideOffset={5}
                          >
                            <SelectItem value="in" className="text-lg">
                              in
                            </SelectItem>
                            <SelectItem value="cm" className="text-lg">
                              cm
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Hidden field to store the combined size value */}
                <FormField
                  control={form.control}
                  name="size"
                  render={({ field }) => (
                    <FormItem className="hidden">
                      <FormControl>
                        <Input type="hidden" {...field} />
                      </FormControl>
                      {sizeParseError && <p className="text-xs text-red-500 mt-1">{sizeParseError}</p>}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="col-span-2">
                <FormLabel className="text-[#181818] font-bold block mb-2 text-lg">Pieces</FormLabel>
                <FormField
                  control={form.control}
                  name="numberOfPieces"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="text"
                          inputMode="numeric"
                          placeholder="Pieces"
                          className="rounded-md border-[#e3e3e3] h-14 text-lg focus-visible:ring-[#194a95] w-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="col-span-5">
                <div className="flex justify-between items-center mb-2">
                  <FormLabel className="text-[#181818] font-bold text-lg">Quantity Available (in sqft)</FormLabel>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={autoCalculateQuantity}
                      onCheckedChange={setAutoCalculateQuantity}
                      className="data-[state=checked]:bg-[#194a95]"
                    />
                  </div>
                </div>
                <FormField
                  control={form.control}
                  name="quantityAvailable"
                  render={({ field }) => (
                    <FormItem>
                      <div className="relative">
                        <FormControl>
                          <Input
                            type="text"
                            inputMode="numeric"
                            placeholder="in sqft"
                            className={`rounded-md border-[#e3e3e3] h-14 text-lg focus-visible:ring-[#194a95] ${
                              autoCalculateQuantity ? "bg-gray-50" : ""
                            }`}
                            readOnly={autoCalculateQuantity}
                            {...field}
                          />
                        </FormControl>
                        {autoCalculateQuantity && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                            <Calculator className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
 

            {/* Image Upload */}
            <div className="form-field">
              <FormLabel className="text-[#181818] font-bold block mb-2">
                Upload Product Images ({previews.length}/10)
              </FormLabel>
              <div className="flex gap-4 flex-wrap items-start">
                {previews.length < 10 && (
                  <label className="block border-2 border-[#383535] rounded-md w-full max-w-[100px] aspect-square cursor-pointer hover:border-[#194a95] transition-colors shrink-0">
                    <div className="flex items-center justify-center h-full">
                      <Plus className="w-8 h-8 text-[#383535]" />
                    </div>
                    <input type="file" onChange={handleImageChange} multiple accept="image/*" className="hidden" />
                  </label>
                )}

                {previews.length > 0 && (
                  <div className="flex gap-4 flex-wrap flex-1">
                    {previews.map((preview, index) => (
                      <div key={index} className="relative w-[100px] aspect-square">
                        <Image
                          src={preview || "/placeholder.svg"}
                          alt={`Preview ${index + 1}`}
                          width={100}
                          height={100}
                          className="rounded-md object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-5 h-5 flex items-center justify-center"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                You can upload up to 10 images. {previews.length} of 10 used.
              </p>
            </div>

            {/* Application Areas - Changed to checkbox buttons */}
            <div className="form-field">
              <FormLabel className="text-[#181818] font-bold block mb-2">Application Areas</FormLabel>
              <FormField
                control={form.control}
                name="applicationAreas"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {APPLICATION_AREAS.map((area) => {
                          const isSelected = field.value?.includes(area) || false
                          return (
                            <button
                              key={area}
                              type="button"
                              onClick={() => {
                                const currentValues = field.value || []
                                const newValues = isSelected
                                  ? currentValues.filter((v) => v !== area)
                                  : [...currentValues, area]
                                field.onChange(newValues)
                              }}
                              className={`flex items-center justify-between px-4 py-3 rounded-lg border ${
                                isSelected
                                  ? "bg-[#194a95] text-white border-[#194a95]"
                                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                              } transition-colors`}
                            >
                              <span>{area}</span>
                              {isSelected && <Check className="h-4 w-4 ml-2" />}
                            </button>
                          )
                        })}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Finishes */}
            <div className="form-field">
              <FormLabel className="text-[#181818] font-bold block mb-2">Finishes</FormLabel>
              <FormField
                control={form.control}
                name="finishes"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {["Polish", "Leather", "Flute", "River", "Satin", "Dual"].map((finish) => {
                          const isSelected = field.value?.includes(finish.toLowerCase()) || false
                          return (
                            <button
                              key={finish}
                              type="button"
                              onClick={() => {
                                const currentValues = field.value || []
                                const newValues = isSelected
                                  ? currentValues.filter((v) => v !== finish.toLowerCase())
                                  : [...currentValues, finish.toLowerCase()]
                                field.onChange(newValues)
                              }}
                              className={`flex items-center justify-between px-4 py-3 rounded-lg border ${
                                isSelected
                                  ? "bg-[#194a95] text-white border-[#194a95]"
                                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                              } transition-colors`}
                            >
                              <span>{finish}</span>
                              {isSelected && <Check className="h-4 w-4 ml-2" />}
                            </button>
                          )
                        })}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

          

            {/* Description */}
            <div className="form-field">
              <FormLabel className="text-[#181818] font-bold block mb-2">Description</FormLabel>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Type your description here (optional)"
                        className="min-h-[150px] rounded-md border-[#e3e3e3] focus-visible:ring-[#194a95]"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Success State with QR Code */}
            {postId && qrCodeUrl && mode === "create" && (
              <Card className="p-6 text-center space-y-4 border-green-200 bg-green-50">
                <h3 className="text-lg font-semibold text-green-600">Product Created Successfully!</h3>
                <div className="flex justify-center">
                  <Image
                    src={qrCodeUrl || "/placeholder.svg"}
                    alt="Product QR Code"
                    width={192}
                    height={192}
                    className="w-48 h-48"
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleDownloadQR}
                  className="bg-[#194a95] hover:bg-[#0f3a7a] text-white rounded-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download QR Code
                </Button>
                <p className="text-sm text-gray-500">Scan this QR code to view the product details</p>
                <p className="text-sm font-medium">Product ID: {postId}</p>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="w-full h-12 rounded-[20px]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#194a95] hover:bg-[#0f3a7a] text-white font-medium h-12 rounded-[20px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {mode === "edit" ? "Updating..." : "Saving..."}
                  </>
                ) : mode === "edit" ? (
                  "Update Product"
                ) : (
                  "Save Product"
                )}
              </Button>
            </div>

            {/* Message Display */}
            {message && (mode === "edit" || !qrCodeUrl) && (
              <div className={`text-center mt-4 ${message.type === "error" ? "text-red-500" : "text-green-500"}`}>
                {message.text}
              </div>
            )}
          </form>
        </Form>
      </div>
    </div>
  )
}
