"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Search, Loader2, Heart, ShoppingCart, AlertCircle } from "lucide-react"
import Image from "next/image"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Define the Product interface
interface Product {
  _id: string
  name: string
  price: number
  image: string[]
  postId: string
  category: string
  description: string
  status?: "draft" | "pending" | "approved"
  applicationAreas?: string
  quantityAvailable?: number
}

export default function ProductsPage() {
  // Use the useParams hook to get the clientId
  const params = useParams()
  const clientId = params.clientId as string

  // Remove the unused router variable
  // const router = useRouter()
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [imageError, setImageError] = useState<Record<string, boolean>>({})
  // Wishlist and cart state
  const [wishlist, setWishlist] = useState<string[]>([])
  const [cart, setCart] = useState<string[]>([])
  const [addingToCart, setAddingToCart] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<string | null>(null)

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

  // Save wishlist and cart to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("wishlist", JSON.stringify(wishlist))
      localStorage.setItem("cart", JSON.stringify(cart))
    }
  }, [wishlist, cart])

  // Fetch products function
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Use environment variable if available, otherwise use a default URL
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://evershinebackend-2.onrender.com"
      console.log("Fetching products from:", `${apiUrl}/api/getAllProducts`)

      const response = await fetch(`${apiUrl}/api/getAllProducts`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        // Add a timeout to prevent long waiting times
        signal: AbortSignal.timeout(8000), // 8 second timeout
      })

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`)
      }

      const data = await response.json()

      if (data.success && Array.isArray(data.data)) {
        console.log("Products fetched successfully:", data.data)

        // Process the image URLs to ensure they're valid
        const processedProducts = data.data.map((product: Product) => ({
          ...product,
          image:
            Array.isArray(product.image) && product.image.length > 0
              ? product.image.filter((url: string) => typeof url === "string" && url.trim() !== "")
              : ["/placeholder.svg?height=300&width=300"],
        }))

        setProducts(processedProducts)
      } else {
        throw new Error(data.msg || "Invalid API response format")
      }
    } catch (error: Error | unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load products"
      console.error("Error fetching products:", error)
      setError(errorMessage)

      // Show error toast
      toast({
        title: "Error fetching products",
        description: "Could not load products from the server. Please try again later.",
        variant: "destructive",
      })

      // Set empty products array
      setProducts([])
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
    async (e: React.MouseEvent, productId: string, productName: string) => {
      e.preventDefault() // Prevent navigati

      if (cart.includes(productId)) {
        toast({
          title: "Already in cart",
          description: "This item is already in your cart",
          variant: "default",
        })
        return
      }

      try {
        // Set loading state for this specific product
        setAddingToCart((prev) => ({ ...prev, [productId]: true }))

        console.log("Adding to cart:", productId, productName)

        // Get the token
        const token = localStorage.getItem("clientImpersonationToken")

        if (!token) {
          console.error("No impersonation token found")
          toast({
            title: "Authentication Error",
            description: "Please refresh your token using the debug panel above",
            variant: "destructive",
          })
          throw new Error("No authentication token found")
        }

        console.log("Using token:", token.substring(0, 15) + "...")
        console.log("Full request details:", {
          url: "https://evershinebackend-2.onrender.com/api/addToCart",
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ productId }),
        })

        // Make a direct fetch request with the token
        const response = await fetch("https://evershinebackend-2.onrender.com/api/addToCart", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ productId }),
        })

        console.log("Response status:", response.status, response.statusText)

        // Get the response text for debugging
        const responseText = await response.text()
        console.log("Response text:", responseText)

        // Try to parse the response a JSON
        let data
        try {
          data = JSON.parse(responseText)
          console.log("Parsed response data:", data)
        } catch (e) {
          console.error("Failed to parse response as JSON:", e)
          throw new Error(`Invalid response format: ${responseText}`)
        }

        // Check for errors
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Authentication failed. Please refresh the token using the debug panel above.")
          } else {
            throw new Error(`API error: ${response.status} ${response.statusText}. Details: ${responseText}`)
          }
        }

        if (data.success) {
          toast({
            title: "Added to cart",
            description: `${productName} has been added to your cart`,
            variant: "default",
          })
          setCart((prev) => [...prev, productId])
        } else {
          throw new Error(data.message || "Failed to add to cart")
        }
      } catch (error: Error | unknown) {
        const errorMessage = error instanceof Error ? error.message : "Failed to add item to cart. Please try again."
        console.error("Error adding to cart:", error)
        toast({
          title: "Error adding to cart",
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        // Clear loading state
        setAddingToCart((prev) => ({ ...prev, [productId]: false }))
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
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading products..</p>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Products</h1>

        <div className="flex items-center gap-4">
          <Link href={`/client-dashboard/${clientId}/wishlist`} className="relative">
            <Heart className="h-6 w-6 text-gray-600" />
            {wishlist.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {wishlist.length}
              </span>
            )}
          </Link>

          <Link href={`/client-dashboard/${clientId}/cart`} className="relative">
            <ShoppingCart className="h-6 w-6 text-gray-600" />
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
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
          className="pl-10 pr-4 py-2 w-full rounded-lg border border-input focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl font-medium mb-4">No products found</p>
          <p className="text-muted-foreground mb-6">
            {searchQuery ? "Try a different search term" : "No products are currently available"}
          </p>
          <button
            onClick={fetchProducts}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Refresh Products
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product._id}
              className="group relative bg-card rounded-lg overflow-hidden border border-border hover:border-primary transition-all hover:shadow-md"
            >
              <div className="relative aspect-square">
                <Image
                  src={
                    imageError[product._id]
                      ? "/placeholder.svg?height=300&width=300"
                      : product.image && product.image.length > 0 && product.image[0]
                        ? product.image[0]
                        : "/placeholder.svg?height=300&width=300"
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
                    className={`h-5 w-5 ${
                      wishlist.includes(product.postId) ? "text-red-500 fill-red-500" : "text-gray-600"
                    }`}
                  />
                </button>
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-lg text-foreground line-clamp-1">{product.name}</h3>
                <p className="text-lg font-bold mt-2">₹{product.price.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground mt-1">{product.category}</p>

                <button
                  onClick={(e) => addToCart(e, product.postId, product.name)}
                  className={`mt-4 w-full py-2 rounded-lg text-sm font-medium
                            ${
                              cart.includes(product.postId)
                                ? "bg-muted text-muted-foreground"
                                : "bg-primary hover:bg-primary/90 text-primary-foreground"
                            } 
                            transition-colors`}
                  disabled={
                    cart.includes(product.postId) ||
                    addingToCart[product.postId] ||
                    (product.quantityAvailable !== undefined && product.quantityAvailable <= 0)
                  }
                  type="button"
                >
                  {addingToCart[product.postId] ? (
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  ) : cart.includes(product.postId) ? (
                    "Added to Cart"
                  ) : product.quantityAvailable !== undefined && product.quantityAvailable <= 0 ? (
                    "Out of Stock"
                  ) : (
                    "Add to Cart"
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
