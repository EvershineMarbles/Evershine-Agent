"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import axios, { AxiosError } from "axios"
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Calculator,
  Download,
} from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
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
import { Badge } from "@/components/ui/badge"
import QRCodeGenerator from "@/components/QRCodeGenerator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import ProductVisualizer from "@/components/ProductVisualizer"


const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface Product {
  _id: string
  name: string
  price: number
  category: string
  applicationAreas: string | string[]
  description: string
  image: string[]
  postId: string
  quantityAvailable: number
  size?: string
  sizeUnit?: string
  numberOfPieces?: number | null
  thickness?: string
  finishes?: string
}

interface ApiResponse {
  success: boolean
  data?: Product[]
  msg?: string
}

// Add this enhanced debugging function at the top of the component, before the useEffect
const debugProductData = (data: any) => {
  console.log("========== PRODUCT DATA DEBUGGING ==========")
  console.log("Raw product data:", JSON.stringify(data, null, 2))

  // Detailed logging for size
  console.log("SIZE FIELD:")
  console.log("  Value:", data.size)
  console.log("  Type:", typeof data.size)
  console.log("  Is empty string:", data.size === "")
  console.log("  Is null:", data.size === null)
  console.log("  Is undefined:", data.size === undefined)
  console.log("  Property exists:", Object.prototype.hasOwnProperty.call(data, "size"))

  // Detailed logging for numberOfPieces
  console.log("NUMBER OF PIECES FIELD:")
  console.log("  Value:", data.numberOfPieces)
  console.log("  Type:", typeof data.numberOfPieces)
  console.log("  Is zero:", data.numberOfPieces === 0)
  console.log("  Is null:", data.numberOfPieces === null)
  console.log("  Is undefined:", data.numberOfPieces === undefined)
  console.log("  Property exists:", Object.prototype.hasOwnProperty.call(data, "numberOfPieces"))

  // Detailed logging for thickness
  console.log("THICKNESS FIELD:")
  console.log("  Value:", data.thickness)
  console.log("  Type:", typeof data.thickness)
  console.log("  Is empty string:", data.thickness === "")
  console.log("  Is null:", data.thickness === null)
  console.log("  Is undefined:", data.thickness === undefined)
  console.log("  Property exists:", Object.prototype.hasOwnProperty.call(data, "thickness"))

  console.log("All keys in product object:", Object.keys(data))
  console.log("=========================================")
}

// Function to calculate how quantity was derived
const calculateQuantityFormula = (size: string, sizeUnit: string, numberOfPieces: number): string | null => {
  if (!size || !numberOfPieces) return null

  // Parse size (e.g., "60x120")
  const match = size.replace(/\s+/g, "").match(/^(\d+(?:\.\d+)?)[x*-](\d+(?:\.\d+)?)$/)
  if (!match) return null

  const length = Number.parseFloat(match[1])
  const height = Number.parseFloat(match[2])

  if (sizeUnit === "inches") {
    const calculatedQuantity = ((length * height * numberOfPieces) / 144).toFixed(2)
    return `(${length} × ${height} × ${numberOfPieces}) ÷ 144 = ${calculatedQuantity} sqft`
  } else {
    const calculatedQuantity = ((length * height * numberOfPieces) / 929).toFixed(2)
    return `(${length} × ${height} × ${numberOfPieces}) ÷ 929 = ${calculatedQuantity} sqft`
  }
}

