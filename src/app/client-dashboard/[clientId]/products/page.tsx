"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Search, Loader2, Heart, ShoppingCart } from "lucide-react"
import Image from "next/image"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"

// Mock data for fallback when API is not available
const MOCK_PRODUCTS = [
  {
    _id: "1",
    name: "Marble Tile - White",
    price: 1200,
    image: ["/placeholder.svg?height=300&width=300"],
    postId: "marble-1",
    category: "Marble",
    description: "Premium quality white marble tile",
    status: "approved" as const,
  },
  {
    _id: "2",
    name: "Granite Countertop",
    price: 3500,
    image: ["/placeholder.svg?height=300&width=300"],
    postId: "granite-1",
    category: "Granite",
    description: "Durable granite countertop",
    status: "approved" as const,
  },
  {
    _id: "3",
    name: "Limestone Flooring",
    price: 950,
    image: ["/placeholder.svg?height=300&width=300"],
    postId: "limestone-1",
    category: "Limestone",
    description: "Natural limestone flooring tiles",
    status: "approved" as const,
  },
  {
    _id: "4",
    name: "Sandstone Pavers",
    price: 850,
    image: ["/placeholder.svg?height=300&width=300"],
    postId: "sandstone-1",
    category: "Sandstone",
    description: "Outdoor sandstone pavers",
    status: "approved" as const,
  },
  {
    _id: "5",
    name: "Quartz Slab",
    price: 4200,
    image: ["/placeholder.svg?height=300&width=300"],
    postId: "quartz-1",
    category: "Quartz",
    description: "Engineered quartz slab",
    status: "approved" as const,
  },
  {
    _id: "6",
    name: "Travertine Tiles",
    price: 1100,
    image: ["/placeholder.svg?height=300&width=300"],
    postId: "travertine-1",
    category: "Travertine",
    description: "Natural travertine tiles",
    status: "approved" as const,
  },
]

interface Product {
  _id: string
  name: string
  price: number
  image: string[]
  postId: string
  category: string
  description: string
  status?: "draft" | "pending" | "approved"
}

