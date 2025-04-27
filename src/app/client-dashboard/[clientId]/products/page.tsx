"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Search, Loader2, Heart, ShoppingCart, AlertCircle, RefreshCw } from "lucide-react"
import Image from "next/image"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Define the Product interface
interface Product {
  _id: string
  name: string
  price: number
  basePrice?: number
  image: string[]
  postId: string
  category: string
  description: string
  status?: "draft" | "pending" | "approved"
  applicationAreas?: string
  quantityAvailable?: number
}

// Add these interfaces
interface Agent {
  agentId: string
  name: string
  email: string
  commissionRate: number
  categoryCommissions?: Record<string, number>
}

export default function ProductsPage() {
  // Use the useParams hook to get the clientId
  const params = useParams()
  const clientId = params.clientId as string

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

  // Agent info state - simplified to just commission info
  const [agentCommission, setAgentCommission] = useState<{
    commissionRate: number
    categoryCommissions?: Record<string, number>
  } | null>(null)
  const [commissionLoading, setCommissionLoading] = useState(false)
  const [commissionError, setCommissionError] = useState<string | null>(null)
  // Add this state for the override commission rate
  const [overrideCommissionRate, setOverrideCommissionRate] = useState<number | null>(null)

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

  // Fetch agent commission info function - using the new endpoint
  const fetchAgentCommission = useCallback(async () => {
    console.log("Fetching agent commission info...")
    setCommissionLoading(true)
    setCommissionError(null)

    try {
      // Get the token for authorization
      const token = localStorage.getItem("clientImpersonationToken")
      if (!token) {
        throw new Error("No authentication token found")
      }

      // Fetch agent commission from the new endpoint
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://evershinebackend-2.onrender.com"
      console.log("Fetching commission from:", `${apiUrl}/api/client/agent-commission`)

      const response = await fetch(`${apiUrl}/api/client/agent-commission`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log("Commission API response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("API error response:", errorText)
        throw new Error(`Failed to fetch commission info: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log("Commission API response data:", data)

      if (data.success && data.data) {
        console.log("Setting commission info:", data.data)
        setAgentCommission({
          commissionRate: data.data.commissionRate,
          categoryCommissions: data.data.categoryCommissions,
        })
      } else {
        console.error("Invalid commission data response:", data)
        throw new Error("Invalid commission data response")
      }
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load commission info"
      console.error("Error fetching commission info:", error)
      setCommissionError(errorMessage)
    } finally {
      setCommissionLoading(false)
    }
  }, [])

  // Fetch products function
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Use environment variable if available, otherwise use a default URL
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://evershinebackend-2.onrender.com"
      console.log("Fetching products from:", `${apiUrl}/api/getAllProducts`)

      // Get the token for authorization
      const token = localStorage.getItem("clientImpersonationToken")
      console.log("Using token for products request:", token ? "Token available" : "No token")

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }

      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      const response = await fetch(`${apiUrl}/api/getAllProducts`, {
        method: "GET",
        headers,
        // Add a timeout to prevent long waiting times
        signal: AbortSignal.timeout(8000), // 8 second timeout
      })

      console.log("Products API response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("API error response:", errorText)
        throw new Error(`API request failed with status ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log("Products API response data:", data)

      if (data.success && Array.isArray(data.data)) {
        console.log("Products fetched successfully. Count:", data.data.length)

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
        console.error("Invalid API response format:", data)
        throw new Error(data.msg || "Invalid API response format")
      }
    } catch (error: any) {
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

  // Fetch products and agent commission on component mount
  useEffect(() => {
    console.log("Component mounted - fetching data")
    fetchProducts()
    fetchAgentCommission()
  }, [fetchProducts, fetchAgentCommission])

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
            description: "No authentication token found",
            variant: "destructive",
          })
          throw new Error("No authentication token found")
        }

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
            throw new Error("Authentication failed. Please refresh the token.")
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
      } catch (error: any) {
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

  // Calculate commission for a product
  const getCommissionInfo = useCallback(
    (product: Product) => {
      if (!product.basePrice) {
        return null
      }

      // Use override rate if set, otherwise use agent's commission rate
      let effectiveRate =
        overrideCommissionRate !== null ? overrideCommissionRate : agentCommission?.commissionRate || 10

      // Only use category-specific commission if we're not overriding
      if (
        overrideCommissionRate === null &&
        agentCommission?.categoryCommissions &&
        agentCommission.categoryCommissions[product.category]
      ) {
        effectiveRate = agentCommission.categoryCommissions[product.category]
      }

      // Calculate the adjusted price based on the effective rate
      const adjustedPrice = product.basePrice * (1 + effectiveRate / 100)
      const increase = ((adjustedPrice / product.basePrice - 1) * 100).toFixed(1)

      return {
        basePrice: product.basePrice,
        adjustedPrice: adjustedPrice,
        effectiveRate,
        increase,
      }
    },
    [agentCommission, overrideCommissionRate],
  )

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

      {/* Commission Info Panel with Quick Commission Dots */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-blue-800">Agent Commission Rate</h3>
            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={() => setOverrideCommissionRate(5)}
                className={`w-6 h-6 rounded-full bg-red-500 hover:ring-2 hover:ring-red-300 transition-all ${overrideCommissionRate === 5 ? "ring-2 ring-red-300 scale-110" : ""}`}
                title="Set 5% commission"
                aria-label="Set 5% commission"
              />
              <button
                onClick={() => setOverrideCommissionRate(10)}
                className={`w-6 h-6 rounded-full bg-yellow-500 hover:ring-2 hover:ring-yellow-300 transition-all ${overrideCommissionRate === 10 ? "ring-2 ring-yellow-300 scale-110" : ""}`}
                title="Set 10% commission"
                aria-label="Set 10% commission"
              />
              <button
                onClick={() => setOverrideCommissionRate(15)}
                className={`w-6 h-6 rounded-full bg-purple-500 hover:ring-2 hover:ring-purple-300 transition-all ${overrideCommissionRate === 15 ? "ring-2 ring-purple-300 scale-110" : ""}`}
                title="Set 15% commission"
                aria-label="Set 15% commission"
              />
              {overrideCommissionRate !== null && (
                <button
                  onClick={() => setOverrideCommissionRate(null)}
                  className="text-xs text-gray-600 hover:text-gray-900 ml-2"
                  title="Reset to default commission"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
          <button
            onClick={fetchAgentCommission}
            className="flex items-center gap-1 px-3 py-1 bg-blue-200 hover:bg-blue-300 rounded text-xs"
            disabled={commissionLoading}
          >
            {commissionLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            Refresh
          </button>
        </div>

        {commissionLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading commission information...</span>
          </div>
        ) : commissionError ? (
          <div className="bg-red-50 border border-red-200 rounded p-3">
            <p className="text-red-700 font-medium">Error loading commission information:</p>
            <p className="text-red-600">{commissionError}</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-lg font-bold text-green-700">
              {overrideCommissionRate !== null ? (
                <>
                  <span className="text-amber-600">Override Commission Rate: {overrideCommissionRate}%</span>
                  <span className="text-sm text-gray-500 ml-2">
                    (Default: {agentCommission?.commissionRate || 10}%)
                  </span>
                </>
              ) : (
                <>Default Commission Rate: {agentCommission?.commissionRate || 10}%</>
              )}
            </p>

            {overrideCommissionRate === null &&
              agentCommission?.categoryCommissions &&
              Object.keys(agentCommission.categoryCommissions).length > 0 && (
                <div>
                  <p className="font-semibold mb-1">Category-specific Commission Rates:</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {Object.entries(agentCommission.categoryCommissions).map(([category, rate]) => (
                      <div key={category} className="bg-white rounded p-2 text-sm">
                        <span className="font-medium">{category}:</span> <span className="text-green-700">{rate}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        )}
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
          {filteredProducts.map((product) => {
            const commissionInfo = getCommissionInfo(product)

            // Calculate the display price based on commission info
            const displayPrice = commissionInfo ? commissionInfo.adjustedPrice : product.price

            return (
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

                  <div className="mt-2">
                    {/* Price with commission info */}
                    <div className="flex items-baseline gap-2">
                      <p className="text-lg font-bold">₹{Math.round(displayPrice).toLocaleString()}</p>

                      {commissionInfo ? <p className="text-sm text-green-600">(+{commissionInfo.increase}%)</p> : null}
                    </div>

                    {/* Base price and commission info */}
                    {product.basePrice ? (
                      <div className="text-sm text-muted-foreground mt-1">
                        <span className="line-through">₹{product.basePrice.toLocaleString()}</span>
                        {commissionInfo && (
                          <span
                            className={`ml-2 ${overrideCommissionRate !== null ? "text-amber-600 font-medium" : "text-blue-600"}`}
                          >
                            Commission: {commissionInfo.effectiveRate}%
                          </span>
                        )}
                      </div>
                    ) : null}

                    <p className="text-sm text-muted-foreground mt-1">
                      <span className="font-medium">Category:</span> {product.category}
                    </p>
                  </div>

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
            )
          })}
        </div>
      )}
    </div>
  )
}
