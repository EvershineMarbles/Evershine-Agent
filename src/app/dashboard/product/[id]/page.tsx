"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import axios, { AxiosError } from "axios"
import { ArrowLeft, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Calculator } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import ProductVisualizer from "@/components/ProductVisualizer"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface Product {
  _id: string
  name: string
  category: string
  applicationAreas: string | string[]
  description: string
  image: string[]
  postId: string
  quantityAvailable: number
  price: number
  basePrice?: number
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

// Commission data interface
interface CommissionData {
  agentId: string
  name: string
  email: string
  commissionRate: number
  categoryCommissions?: Record<string, number>
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
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [showVisualizer, setShowVisualizer] = useState(false)

  // Agent pricing state
  const [commissionData, setCommissionData] = useState<CommissionData | null>(null)
  const [agentPrice, setAgentPrice] = useState<number | null>(null)
  const [priceLoading, setPriceLoading] = useState(false)

  // Get agent token
  const getAgentToken = () => {
    try {
      return localStorage.getItem("agentToken") || localStorage.getItem("adminToken")
    } catch (e) {
      console.error("Error accessing agent token:", e)
      return null
    }
  }

  // Fetch agent commission data
  const fetchAgentCommissionData = async () => {
    try {
      const token = getAgentToken()
      if (!token) return null

      const response = await fetch(`${API_URL}/api/agent/commission`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        console.error("Failed to fetch agent commission data:", response.status)
        return null
      }

      const data = await response.json()
      if (data.success && data.data) {
        setCommissionData(data.data)
        return data.data
      }
      return null
    } catch (error) {
      console.error("Error fetching agent commission data:", error)
      return null
    }
  }

  // Calculate agent price (Base Price + Agent Commission only)
  const calculateAgentPrice = (product: Product) => {
    if (!product || (!product.price && !product.basePrice)) return null

    const basePrice = product.basePrice || product.price

    // Get agent commission rate
    let agentCommissionRate = commissionData?.commissionRate || 10

    // Check for category-specific commission
    if (
      commissionData?.categoryCommissions &&
      product.category &&
      commissionData.categoryCommissions[product.category]
    ) {
      agentCommissionRate = commissionData.categoryCommissions[product.category]
    }

    // Calculate agent price: Base Price + Agent Commission only
    const finalAgentPrice = basePrice * (1 + agentCommissionRate / 100)

    console.log(`AGENT DASHBOARD PRICING for ${product.name}:`)
    console.log(`Base price: ${basePrice}`)
    console.log(`Agent commission rate: ${agentCommissionRate}%`)
    console.log(`Final agent price: ${finalAgentPrice.toFixed(2)}`)

    return Math.round(finalAgentPrice * 100) / 100
  }

  const openGallery = () => {
    setGalleryOpen(true)
  }

  const closeGallery = () => {
    setGalleryOpen(false)
  }

  // Update the useEffect to use this enhanced debugging
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        setError("")
        setPriceLoading(true)

        if (!params.id) {
          throw new Error("Product ID is missing")
        }

        // Fetch commission data first
        await fetchAgentCommissionData()

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
        setPriceLoading(false)
      }
    }

    fetchProduct()
  }, [params.id])

  // Calculate agent price when commission data and product are available
  useEffect(() => {
    if (product && commissionData) {
      const calculatedPrice = calculateAgentPrice(product)
      setAgentPrice(calculatedPrice)
    }
  }, [product, commissionData])

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
    console.log("========== AGENT DASHBOARD PRODUCT DATA BEFORE RENDER ==========")
    console.log("Size:", product.size)
    console.log("Number of Pieces:", product.numberOfPieces)
    console.log("Thickness:", product.thickness)
    console.log("Agent Price:", agentPrice)
    console.log("=================================================================")
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
              <div className="aspect-[4/3] relative cursor-pointer" onClick={openGallery}>
                <Image
                  src={
                    imageLoadError[currentImageIndex]
                      ? "/placeholder.svg"
                      : product.image[currentImageIndex] || "/placeholder.svg"
                  }
                  alt={product.name}
                  fill
                  className="object-cover"
                  onError={() => handleImageError(currentImageIndex)}
                  priority
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

            {/* Product Category */}
            <div className="pb-4 border-b border-gray-200">
              <p className="text-gray-500">Product Category</p>
              <p className="text-xl font-bold mt-1">{product.category}</p>
            </div>

            {/* Agent Price Section - NEW */}
            <div className="pb-4 border-b border-gray-200">
              <p className="text-gray-500">Agent Price (per sqft)</p>
              {priceLoading ? (
                <div className="flex items-center mt-1">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-[#194a95] mr-2"></div>
                  <p className="text-lg text-gray-500">Calculating price...</p>
                </div>
              ) : agentPrice !== null ? (
                <div className="mt-1">
                  <p className="text-3xl font-bold text-[#194a95]">
                    ₹
                    {agentPrice.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Base price + agent commission</p>
                  {/* Show commission rate for debugging (can be removed in production) */}
                  {process.env.NODE_ENV === "development" && commissionData && (
                    <p className="text-xs text-gray-400 mt-1">
                      Commission:{" "}
                      {commissionData.categoryCommissions?.[product.category] || commissionData.commissionRate}%
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xl font-bold mt-1 text-gray-500">Price not available</p>
              )}
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
          <ProductVisualizer productImage={product.image[0]} productName={product.name} />
        </div>
      )}

      {/* Disclaimer */}
      <div className="max-w-6xl mx-auto mt-8 pt-4 border-t">
        <p className="text-gray-500 text-sm italic text-center">Disclaimer: Actual quantity can differ</p>
      </div>
      {/* Image Gallery Modal */}
      {galleryOpen && product.image.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl mx-auto">
            {/* Close button */}
            <button
              onClick={closeGallery}
              className="absolute right-4 top-4 z-10 bg-white/20 hover:bg-white/40 p-2 rounded-full transition-colors"
              aria-label="Close gallery"
            >
              <ArrowLeft className="h-6 w-6 text-white" />
            </button>

            {/* Main gallery image */}
            <div className="relative aspect-[4/3] w-full">
              <Image
                src={
                  imageLoadError[currentImageIndex]
                    ? "/placeholder.svg"
                    : product.image[currentImageIndex] || "/placeholder.svg"
                }
                alt={product.name}
                fill
                className="object-contain"
                onError={() => handleImageError(currentImageIndex)}
                priority
              />
            </div>

            {/* Gallery navigation */}
            {product.image.length > 1 && (
              <>
                <button
                  onClick={previousImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 p-3 rounded-full transition-all"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-8 w-8 text-white" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 p-3 rounded-full transition-all"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-8 w-8 text-white" />
                </button>

                {/* Thumbnails */}
                <div className="flex justify-center mt-4 gap-2 overflow-x-auto py-2">
                  {product.image.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => handleThumbnailClick(index)}
                      className={`relative rounded-md overflow-hidden h-16 w-16 flex-shrink-0 ${
                        selectedThumbnail === index ? "ring-2 ring-white" : ""
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
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