export default function ProductDetail() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [selectedThumbnail, setSelectedThumbnail] = useState(0)
  const [imageLoadError, setImageLoadError] = useState<boolean[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("")
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [quantityFormula, setQuantityFormula] = useState<string | null>(null)
  const [showGallery, setShowGallery] = useState(false)
  const [showVisualizer, setShowVisualizer] = useState(false)


  // Update the useEffect to use this enhanced debugging
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        setError("")

        if (!params.id) {
          throw new Error("Product ID is missing")
        }

        const response = await axios.get<ApiResponse>(`${API_URL}/api/getPostDataById`, {
          params: { id: params.id },
        })

        if (response.data.success && response.data.data?.[0]) {
          const productData = response.data.data[0]
          console.log("Product data received from API:", JSON.stringify(productData, null, 2))
          debugProductData(productData)

          // Add missing fields if they don't exist
          const processedProduct = {
            ...productData,
            size: productData.size !== undefined ? productData.size : "",
            sizeUnit: productData.sizeUnit || "inches",
            numberOfPieces: productData.numberOfPieces !== undefined ? productData.numberOfPieces : null,
            thickness: productData.thickness !== undefined ? productData.thickness : "",
            finishes: productData.finishes || "",
          }

          console.log("Processed product with added fields:", processedProduct)

          setProduct(processedProduct)
          setImageLoadError(new Array(productData.image.length).fill(false))

          // Calculate quantity formula if all required fields are present
          if (processedProduct.size && processedProduct.numberOfPieces) {
            const formula = calculateQuantityFormula(
              processedProduct.size,
              processedProduct.sizeUnit || "inches",
              Number(processedProduct.numberOfPieces),
            )
            setQuantityFormula(formula)
          }
        } else {
          throw new Error(response.data.msg || "No data found")
        }
      } catch (error) {
        let errorMessage = "Error fetching product"

        if (error instanceof AxiosError) {
          errorMessage = error.response?.data?.msg || error.message
        } else if (error instanceof Error) {
          errorMessage = error.message
        }

        console.error("Error fetching product:", error)
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [params.id])

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      const response = await axios.delete(`${API_URL}/api/deleteProduct/${product?.postId}`)

      if (response.data.success) {
        router.push("/products")
      } else {
        throw new Error(response.data.msg || "Failed to delete product")
      }
    } catch (error) {
      let errorMessage = "Error deleting product"
      if (error instanceof AxiosError) {
        errorMessage = error.response?.data?.msg || error.message
      } else if (error instanceof Error) {
        errorMessage = error.message
      }
      setError(errorMessage)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleThumbnailClick = (index: number) => {
    setCurrentImageIndex(index)
    setSelectedThumbnail(index)
  }

  const handleImageError = (index: number) => {
    setImageLoadError((prev) => {
      const newErrors = [...prev]
      newErrors[index] = true
      return newErrors
    })
  }

  const nextImage = () => {
    if (product) {
      setCurrentImageIndex((prev) => (prev + 1) % product.image.length)
      setSelectedThumbnail((prev) => (prev + 1) % product.image.length)
    }
  }

  const previousImage = () => {
    if (product) {
      setCurrentImageIndex((prev) => (prev === 0 ? product.image.length - 1 : prev - 1))
      setSelectedThumbnail((prev) => (prev === 0 ? product.image.length - 1 : prev - 1))
    }
  }

  const generateAndDownloadQR = async () => {
    try {
      if (!product) return

      // If we already have a QR code URL, just download it
      if (qrCodeUrl) {
        downloadQRCode()
        return
      }

      // Import QRCode dynamically to avoid SSR issues
      const QRCode = (await import("qrcode")).default

      // Generate the product URL
      const productUrl = `${window.location.origin}/product/${product.postId}`

      // Generate QR code
      const qrCodeDataUrl = await QRCode.toDataURL(productUrl, {
        width: 200,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      })

      setQrCodeUrl(qrCodeDataUrl)

      // Download after generating
      setTimeout(downloadQRCode, 100)
    } catch (error) {
      console.error("Error generating QR code:", error)
    }
  }

  const downloadQRCode = () => {
    if (!qrCodeUrl || !product) return

    const link = document.createElement("a")
    link.href = qrCodeUrl
    link.download = `evershine-product-${product.postId}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const downloadSimpleQRCode = async () => {
    try {
      if (!product) return

      // Import QRCode dynamically to avoid SSR issues
      const QRCode = (await import("qrcode")).default

      // Generate the product URL
      const productUrl = `${window.location.origin}/product/${product.postId}`

      // Generate QR code
      const qrCodeDataUrl = await QRCode.toDataURL(productUrl, {
        width: 300,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      })

      // Download the QR code
      const link = document.createElement("a")
      link.href = qrCodeDataUrl
      link.download = `evershine-qr-${product.postId}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Error generating QR code:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#194a95]"></div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md p-6 text-center space-y-2">
          <h2 className="text-xl font-medium text-gray-900">{error || "No data found"}</h2>
          <p className="text-sm text-gray-500">Product ID: {params.id}</p>
          <Button onClick={() => router.push("/")} className="mt-4 bg-[#194a95]">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    )
  }

  // Parse application areas safely, handling both string and array types
  const getApplicationAreas = () => {
    if (!product.applicationAreas) return []

    if (typeof product.applicationAreas === "string") {
      return product.applicationAreas
        .split(",")
        .filter(Boolean)
        .map((area) => area.trim())
    }

    if (Array.isArray(product.applicationAreas)) {
      return product.applicationAreas
    }

    return []
  }

  const applicationAreas = getApplicationAreas()

  // Also add debugging right before rendering
  if (product) {
    console.log("========== PRODUCT DATA BEFORE RENDER ==========")
    console.log("Size:", product.size)
    console.log("Number of Pieces:", product.numberOfPieces)
    console.log("Thickness:", product.thickness)
    console.log("=================================================")
  }

  return (
    <div className="min-h-screen bg-white p-6">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="mb-6 hover:bg-gray-100 p-2 rounded-full transition-colors"
        aria-label="Go back"
      >
        <ArrowLeft className="h-6 w-6" />
      </button>

      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:gap-12">
          {/* Images Section */}
          <div className="w-full md:w-1/2 md:order-2 mb-8 md:mb-0">
            {/* Main Image with Navigation Arrows */}
            <div className="relative rounded-2xl overflow-hidden bg-gray-100 mb-4">
              <div className="aspect-[4/3] relative">
                <Image
                  src={
                    imageLoadError[currentImageIndex]
                      ? "/placeholder.svg"
                      : product.image[currentImageIndex] || "/placeholder.svg"
                  }
                  alt={product.name}
                  fill
                  className="object-cover cursor-pointer"
                  onError={() => handleImageError(currentImageIndex)}
                  priority
                  onClick={() => setShowGallery(true)}
                />

                {/* Navigation Arrows */}
                {product.image.length > 1 && (
                  <>
                    <button
                      onClick={previousImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="h-6 w-6 text-gray-800" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all"
                      aria-label="Next image"
                    >
                      <ChevronRight className="h-6 w-6 text-gray-800" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Thumbnails */}
            {product.image.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {product.image.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => handleThumbnailClick(index)}
                    className={`relative rounded-xl overflow-hidden aspect-square ${
                      selectedThumbnail === index ? "ring-2 ring-[#194a95]" : ""
                    }`}
                  >
                    <Image
                      src={imageLoadError[index] ? "/placeholder.svg" : img || "/placeholder.svg"}
                      alt={`${product.name} thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                      onError={() => handleImageError(index)}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="w-full md:w-1/2 md:order-1 space-y-6">
            {/* Product Name */}
            <div className="pb-4 border-b border-gray-200">
              <p className="text-gray-500">Product Name</p>
              <h1 className="text-3xl font-bold mt-1">{product.name}</h1>
            </div>

            {/* Price */}
            <div className="pb-4 border-b border-gray-200">
              <p className="text-gray-500">Price (per sqft)</p>
              <p className="text-xl font-bold mt-1">₹{product.price}/per sqft</p>
            </div>

            {/* Product Category */}
            <div className="pb-4 border-b border-gray-200">
              <p className="text-gray-500">Product Category</p>
              <p className="text-xl font-bold mt-1">{product.category}</p>
            </div>

            {/* Quantity Available */}
            <div className="pb-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <p className="text-gray-500">Quantity Available (in sqft)</p>
                {quantityFormula && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center text-gray-500 cursor-help">
                          <Calculator className="h-4 w-4 mr-1" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-sm">{quantityFormula}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <p className="text-xl font-bold mt-1">{product.quantityAvailable}</p>
            </div>

            {/* Size, No. of Pieces, and Thickness in 3 columns */}
            <div className="grid grid-cols-3 gap-4 pb-4 border-b border-gray-200">
              <div>
                <p className="text-gray-500">Size</p>
                <p className="text-lg font-bold mt-1">
                  {product.size !== undefined && product.size !== null && product.size !== ""
                    ? `${product.size} ${product.sizeUnit || "inches"}`
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-gray-500">No. of Pieces</p>
                <p className="text-lg font-bold mt-1">
                  {product.numberOfPieces !== undefined && product.numberOfPieces !== null
                    ? product.numberOfPieces
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Thickness</p>
                <p className="text-lg font-bold mt-1">
                  {product.thickness !== undefined && product.thickness !== null && product.thickness !== ""
                    ? product.thickness
                    : "-"}
                </p>
              </div>
            </div>

            {/* Finishes */}
            {product.finishes && (
              <div className="pb-4 border-b border-gray-200">
                <p className="text-gray-500">Finishes</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {typeof product.finishes === "string" ? (
                    product.finishes.split(",").map((finish, index) => (
                      <Badge
                        key={index}
                        className="bg-[#194a95] hover:bg-[#194a95] text-white px-3 py-1 text-sm capitalize"
                      >
                        {finish.trim()}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-lg font-bold mt-1 capitalize">No finishes specified</p>
                  )}
                </div>
              </div>
            )}

            {/* Application Areas */}
            <div className="pb-4 border-b border-gray-200">
              <p className="text-gray-500">Application Areas</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {applicationAreas.length > 0 ? (
                  applicationAreas.map((area, index) => (
                    <Badge key={index} className="bg-[#194a95] hover:bg-[#194a95] text-white px-3 py-1 text-sm">
                      {area}
                    </Badge>
                  ))
                ) : (
                  <p className="text-gray-600">No application areas specified</p>
                )}
              </div>
            </div>

            {/* About Product - Modified to show only 2 lines initially */}
            <div className="pb-4 border-b border-gray-200">
              <p className="text-gray-800">About Product</p>
              <div className="mt-1">
                <p
                  className={`text-xl font-normal ${!showFullDescription ? "line-clamp-2" : ""} transition-all duration-200`}
                >
                  {product.description || "Product mainly used for countertop"}
                </p>
                {(product.description?.length || 0) > 80 && (
                  <button
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="text-[#194a95] hover:text-[#0f3a7a] mt-1 text-sm flex items-center"
                  >
                    {showFullDescription ? (
                      <>
                        Show less <ChevronUp className="ml-1 h-4 w-4" />
                      </>
                    ) : (
                      <>
                        View more <ChevronDown className="ml-1 h-4 w-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={() => router.push(`/admin/dashboard/edit-product/${product.postId}`)}
                className="px-8 py-3 bg-[#194a95] hover:bg-[#0f3a7a] text-white rounded-md"
              >
                Edit
              </Button>

              <Button
                onClick={downloadSimpleQRCode}
                className="px-8 py-3 bg-[#194a95] hover:bg-[#0f3a7a] text-white rounded-md"
              >
                <Download className="mr-2 h-4 w-4" />
                Download QR
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="px-8 py-3" disabled={isDeleting}>
                    {isDeleting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-white">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the product and remove all associated
                      data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-gray-100 hover:bg-gray-200">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>


        {/* Visualizer Button */}
        <div className="pb-4 border-b border-gray-200 mt-4">
              <Button
                onClick={() => setShowVisualizer(!showVisualizer)}
                className="w-full bg-[#194a95] hover:bg-[#0f3a7a] py-3 text-white"
              >
                {showVisualizer ? "Hide Visualizer" : "Show Product Visualizer"}
              </Button>
            </div>
          {/* Product Visualizer Section */}
          {showVisualizer && product.image.length > 0 && (
            <div className="mt-4">
              <ProductVisualizer productImage={product.image[0]} productName={product.name}  />
            </div>
          )}

        {/* QR Code Section */}
        <div className="max-w-6xl mx-auto mt-12 border-t pt-8">
          <h2 className="text-2xl font-bold mb-6">Product QR Code</h2>
          {product && (
            <QRCodeGenerator
              productId={product.postId}
              productName={product.name}
              category={product.category}
              thickness={product.thickness}
              size={product.size}
            />
          )}
        </div>


        {/* Disclaimer */}
        <div className="max-w-6xl mx-auto mt-8 pt-4 border-t">
          <p className="text-gray-500 text-sm italic text-center">Disclaimer: Actual quantity can differ</p>
        </div>
      </div>
      {/* Image Gallery Modal */}
      {showGallery && product.image.length > 0 && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowGallery(false)}
        >
          <div
            className="relative max-w-4xl w-full h-full max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              className="absolute right-2 top-2 z-10 bg-white/20 hover:bg-white/40 rounded-full p-2 text-white"
              onClick={() => setShowGallery(false)}
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
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            {/* Main gallery image */}
            <div className="relative flex-1 bg-black">
              <div className="absolute inset-0 flex items-center justify-center">
                <Image
                  src={imageLoadError[currentImageIndex] ? "/placeholder.svg" : product.image[currentImageIndex]}
                  alt={`${product.name} - Image ${currentImageIndex + 1}`}
                  fill
                  className="object-contain"
                  onError={() => handleImageError(currentImageIndex)}
                />
              </div>

              {/* Image counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                {currentImageIndex + 1} / {product.image.length}
              </div>

              {/* Navigation arrows */}
              {product.image.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      previousImage()
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 p-3 rounded-full"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-6 w-6 text-white" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      nextImage()
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 p-3 rounded-full"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-6 w-6 text-white" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {product.image.length > 1 && (
              <div className="bg-black/80 p-4 overflow-x-auto">
                <div className="flex space-x-2 justify-center">
                  {product.image.map((img, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleThumbnailClick(index)
                      }}
                      className={`relative h-16 w-16 flex-shrink-0 rounded overflow-hidden ${
                        selectedThumbnail === index ? "ring-2 ring-[#194a95]" : "opacity-70"
                      }`}
                    >
                      <Image
                        src={imageLoadError[index] ? "/placeholder.svg" : img}
                        alt={`${product.name} thumbnail ${index + 1}`}
                        fill
                        className="object-cover"
                        onError={() => handleImageError(index)}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
