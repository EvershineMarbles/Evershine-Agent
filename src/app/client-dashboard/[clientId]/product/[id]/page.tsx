"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import Image from "next/image"

interface Product {
  id: string
  name: string
  description: string
  images: string[]
  price: number
  category: string
  stockQuantity: number
  clientId: string
  createdAt: string
  updatedAt: string
}

const ProductPage = () => {
  const { id, clientId } = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showVisualizer, setShowVisualizer] = useState(false)
  const visualizerRef = useRef<HTMLDivElement>(null)
  const [customQuantity, setCustomQuantity] = useState<number>(0)
  const [customFinish, setCustomFinish] = useState<string>("polish")
  const [customThickness, setCustomThickness] = useState<string>("")
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [newImages, setNewImages] = useState<File[]>([])
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const [isAddingImages, setIsAddingImages] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (status === "loading") {
      return // Wait for session to load
    }

    if (!session?.user) {
      router.push("/") // Redirect if not authenticated
    }

    const fetchProduct = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/client-dashboard/${clientId}/product/${id}`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        setProduct(data)
      } catch (error) {
        console.error("Failed to fetch product:", error)
        toast({
          title: "Error",
          description: "Failed to fetch product. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (id && clientId) {
      fetchProduct()
    }
  }, [id, clientId, router, session?.user, status])

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/client-dashboard/${clientId}/product/${id}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      toast.success("Product deleted successfully!")
      router.push(`/client-dashboard/${clientId}`)
    } catch (error) {
      console.error("Failed to delete product:", error)
      toast({
        title: "Error",
        description: "Failed to delete product. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleImageUpload = async () => {
    if (newImages.length === 0) {
      toast({
        title: "Error",
        description: "Please select images to upload.",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    setProgress(0) // Reset progress

    try {
      const formData = new FormData()
      for (let i = 0; i < newImages.length; i++) {
        formData.append("images", newImages[i])
      }

      const xhr = new XMLHttpRequest()
      xhr.open("POST", `/api/client-dashboard/${clientId}/product/${id}/images`, true)

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100
          setProgress(percentComplete)
        }
      })

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const responseData = JSON.parse(xhr.responseText)
          setProduct(responseData)
          toast.success("Images uploaded successfully!")
        } else {
          toast({
            title: "Error",
            description: "Failed to upload images. Please try again.",
            variant: "destructive",
          })
        }
        setUploading(false)
        setProgress(0)
        setNewImages([])
        setPreviewImages([])
        setIsAddingImages(false)
      }

      xhr.onerror = () => {
        toast({
          title: "Error",
          description: "Failed to upload images. Please try again.",
          variant: "destructive",
        })
        setUploading(false)
        setProgress(0)
      }

      xhr.send(formData)
    } catch (error) {
      console.error("Image upload failed:", error)
      toast({
        title: "Error",
        description: "Failed to upload images. Please try again.",
        variant: "destructive",
      })
      setUploading(false)
      setProgress(0)
    }
  }

  const handleImageDelete = async (imageUrl: string) => {
    try {
      const response = await fetch(`/api/client-dashboard/${clientId}/product/${id}/images`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageUrl }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const updatedProduct = await response.json()
      setProduct(updatedProduct)
      toast.success("Image deleted successfully!")
    } catch (error) {
      console.error("Failed to delete image:", error)
      toast({
        title: "Error",
        description: "Failed to delete image. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (!files || files.length === 0) return

    const newFiles = files.filter(
      (file) => file.type.startsWith("image/"), // Only allow image files
    )

    if (newFiles.length !== files.length) {
      toast({
        title: "Error",
        description: "Only image files are allowed.",
        variant: "destructive",
      })
      return
    }

    setNewImages((prevImages) => [...prevImages, ...newFiles])

    // Create preview URLs for the newly selected images
    const newPreviews = newFiles.map((file) => URL.createObjectURL(file))
    setPreviewImages((prevPreviews) => [...prevPreviews, ...newPreviews])
  }

  return (
    <div className="container mx-auto py-10">
      {isLoading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-10 w-[380px]" />
          <Skeleton className="h-[300px] w-full" />
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-6 w-[150px]" />
          <Skeleton className="h-4 w-[100px]" />
        </div>
      ) : product ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column */}
          <div>
            <h1 className="text-2xl font-bold mb-4">{product.name}</h1>

            {/* Image Carousel */}
            {product.images && product.images.length > 0 ? (
              <Carousel className="w-full max-w-lg">
                <CarouselContent className="-ml-1 pl-1">
                  {product.images.map((image, index) => (
                    <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                      <div className="p-1">
                        <AspectRatio ratio={16 / 9}>
                          <Image
                            src={image || "/placeholder.svg"}
                            alt={`${product.name} - Image ${index + 1}`}
                            className="rounded-md object-cover"
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        </AspectRatio>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-2" />
                <CarouselNext className="right-2" />
              </Carousel>
            ) : (
              <div className="w-full max-w-lg">
                <AspectRatio ratio={16 / 9}>
                  <Image
                    src="/placeholder.jpg"
                    alt="Placeholder"
                    className="rounded-md object-cover"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </AspectRatio>
              </div>
            )}

            {/* Image Management Section */}
            <div className="mt-4">
              <Accordion type="single" collapsible>
                <AccordionItem value="item-1">
                  <AccordionTrigger>Manage Images</AccordionTrigger>
                  <AccordionContent>
                    {/* Add Images Section */}
                    <div className="mb-4">
                      <Label htmlFor="newImages">Add New Images</Label>
                      <Input
                        type="file"
                        id="newImages"
                        multiple
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="w-full mt-2"
                      />
                      {previewImages.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {previewImages.map((preview, index) => (
                            <div key={index} className="relative w-24 h-24">
                              <Image
                                src={preview || "/placeholder.svg"}
                                alt={`Preview ${index + 1}`}
                                className="rounded-md object-cover"
                                fill
                              />
                              <Button
                                variant="destructive"
                                size="icon"
                                className="absolute top-0 right-0 rounded-full shadow-md"
                                onClick={() => {
                                  setNewImages((prevImages) => prevImages.filter((_, i) => i !== index))
                                  setPreviewImages((prevPreviews) => prevPreviews.filter((_, i) => i !== index))
                                }}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="24"
                                  height="24"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="h-4 w-4"
                                >
                                  <line x1="18" y1="6" x2="6" y2="18" />
                                  <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      {uploading && (
                        <div className="mt-2">
                          <Progress value={progress} />
                          <p className="text-sm text-muted-foreground">Uploading... {Math.round(progress)}%</p>
                        </div>
                      )}
                      <Button
                        onClick={handleImageUpload}
                        disabled={uploading || newImages.length === 0}
                        className="w-full bg-[#194a95] hover:bg-[#0f3a7a] py-3 text-white rounded-xl mt-4"
                      >
                        {uploading ? "Uploading..." : "Upload Images"}
                      </Button>
                    </div>

                    {/* Existing Images Section */}
                    {product.images && product.images.length > 0 && (
                      <div>
                        <h4 className="text-md font-semibold mb-2">Existing Images</h4>
                        <div className="flex flex-wrap gap-2">
                          {product.images.map((image, index) => (
                            <div key={index} className="relative w-24 h-24">
                              <Image
                                src={image || "/placeholder.svg"}
                                alt={`${product.name} - Image ${index + 1}`}
                                className="rounded-md object-cover"
                                fill
                              />
                              <Button
                                variant="destructive"
                                size="icon"
                                className="absolute top-0 right-0 rounded-full shadow-md"
                                onClick={() => handleImageDelete(image)}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="24"
                                  height="24"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="h-4 w-4"
                                >
                                  <line x1="18" y1="6" x2="6" y2="18" />
                                  <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* Product Description */}
            <div className="mt-6">
              <h2 className="text-lg font-semibold">Description</h2>
              <p className="text-gray-700">{product.description}</p>
            </div>

            {/* Product Visualizer Button */}
            <div className="mt-4">
              <Button
                onClick={() => {
                  if (!showVisualizer) {
                    setShowVisualizer(true)
                    // Scroll to visualizer section after a short delay to ensure it's rendered
                    setTimeout(() => {
                      visualizerRef.current?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      })
                    }, 100)
                  } else {
                    setShowVisualizer(false)
                  }
                }}
                className="w-full bg-[#194a95] hover:bg-[#0f3a7a] py-3 text-white rounded-xl"
              >
                {showVisualizer ? "Hide Product Visualizer" : "Show Product Visualizer"}
              </Button>
            </div>

            {/* Custom Fields Section */}
            <div className="mt-6 space-y-4 p-4 bg-gray-50 rounded-xl">
              <h3 className="text-lg font-semibold text-gray-900">Customize Your Order</h3>

              <div>
                <Label htmlFor="customQuantity">Quantity (sqft)</Label>
                <Input
                  type="number"
                  id="customQuantity"
                  placeholder="Enter quantity"
                  value={customQuantity}
                  onChange={(e) => setCustomQuantity(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <Label htmlFor="customFinish">Finish</Label>
                <Select onValueChange={(value) => setCustomFinish(value)} defaultValue={customFinish}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select finish" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="polish">Polish</SelectItem>
                    <SelectItem value="leather">Leather</SelectItem>
                    <SelectItem value="flute">Flute</SelectItem>
                    <SelectItem value="river">River</SelectItem>
                    <SelectItem value="satin">Satin</SelectItem>
                    <SelectItem value="dual">Dual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="customThickness">Thickness (mm)</Label>
                <Input
                  type="text"
                  id="customThickness"
                  placeholder="Enter thickness"
                  value={customThickness}
                  onChange={(e) => setCustomThickness(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div>
            {/* Product Details */}
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Details</h2>
                <ul className="list-disc pl-5 text-gray-700">
                  <li>
                    <strong>Price:</strong> ${product.price}
                  </li>
                  <li>
                    <strong>Category:</strong> {product.category}
                  </li>
                  <li>
                    <strong>Stock Quantity:</strong> {product.stockQuantity}
                  </li>
                </ul>
              </div>

              {/* Dates */}
              <div>
                <h2 className="text-lg font-semibold">Dates</h2>
                <ul className="list-disc pl-5 text-gray-700">
                  <li>
                    <strong>Created At:</strong> {new Date(product.createdAt).toLocaleDateString()}
                  </li>
                  <li>
                    <strong>Updated At:</strong> {new Date(product.updatedAt).toLocaleDateString()}
                  </li>
                </ul>
              </div>
            </div>

            {/* Product Actions */}
            <div className="mt-6 flex gap-4">
              <Button
                onClick={() => router.push(`/client-dashboard/${clientId}/product/${product.id}/edit`)}
                className="bg-[#194a95] hover:bg-[#0f3a7a] py-3 text-white rounded-xl"
              >
                Edit Product
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    disabled={isDeleting}
                    className="bg-red-500 hover:bg-red-700 text-white rounded-xl"
                  >
                    Delete Product
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the product from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                      {isDeleting ? (
                        <svg
                          className="animate-spin h-5 w-5 mr-2"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      ) : null}
                      Continue
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <p>Product not found.</p>
        </div>
      )}

      {/* Product Visualizer Section */}
      {showVisualizer && (
        <div ref={visualizerRef} className="mt-10">
          <h2 className="text-2xl font-bold mb-4">Product Visualizer</h2>
          <p>
            This is where the product visualizer will be implemented. You can integrate a 3D viewer or any other
            interactive tool here.
          </p>
        </div>
      )}
    </div>
  )
}

export default ProductPage
