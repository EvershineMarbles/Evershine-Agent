"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import axios, { AxiosError } from "axios"
import { ArrowLeft, ChevronLeft, ChevronRight, Heart, ShoppingCart } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"

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
  numberOfPieces?: number | null
  thickness?: string
}

interface ApiResponse {
  success: boolean
  data?: Product[]
  msg?: string
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
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)
  const [addingToWishlist, setAddingToWishlist] = useState(false)
  const clientId = params.clientId as string

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

          // Add missing fields if they don't exist
          const processedProduct = {
            ...productData,
            size: productData.size !== undefined ? productData.size : "",
            numberOfPieces: productData.numberOfPieces !== undefined ? productData.numberOfPieces : null,
            thickness: productData.thickness !== undefined ? productData.thickness : "",
          }

          setProduct(processedProduct)
          setImageLoadError(new Array(productData.image.length).fill(false))
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

  const addToCart = async () => {
    if (!product || !clientId) return

    try {
      setAddingToCart(true)

      const cartItem = {
        productId: product.postId,
        quantity: quantity,
        price: product.price,
        name: product.name,
        image: product.image[0] || "",
      }

      // Store in localStorage as fallback
      const cartKey = `cart_${clientId}`
      const existingCart = JSON.parse(localStorage.getItem(cartKey) || "[]")

      // Check if product already exists in cart
      const existingItemIndex = existingCart.findIndex((item: any) => item.productId === product.postId)

      if (existingItemIndex >= 0) {
        // Update quantity if product already in cart
        existingCart[existingItemIndex].quantity += quantity
      } else {
        // Add new item to cart
        existingCart.push(cartItem)
      }

      localStorage.setItem(cartKey, JSON.stringify(existingCart))

      // Also try to update server-side cart if API is available
      try {
        await axios.post(`${API_URL}/api/cart/add`, {
          clientId,
          productId: product.postId,
          quantity,
        })
      } catch (error) {
        console.error("Failed to update server cart, using local storage only", error)
      }

      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart.`,
      })
    } catch (error) {
      console.error("Error adding to cart:", error)
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      })
    } finally {
      setAddingToCart(false)
    }
  }

  const addToWishlist = async () => {
    if (!product || !clientId) return

    try {
      setAddingToWishlist(true)

      const wishlistItem = {
        productId: product.postId,
        name: product.name,
        price: product.price,
        image: product.image[0] || "",
      }

      // Store in localStorage as fallback
      const wishlistKey = `wishlist_${clientId}`
      const existingWishlist = JSON.parse(localStorage.getItem(wishlistKey) || "[]")

      // Check if product already exists in wishlist
      const existingItemIndex = existingWishlist.findIndex((item: any) => item.productId === product.postId)

      if (existingItemIndex >= 0) {
        // Product already in wishlist
        toast({
          title: "Already in wishlist",
          description: `${product.name} is already in your wishlist.`,
        })
      } else {
        // Add new item to wishlist
        existingWishlist.push(wishlistItem)
        localStorage.setItem(wishlistKey, JSON.stringify(existingWishlist))

        // Also try to update server-side wishlist if API is available
        try {
          await axios.post(`${API_URL}/api/wishlist/add`, {
            clientId,
            productId: product.postId,
          })
        } catch (error) {
          console.error("Failed to update server wishlist, using local storage only", error)
        }

        toast({
          title: "Added to wishlist",
          description: `${product.name} has been added to your wishlist.`,
        })
      }
    } catch (error) {
      console.error("Error adding to wishlist:", error)
      toast({
        title: "Error",
        description: "Failed to add item to wishlist. Please try again.",
        variant: "destructive",
      })
    } finally {
      setAddingToWishlist(false)
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
              <p className="text-xl font-bold mt-1">{product.description || "Product mainly used for countertop"}</p>
            </div>

            {/* Quantity Selector */}
            <div className="pb-4">
              <p className="text-gray-500 mb-2">Quantity (sqft)</p>
              <div className="flex items-center">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="border border-gray-300 rounded-l-md px-3 py-1 hover:bg-gray-100"
                >
                  -
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number.parseInt(e.target.value) || 1))}
                  className="border-t border-b border-gray-300 px-3 py-1 w-16 text-center focus:outline-none"
                  min="1"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="border border-gray-300 rounded-r-md px-3 py-1 hover:bg-gray-100"
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={addToCart}
                disabled={addingToCart}
                className="px-8 py-3 bg-[#194a95] hover:bg-[#0f3a7a] text-white rounded-md flex items-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                {addingToCart ? "Adding..." : "Add to Cart"}
              </Button>

              <Button
                onClick={addToWishlist}
                disabled={addingToWishlist}
                variant="outline"
                className="px-8 py-3 border-[#194a95] text-[#194a95] hover:bg-[#194a95] hover:text-white rounded-md flex items-center gap-2"
              >
                <Heart className="w-4 h-4" />
                {addingToWishlist ? "Adding..." : "Add to Wishlist"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
