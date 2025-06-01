"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import axios, { AxiosError } from "axios"
import { ArrowLeft, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Heart, X, ShoppingCart } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { ToastAction } from "@/components/ui/toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import ProductVisualizer from "@/components/ProductVisualizer"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://evershinebackend-2.onrender.com"

interface Product {
  _id: string
  name: string
  price: number
  basePrice?: number
  updatedPrice?: number // Backend calculated price
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
  commissionInfo?: {
    currentAgentCommission: number
    consultantLevelCommission: number
    totalCommission: number
    consultantLevel: string
  }
}

interface ApiResponse {
  success: boolean
  data?: Product[]
  msg?: string
}

interface CommissionData {
  agentId: string
  name: string
  email: string
  commissionRate: number
  categoryCommissions?: Record<string, number>
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
  // Add these new state variables after the existing ones
  const [wishlistCount, setWishlistCount] = useState(0)
  const [cartCount, setCartCount] = useState(0)
  const clientId = params.clientId as string
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [showVisualizer, setShowVisualizer] = useState(false)

  // New state for custom fields
  const [customQuantity, setCustomQuantity] = useState<number | undefined>(undefined)
  const [customFinish, setCustomFinish] = useState<string | undefined>(undefined)
  const [customThickness, setCustomThickness] = useState<string | undefined>(undefined)

  // Add state for commission data
  const [commissionData, setCommissionData] = useState<CommissionData | null>(null)
  const [overrideCommissionRate, setOverrideCommissionRate] = useState<number | null>(null)
  const [commissionLoading, setCommissionLoading] = useState(false)
  const [basePrice, setBasePrice] = useState<number | null>(null)

  const visualizerRef = useRef<HTMLDivElement>(null)

