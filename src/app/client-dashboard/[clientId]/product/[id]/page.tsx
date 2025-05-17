"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import axios, { AxiosError } from "axios"
import { ArrowLeft, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Heart, X } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { ToastAction } from "@/components/ui/toast"
import ProductVisualizer from "@/components/ProductVisualizer"


const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://evershinebackend-2.onrender.com"

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
  numberOfPieces?: number | null
  thickness?: string
  basePrice?: number
}

interface CommissionData {
  agentId: string
  name: string
  email: string
  commissionRate: number
  categoryCommissions?: Record<string, number>
}

interface ApiResponse {
  success: boolean
  data?: Product[]
  msg?: string
}

export default function ProductDetail() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [selectedThumbnail, setSelectedThumbnail] = useState(0)
  const [imageLoadError, setImageLoadError] = useState<boolean[]>([])
  const [wishlistLoading, setWishlistLoading] = useState(false)
  const [inWishlist, setInWishlist] = useState(false)
  const clientId = params.clientId as string
  const [commissionData, setCommissionData] = useState<CommissionData | null>(null)
  const [overrideCommissionRate, setOverrideCommissionRate] = useState<number | null>(null)
  const [commissionLoading, setCommissionLoading] = useState(false)
  const [basePrice, setBasePrice] = useState<number | null>(null)
  const [showFullDescription, setShowFullDescription] = useState(false)
  // Gallery state
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [showVisualizer, setShowVisualizer] = useState(false)


  // Load saved commission rate from localStorage on component mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Use a client-specific key for commission rate
      const savedRate = localStorage.getItem(`commission-override-${clientId}`)
      if (savedRate) {
        setOverrideCommissionRate(Number(savedRate))
      } else {
        // Reset to null if no saved rate for this client
        setOverrideCommissionRate(null)
      }
    }
  }, [clientId])

  // Add fetchCommissionData function
  const fetchCommissionData = async () => {
    try {
      setCommissionLoading(true)
      const token = localStorage.getItem("clientImpersonationToken")
      if (!token) {
        return null
      }

      const response = await fetch(`${API_URL}/api/client/agent-commission`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        return null
      }

      const data = await response.json()
      if (data.success && data.data) {
        setCommissionData(data.data)
        return data.data
      }
      return null
    } catch (error) {
      console.error("Error fetching commission data:", error)
      return null
    } finally {
      setCommissionLoading(false)
    }
  }

  // Add calculateAdjustedPrice function with override support
  const calculateAdjustedPrice = (price: number, category: string) => {
    // Use the base price if available
    const productBasePrice = basePrice || price

    // Get the default commission rate (from agent or category-specific)
    let defaultRate = commissionData?.commissionRate || 10

    // Check for category-specific commission
    if (commissionData?.categoryCommissions && category && commissionData.categoryCommissions[category]) {
      defaultRate = commissionData.categoryCommissions[category]
    }

    // Add the override rate to the default rate if an override is set
    const finalRate = overrideCommissionRate !== null ? defaultRate + overrideCommissionRate : defaultRate

    // Calculate adjusted price based on the original basePrice
    const adjustedPrice = productBasePrice * (1 + finalRate / 100)
    return Math.round(adjustedPrice * 100) / 100 // Round to 2 decimal places
  }

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        setError("")

        if (!params.id) {
          throw new Error("Product ID is missing")
        }

        // First fetch commission data
        await fetchCommissionData()

        const response = await axios.get<ApiResponse>(`${API_URL}/api/getPostDataById`, {
          params: { id: params.id },
        })

        if (response.data.success && response.data.data?.[0]) {
          const productData = response.data.data[0]

          // Store the base price
          setBasePrice(productData.basePrice || productData.price)

          // Add missing fields if they don't exist
          const processedProduct = {
            ...productData,
            size: productData.size !== undefined ? productData.size : "",
            numberOfPieces: productData.numberOfPieces !== undefined ? productData.numberOfPieces : null,
            thickness: productData.thickness !== undefined ? productData.thickness : "",
          }

          setProduct(processedProduct)
          setImageLoadError(new Array(productData.image.length).fill(false))

          // Check if product is in wishlist
          checkWishlistStatus(productData.postId)
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

  // Check if product is in wishlist
  const checkWishlistStatus = async (productId: string) => {
    try {
      // First check localStorage
      const savedWishlist = localStorage.getItem("wishlist")
      if (savedWishlist) {
        const wishlistItems = JSON.parse(savedWishlist)
        if (wishlistItems.includes(productId)) {
          setInWishlist(true)
          return
        }
      }

      // Then check API
      const token = localStorage.getItem("clientImpersonationToken")
      if (!token) return

      const response = await fetch(`${API_URL}/api/getUserWishlist`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data && Array.isArray(data.data.items)) {
          const isInWishlist = data.data.items.some((item: any) => item.postId === productId)
          setInWishlist(isInWishlist)
        }
      }
    } catch (error) {
      console.error("Error checking wishlist status:", error)
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

  // Open gallery when main image is clicked
  const openGallery = () => {
    setGalleryOpen(true)
    // Prevent body scrolling when gallery is open
    if (typeof document !== "undefined") {
      document.body.style.overflow = "hidden"
    }
  }

  // Close gallery
  const closeGallery = () => {
    setGalleryOpen(false)
    // Restore body scrolling
    if (typeof document !== "undefined") {
      document.body.style.overflow = ""
    }
  }

  // Handle keyboard navigation in gallery
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!galleryOpen) return

      if (e.key === "Escape") {
        closeGallery()
      } else if (e.key === "ArrowRight") {
        nextImage()
      } else if (e.key === "ArrowLeft") {
        previousImage()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [galleryOpen])

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!product || !clientId) return

    try {
      setWishlistLoading(true)

      const token = localStorage.getItem("clientImpersonationToken")
      if (!token) {
        throw new Error("No authentication token found. Please refresh the page and try again.")
      }

      if (inWishlist) {
        // Remove from wishlist
        const response = await fetch(`${API_URL}/api/deleteUserWishlistItem`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ productId: product.postId }),
        })

        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()

        if (!data.success) {
          throw new Error(data.message || "Failed to remove from wishlist")
        }

        // Update local state
        setInWishlist(false)

        // Update localStorage for wishlist
        const savedWishlist = localStorage.getItem("wishlist")
        if (savedWishlist) {
          const wishlistItems = JSON.parse(savedWishlist)
          const updatedWishlist = wishlistItems.filter((id: string) => id !== product.postId)
          localStorage.setItem("wishlist", JSON.stringify(updatedWishlist))
        }

        toast({
          title: "Removed from wishlist",
          description: `${product.name} has been removed from your wishlist.`,
        })
      } else {
        // Add to wishlist
        const response = await fetch(`${API_URL}/api/addToWishlist`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productId: product.postId,
            // Include the current price with commission applied
            price: calculateAdjustedPrice(product.price, product.category),
          }),
        })

        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()

        if (!data.success) {
          throw new Error(data.message || "Failed to add to wishlist")
        }

        // Update local state
        setInWishlist(true)

        // Update localStorage for wishlist
        const savedWishlist = localStorage.getItem("wishlist")
        const wishlistItems = savedWishlist ? JSON.parse(savedWishlist) : []
        if (!wishlistItems.includes(product.postId)) {
          localStorage.setItem("wishlist", JSON.stringify([...wishlistItems, product.postId]))
        }

        toast({
          title: "Added to wishlist",
          description: `${product.name} has been added to your wishlist.`,
          action: (
            <ToastAction
              altText="View wishlist"
              onClick={() => router.push(`/client-dashboard/${clientId}/wishlist`)}
              className="bg-[#194a95] text-white hover:bg-[#0f3a7a]"
            >
              View Wishlist
            </ToastAction>
          ),
        })
      }
    } catch (error) {
      console.error("Error updating wishlist:", error)
      toast({
        title: "Error",
        description: "Failed to update wishlist. Please try again.",
        variant: "destructive",
      })
    } finally {
      setWishlistLoading(false)
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
          <Button onClick={() => router.back()} className="mt-4 bg-[#194a95]">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
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
            <div className="relative rounded-2xl overflow-hidden bg-gray-100 mb-4 cursor-pointer" onClick={openGallery}>
              <div className="aspect-[4/3] relative">
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
                      onClick={(e) => {
                        e.stopPropagation() // Prevent gallery from opening
                        previousImage()
                      }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="h-6 w-6 text-gray-800" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation() // Prevent gallery from opening
                        nextImage()
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all"
                      aria-label="Next image"
                    >
                      <ChevronRight className="h-6 w-6 text-gray-800" />
                    </button>
                  </>
                )}

                {/* Click to view indicator */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-sm flex items-center">
                  <span>Click to zoom</span>
                </div>
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
              <p className="text-xl font-bold mt-1">
                ₹{product && calculateAdjustedPrice(product.price, product.category)}/per sqft
              </p>
            </div>

            {/* Product Category */}
            <div className="pb-4 border-b border-gray-200">
              <p className="text-gray-500">Product Category</p>
              <p className="text-xl font-bold mt-1">{product.category}</p>
            </div>

            {/* Quantity Available */}
            <div className="pb-4 border-b border-gray-200">
              <p className="text-gray-500">Quality Available (in sqft)</p>
              <p className="text-xl font-bold mt-1">{product.quantityAvailable}</p>
            </div>

            {/* Size, No. of Pieces, and Thickness in 3 columns */}
            <div className="grid grid-cols-3 gap-4 pb-4 border-b border-gray-200">
              <div>
                <p className="text-gray-500">Size</p>
                <p className="text-lg font-bold mt-1">
                  {product.size !== undefined && product.size !== null && product.size !== "" ? product.size : "-"}
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

            {/* About Product */}
            <div className="pb-4 border-b border-gray-200">
              <p className="text-gray-500">About Product</p>
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
            <div className="flex flex-wrap gap-4 mb-8">
              <Button
                onClick={toggleWishlist}
                disabled={wishlistLoading}
                className={`px-8 py-3 rounded-md flex items-center gap-2 ${
                  inWishlist
                    ? "bg-gray-200 hover:bg-gray-300 text-gray-700"
                    : "bg-[#194a95] hover:bg-[#0f3a7a] text-white"
                }`}
              >
                <Heart className={`w-4 h-4 ${inWishlist ? "fill-current" : ""}`} />
                {wishlistLoading ? "Processing..." : "Add to Wishlist"}
              </Button>
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
            <div className="max-w-6xl mx-auto mt-12 border-t pt-8">
              <ProductVisualizer productImage={product.image[0]} productName={product.name}  />
            </div>
          )}
        </div>
      </div>

      {/* Image Gallery Modal */}
      {galleryOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <div className="relative w-full h-full flex flex-col">
            {/* Close button */}
            <button
              onClick={closeGallery}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
              aria-label="Close gallery"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Main image container */}
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="relative w-full h-full max-w-4xl max-h-[80vh] mx-auto">
                <Image
                  src={
                    imageLoadError[currentImageIndex]
                      ? "/placeholder.svg"
                      : product.image[currentImageIndex] || "/placeholder.svg"
                  }
                  alt={`${product.name} - Image ${currentImageIndex + 1}`}
                  fill
                  className="object-contain"
                  onError={() => handleImageError(currentImageIndex)}
                  priority
                />
              </div>
            </div>

            {/* Navigation controls */}
            {product.image.length > 1 && (
              <>
                <button
                  onClick={previousImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 p-3 rounded-full text-white transition-colors"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-8 w-8" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 p-3 rounded-full text-white transition-colors"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-8 w-8" />
                </button>
              </>
            )}

            {/* Thumbnails at bottom */}
            {product.image.length > 1 && (
              <div className="p-4 bg-black/70">
                <div className="flex justify-center gap-2 overflow-x-auto py-2 max-w-4xl mx-auto">
                  {product.image.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => handleThumbnailClick(index)}
                      className={`relative rounded-md overflow-hidden flex-shrink-0 w-16 h-16 md:w-20 md:h-20 ${
                        selectedThumbnail === index ? "ring-2 ring-white" : "opacity-70"
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
                <p className="text-white text-center mt-2 text-sm">
                  {currentImageIndex + 1} / {product.image.length}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