export default function ProductsPage({ params }: { params: { clientId: string } }) {
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [imageError, setImageError] = useState<Record<string, boolean>>({})
  // Wishlist and cart state
  const [wishlist, setWishlist] = useState<string[]>([])
  const [cart, setCart] = useState<string[]>([])

  // Load wishlist and cart from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedWishlist = localStorage.getItem("wishlist")
        if (savedWishlist) {
          setWishlist(JSON.parse(savedWishlist))
        }

        const savedCart = localStorage.getItem("cart")
        if (savedCart) {
          setCart(JSON.parse(savedCart))
        }
      } catch (e) {
        console.error("Error loading data from localStorage:", e)
      }
    }
  }, [])

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("wishlist", JSON.stringify(wishlist))
    }
  }, [wishlist])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("cart", JSON.stringify(cart))
    }
  }, [cart])

  // Fetch products function with improved error handling
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)

      // Try to fetch from API
      const apiSuccess = false

      try {
        // Use environment variable if available, otherwise use a default URL
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
        console.log("Attempting to fetch products from:", `${apiUrl}/api/getAllProducts`)

        const response = await fetch(`${apiUrl}/api/getAllProducts`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          // Add a timeout to prevent long waiting times
          signal: AbortSignal.timeout(5000), // 5 second timeout
        })

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`)
        }

        const data = await response.json()

        if (data.success && Array.isArray(data.data)) {
          // Add type assertion to ensure the status is one of the allowed values
          const typedProducts = data.data.map((product: unknown) => {
            return product as Product
          })

          setProducts(typedProducts)
          // apiSuccess = true
          console.log("Successfully fetched products from API")
        } else {
          throw new Error(data.msg || "Invalid API response format")
        }
      } catch (apiError) {
        console.error("API fetch error:", apiError)
        // Let the outer try/catch handle this
        throw apiError
      }
    } catch (error) {
      console.error("Error fetching products:", error)

      // Use mock data as fallback
      console.log("Using mock product data as fallback")
      setProducts(MOCK_PRODUCTS)

      // Show a toast only if we're in a browser environment
      if (typeof window !== "undefined") {
        toast({
          title: "Using demo data",
          description: "Could not connect to the server. Showing demo products.",
          variant: "default",
        })
      }
    } finally {
      setLoading(false)
    }
  }, [toast])

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Toggle wishlist function
  const toggleWishlist = useCallback(
    (e: React.MouseEvent, productId: string) => {
      e.preventDefault() // Prevent navigation

      if (wishlist.includes(productId)) {
        setWishlist((prev) => prev.filter((id) => id !== productId))
        toast({
          title: "Removed from wishlist",
          description: "Item has been removed from your wishlist",
          variant: "default",
        })
      } else {
        setWishlist((prev) => [...prev, productId])
        toast({
          title: "Added to wishlist",
          description: "Item has been added to your wishlist",
          variant: "default",
        })
      }
    },
    [wishlist, toast],
  )

  // Add to cart function
  const addToCart = useCallback(
    (e: React.MouseEvent, productId: string, productName: string) => {
      e.preventDefault() // Prevent navigation

      if (!cart.includes(productId)) {
        setCart((prev) => [...prev, productId])
        toast({
          title: "Added to cart",
          description: `${productName} has been added to your cart`,
          variant: "default",
        })
      } else {
        toast({
          title: "Already in cart",
          description: "This item is already in your cart",
          variant: "default",
        })
      }
    },
    [cart, toast],
  )

  // Filter products based on search query
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Handle image loading errors
  const handleImageError = useCallback((productId: string) => {
    setImageError((prev) => ({ ...prev, [productId]: true }))
  }, [])

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <Loader2 className="h-12 w-12 animate-spin text-blue mb-4" />
        <p className="text-muted-foreground">Loading products...</p>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Products</h1>

        <div className="flex items-center gap-4">
          <Link href={`/client-dashboard/${params.clientId}/wishlist`} className="relative">
            <Heart className="h-6 w-6 text-gray-600" />
            {wishlist.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-blue text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {wishlist.length}
              </span>
            )}
          </Link>

          <Link href={`/client-dashboard/${params.clientId}/cart`} className="relative">
            <ShoppingCart className="h-6 w-6 text-gray-600" />
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-blue text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </Link>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search products by name or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
        />
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl font-medium mb-4">No products found</p>
          <p className="text-muted-foreground mb-6">Try a different search term</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product._id}
              className="group relative bg-white rounded-lg overflow-hidden border border-gray-200 hover:border-blue transition-all hover:shadow-md"
            >
              <div className="relative aspect-square">
                <Image
                  src={
                    imageError[product._id]
                      ? "/placeholder.svg?height=300&width=300"
                      : product.image[0] || "/placeholder.svg?height=300&width=300"
                  }
                  alt={product.name}
                  fill
                  className="object-cover transition-transform group-hover:scale-105 duration-300"
                  onError={() => handleImageError(product._id)}
                />

                {/* Wishlist button overlay */}
                <button
                  onClick={(e) => toggleWishlist(e, product.postId)}
                  className="absolute top-2 right-2 p-2 rounded-full bg-white/80 hover:bg-white transition-colors z-10"
                  aria-label={wishlist.includes(product.postId) ? "Remove from wishlist" : "Add to wishlist"}
                  type="button"
                >
                  <Heart
                    className={`h-5 w-5 ${wishlist.includes(product.postId) ? "text-red-500 fill-red-500" : "text-gray-600"}`}
                  />
                </button>
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">{product.name}</h3>
                <p className="text-gray-600 text-sm line-clamp-2 mt-1">{product.description}</p>
                <p className="text-lg font-bold mt-2">₹{product.price}</p>
                <p className="text-sm text-gray-500 mt-1">{product.category}</p>

                <button
                  onClick={(e) => addToCart(e, product.postId, product.name)}
                  className={`mt-4 w-full py-2 rounded-lg text-sm font-medium
                            ${
                              cart.includes(product.postId)
                                ? "bg-gray-100 text-gray-800"
                                : "bg-blue hover:bg-blue/90 text-white"
                            } 
                            transition-colors`}
                  disabled={cart.includes(product.postId)}
                  type="button"
                >
                  {cart.includes(product.postId) ? "Added to Cart" : "Add to Cart"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