  // Add this useEffect after the clientId declaration
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedRate = localStorage.getItem(`commission-override-${clientId}`)
      if (savedRate) {
        setOverrideCommissionRate(Number(savedRate))
      } else {
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

  // Add calculateAdjustedPrice function
  const calculateAdjustedPrice = (price: number, category: string) => {
    const productBasePrice = basePrice || price

    let defaultRate = commissionData?.commissionRate || 10

    if (commissionData?.categoryCommissions && category && commissionData.categoryCommissions[category]) {
      defaultRate = commissionData.categoryCommissions[category]
    }

    const finalRate = overrideCommissionRate !== null ? defaultRate + overrideCommissionRate : defaultRate

    const adjustedPrice = productBasePrice * (1 + finalRate / 100)
    return Math.round(adjustedPrice * 100) / 100
  }

  // Function to get wishlist count
  const getWishlistCount = () => {
    try {
      const savedWishlist = localStorage.getItem("wishlist")
      if (savedWishlist) {
        const wishlistItems = JSON.parse(savedWishlist)
        return Array.isArray(wishlistItems) ? wishlistItems.length : 0
      }
      return 0
    } catch (error) {
      console.error("Error getting wishlist count:", error)
      return 0
    }
  }

  // Function to get cart count
  const getCartCount = () => {
    try {
      const savedCart = localStorage.getItem("cart")
      if (savedCart) {
        const cartItems = JSON.parse(savedCart)
        return Array.isArray(cartItems) ? cartItems.length : 0
      }
      return 0
    } catch (error) {
      console.error("Error getting cart count:", error)
      return 0
    }
  }

  // Function to update counts
  const updateCounts = () => {
    setWishlistCount(getWishlistCount())
    setCartCount(getCartCount())
  }

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        setError("")
        await fetchCommissionData()

        if (!params.id) {
          throw new Error("Product ID is missing")
        }

        // Use client-specific endpoint for pricing
        const response = await axios.get<ApiResponse>(`${API_URL}/api/getPostDataById`, {
          params: { id: params.id },
        })

        if (response.data.success && response.data.data?.[0]) {
          const productData = response.data.data[0]

          const processedProduct = {
            ...productData,
            size: productData.size !== undefined ? productData.size : "",
            numberOfPieces: productData.numberOfPieces !== undefined ? productData.numberOfPieces : null,
            thickness: productData.thickness !== undefined ? productData.thickness : "",
          }

          setProduct(processedProduct)
          setBasePrice(productData.basePrice || productData.price)
          setImageLoadError(new Array(productData.image.length).fill(false))

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

  // Initialize counts on component mount
  useEffect(() => {
    updateCounts()
  }, [])

  // Listen for storage changes to update counts
  useEffect(() => {
    const handleStorageChange = () => {
      updateCounts()
    }

    window.addEventListener("storage", handleStorageChange)
    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [])

  // Check if product is in wishlist - prioritize server response over localStorage
  const checkWishlistStatus = async (productId: string) => {
    try {
      const token = localStorage.getItem("clientImpersonationToken")
      if (!token) {
        // If no token, check localStorage only
        const savedWishlist = localStorage.getItem("wishlist")
        if (savedWishlist) {
          const wishlistItems = JSON.parse(savedWishlist)
          setInWishlist(wishlistItems.includes(productId))
        }
        return
      }

      // First, get the server state
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
          const serverWishlistIds = data.data.items.map((item: any) => item.postId)
          const isInServerWishlist = serverWishlistIds.includes(productId)

          // Update localStorage to match server state
          localStorage.setItem("wishlist", JSON.stringify(serverWishlistIds))

          // Set the wishlist status based on server response
          setInWishlist(isInServerWishlist)

          console.log(`Product ${productId} wishlist status: ${isInServerWishlist}`)
          return
        }
      }

      // If API call fails, fall back to localStorage but log the issue
      console.warn("Failed to fetch wishlist from server, using localStorage")
      const savedWishlist = localStorage.getItem("wishlist")
      if (savedWishlist) {
        const wishlistItems = JSON.parse(savedWishlist)
        setInWishlist(wishlistItems.includes(productId))
      } else {
        setInWishlist(false)
      }
    } catch (error) {
      console.error("Error checking wishlist status:", error)
      // Fall back to localStorage
      const savedWishlist = localStorage.getItem("wishlist")
      if (savedWishlist) {
        const wishlistItems = JSON.parse(savedWishlist)
        setInWishlist(wishlistItems.includes(productId))
      } else {
        setInWishlist(false)
      }
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

  const openGallery = () => {
    setGalleryOpen(true)
    if (typeof document !== "undefined") {
      document.body.style.overflow = "hidden"
    }
  }

  const closeGallery = () => {
    setGalleryOpen(false)
    if (typeof document !== "undefined") {
      document.body.style.overflow = ""
    }
  }

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

        // Handle 404 specifically - item might not exist on server
        if (response.status === 404) {
          console.warn(`Product ${product.postId} not found in server wishlist, removing from localStorage`)

          // Remove from localStorage anyway
          const savedWishlist = localStorage.getItem("wishlist")
          if (savedWishlist) {
            const wishlistItems = JSON.parse(savedWishlist)
            const updatedWishlist = wishlistItems.filter((id: string) => id !== product.postId)
            localStorage.setItem("wishlist", JSON.stringify(updatedWishlist))
          }

          setInWishlist(false)
          updateCounts() // Add this line

          toast({
            title: "Removed from wishlist",
            description: `${product.name} has been removed from your wishlist.`,
          })
          return
        }

        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()

        if (!data.success) {
          throw new Error(data.message || "Failed to remove from wishlist")
        }

        setInWishlist(false)

        // Update localStorage
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
            customQuantity,
            customFinish,
            customThickness,
          }),
        })

        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()

        if (!data.success) {
          throw new Error(data.message || "Failed to add to wishlist")
        }

        setInWishlist(true)
        updateCounts() // Add this line

        // Update localStorage
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

  // USE BACKEND CALCULATED PRICE
  const displayPrice = product.updatedPrice || product.price
  const hasCommission = product.updatedPrice && product.updatedPrice !== product.price
  const originalPrice = product.basePrice || product.price

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.back()}
          className="hover:bg-gray-100 p-2 rounded-full transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/client-dashboard/${clientId}/wishlist`)}
            className="hover:bg-gray-100 p-2 rounded-full transition-colors relative"
            aria-label="View wishlist"
          >
            <Heart className="h-6 w-6" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                {wishlistCount > 99 ? "99+" : wishlistCount}
              </span>
            )}
          </button>
          <button
            onClick={() => router.push(`/client-dashboard/${clientId}/cart`)}
            className="hover:bg-gray-100 p-2 rounded-full transition-colors relative"
            aria-label="View cart"
          >
            <ShoppingCart className="h-6 w-6" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:gap-12">
          <div className="w-full md:w-1/2 md:order-2 mb-8 md:mb-0">
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

                {product.image.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        previousImage()
                      }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="h-6 w-6 text-gray-800" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        nextImage()
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all"
                      aria-label="Next image"
                    >
                      <ChevronRight className="h-6 w-6 text-gray-800" />
                    </button>
                  </>
                )}

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-sm flex items-center">
                  <span>Click to zoom</span>
                </div>
              </div>
            </div>

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

            <div className="mt-4 space-y-4">
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

              <Button
                onClick={toggleWishlist}
                disabled={wishlistLoading}
                className="w-full px-8 py-3 rounded-md flex items-center justify-center gap-2 bg-[#194a95] hover:bg-[#0f3a7a] text-white"
              >
                <Heart className={`w-4 h-4 ${inWishlist ? "fill-current" : ""}`} />
                {wishlistLoading ? "Processing..." : inWishlist ? "In Wishlist" : "Add to Wishlist"}
              </Button>
            </div>
          </div>

          <div className="w-full md:w-1/2 md:order-1 space-y-6">
            <div className="pb-4 border-b border-gray-200">
              <p className="text-gray-500">Product Name</p>
              <h1 className="text-3xl font-bold mt-1">{product.name}</h1>
            </div>

            {/* DISPLAY BACKEND CALCULATED PRICE */}
            <div className="pb-4 border-b border-gray-200">
              <p className="text-gray-500">Price (per sqft)</p>
              <p className="text-2xl font-bold mt-1">
                ₹{product && calculateAdjustedPrice(product.price, product.category).toLocaleString()}/sqft
              </p>
            </div>

            <div className="pb-4 border-b border-gray-200">
              <p className="text-gray-500">Product Category</p>
              <p className="text-xl font-bold mt-1">{product.category}</p>
            </div>

            <div className="pb-4 border-b border-gray-200">
              <p className="text-gray-500">Quantity Available (in sqft)</p>
              <p className="text-xl font-bold mt-1">{product.quantityAvailable}</p>
            </div>

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

            <div className="flex flex-wrap gap-4 mb-8">
              <Button
                onClick={() => {
                  if (!showVisualizer) {
                    setShowVisualizer(true)
                    // Scroll to visualizer section after a short delay to ensure it's rendered
                    setTimeout(() => {
                      visualizerRef.current?.scrollIntoView({
                        behavior: "smooth",
                        block: "end",
                        inline: "nearest",
                      })
                    }, 200)
                  } else {
                    setShowVisualizer(false)
                  }
                }}
                className="w-full bg-[#194a95] hover:bg-[#0f3a7a] py-3 text-white rounded-xl"
              >
                {showVisualizer ? "Hide Product Visualizer" : "Show Product Visualizer"}
              </Button>
            </div>
          </div>
        </div>

        {showVisualizer && product.image.length > 0 && (
          <div ref={visualizerRef} className="mt-8 pt-8 border-t border-gray-200 pb-8">
            <ProductVisualizer productImage={product.image[0]} productName={product.name} />
          </div>
        )}

        {galleryOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
            <div className="relative w-full h-full flex flex-col">
              <button
                onClick={closeGallery}
                className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                aria-label="Close gallery"
              >
                <X className="h-6 w-6" />
              </button>

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
    </div>
  )
}
