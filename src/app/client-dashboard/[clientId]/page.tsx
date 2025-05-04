"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Search, Loader2, Heart, ShoppingCart, AlertCircle, QrCode } from "lucide-react"
import Image from "next/image"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ErrorBoundary } from "@/components/error-boundary"
import { Button } from "@/components/ui/button"

// Define the Product interface
interface Product {
  _id: string
  name: string
  price: number
  basePrice?: number // Add this field to recognize the original price
  image: string[]
  postId: string
  category: string
  description: string
  status?: "draft" | "pending" | "approved"
  applicationAreas?: string
  quantityAvailable?: number
}

// Add the CommissionData interface
interface CommissionData {
  agentId: string
  name: string
  email: string
  commissionRate: number
  categoryCommissions?: Record<string, number>
}

// Define the WishlistItem interface
interface WishlistItem {
  postId: string
  name: string
  price: number
  category: string
  applicationAreas?: string[]
  description: string
  image: string[]
  quantity: number
  quantityAvailable?: number
}

export default function ProductsPage() {
  console.log("ProductsPage rendering")

  // Use the useParams hook to get the clientId
  const params = useParams()
  const router = useRouter()
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
  const [addingToWishlist, setAddingToWishlist] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<string | null>(null)
  const [clientData, setClientData] = useState<any>(null)
  // Add commission data state
  const [commissionData, setCommissionData] = useState<CommissionData | null>(null)
  // Add state for commission rate override
  const [overrideCommissionRate, setOverrideCommissionRate] = useState<number | null>(null)
  const [commissionLoading, setCommissionLoading] = useState(false)
  const [wishlistLoading, setWishlistLoading] = useState(false)

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

  // Save commission rate to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Use a client-specific key for commission rate
      if (overrideCommissionRate !== null) {
        localStorage.setItem(`commission-override-${clientId}`, overrideCommissionRate.toString())
      } else {
        localStorage.removeItem(`commission-override-${clientId}`)
      }
    }
  }, [overrideCommissionRate, clientId])

  // Handle commission rate change
  const handleCommissionRateChange = (rate: number | null) => {
    setOverrideCommissionRate(rate)
    console.log(`Setting commission rate for client ${clientId} to ${rate}`)
  }

  // Debug scroll event
  useEffect(() => {
    console.log("Setting up scroll debug in ProductsPage")
    const logScroll = () => {
      console.log("Scroll event detected in ProductsPage, window.scrollY:", window.scrollY)
    }

    window.addEventListener("scroll", logScroll)
    return () => window.removeEventListener("scroll", logScroll)
  }, [])

  // Fetch wishlist from backend
  const fetchWishlist = useCallback(async () => {
    try {
      setWishlistLoading(true)
      const token = localStorage.getItem("clientImpersonationToken")

      if (!token) {
        console.warn("No token found for fetching wishlist")
        return
      }

      const response = await fetch("https://evershinebackend-2.onrender.com/api/getUserWishlist", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch wishlist: ${response.status}`)
      }

      const data = await response.json()

      if (data.success && data.data && Array.isArray(data.data.items)) {
        // Extract just the postIds from the wishlist items
        const wishlistIds = data.data.items.map((item: WishlistItem) => item.postId)
        console.log("Fetched wishlist from backend:", wishlistIds)
        setWishlist(wishlistIds)

        // Update localStorage for optimistic UI updates
        localStorage.setItem(`wishlist-${clientId}`, JSON.stringify(wishlistIds))
      } else {
        console.log("No wishlist items found or invalid response format")
        setWishlist([])
        localStorage.setItem(`wishlist-${clientId}`, JSON.stringify([]))
      }
    } catch (error) {
      console.error("Error fetching wishlist:", error)
      // Fallback to localStorage if API fails
      try {
        const savedWishlist = localStorage.getItem(`wishlist-${clientId}`)
        if (savedWishlist) {
          setWishlist(JSON.parse(savedWishlist))
        }
      } catch (e) {
        console.error("Error loading wishlist from localStorage:", e)
      }
    } finally {
      setWishlistLoading(false)
    }
  }, [clientId])

  // Load cart from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedCart = localStorage.getItem(`cart-${clientId}`)
        if (savedCart) {
          setCart(JSON.parse(savedCart))
        }
      } catch (e) {
        console.error("Error loading cart from localStorage:", e)
      }
    }
  }, [clientId])

  // Fetch wishlist when component mounts or clientId changes
  useEffect(() => {
    fetchWishlist()
  }, [fetchWishlist, clientId])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(`cart-${clientId}`, JSON.stringify(cart))
    }
  }, [cart, clientId])

  // Add fetchCommissionData function
  const fetchCommissionData = useCallback(async () => {
    try {
      setCommissionLoading(true)
      const token = localStorage.getItem("clientImpersonationToken")
      if (!token) {
        return null
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://evershinebackend-2.onrender.com"
      const response = await fetch(`${apiUrl}/api/client/agent-commission`, {
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
  }, [])

  // Add calculateAdjustedPrice function with override support
  const calculateAdjustedPrice = useCallback(
    (product: Product) => {
      // Always use basePrice (which should be the original price)
      const basePrice = product.basePrice || product.price

      // Get the default commission rate (from agent or category-specific)
      let defaultRate = commissionData?.commissionRate || 10

      // Check for category-specific commission
      if (
        commissionData?.categoryCommissions &&
        product.category &&
        commissionData.categoryCommissions[product.category]
      ) {
        defaultRate = commissionData.categoryCommissions[product.category]
      }

      // Add the override rate to the default rate if an override is set
      const finalRate = overrideCommissionRate !== null ? defaultRate + overrideCommissionRate : defaultRate

      // Calculate adjusted price based on the original basePrice
      const adjustedPrice = basePrice * (1 + finalRate / 100)
      return Math.round(adjustedPrice * 100) / 100 // Round to 2 decimal places
    },
    [commissionData, overrideCommissionRate],
  )

  // Fetch products function
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // First fetch commission data
      await fetchCommissionData()

      // Use environment variable if available, otherwise use a default URL
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://evershinebackend-2.onrender.com"
      console.log("Fetching products from:", `${apiUrl}/api/getAllProducts`)

      const token = localStorage.getItem("clientImpersonationToken")
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

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`)
      }

      const data = await response.json()

      if (data.success && Array.isArray(data.data)) {
        console.log("Products fetched successfully:", data.data)

        // Filter out products with missing or invalid postId
        const validProducts = data.data.filter(
          (product: Product) => product.postId && typeof product.postId === "string",
        )

        if (validProducts.length < data.data.length) {
          console.warn(`Filtered out ${data.data.length - validProducts.length} products with invalid postId`)
        }

        // Process the image URLs to ensure they're valid
        const processedProducts = validProducts.map((product: Product) => ({
          ...product,
          image:
            Array.isArray(product.image) && product.image.length > 0
              ? product.image.filter((url: string) => typeof url === "string" && url.trim() !== "")
              : ["/placeholder.svg"],
          // Ensure basePrice is set if it doesn't exist
          basePrice: product.basePrice || product.price,
        }))

        setProducts(processedProducts)
      } else {
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
  }, [toast, fetchCommissionData])

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Navigate to wishlist page
  const goToWishlist = () => {
    router.push(`/client-dashboard/${clientId}/wishlist`)
  }

  // Update the toggleWishlist function to make an API call instead of just updating local state
  const toggleWishlist = useCallback(
    async (e: React.MouseEvent, productId: string) => {
      e.preventDefault() // Prevent navigation

      // Add validation here
      if (!productId || typeof productId !== "string") {
        toast({
          title: "Error",
          description: "Invalid product ID. Cannot update wishlist.",
          variant: "destructive",
        })
        return
      }

      // Set loading state for this specific product
      setAddingToWishlist((prev) => ({ ...prev, [productId]: true }))

      // Optimistically update UI
      if (wishlist.includes(productId)) {
        // Remove from wishlist
        setWishlist((prev) => prev.filter((id) => id !== productId))
      } else {
        // Add to wishlist
        setWishlist((prev) => [...prev, productId])
      }

      try {
        // Get the token
        const token = localStorage.getItem("clientImpersonationToken")

        if (!token) {
          throw new Error("No authentication token found. Please refresh the token using the debug panel above")
        }

        if (wishlist.includes(productId)) {
          // Remove from wishlist
          const response = await fetch("https://evershinebackend-2.onrender.com/api/deleteUserWishlistItem", {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ productId }),
          })

          if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`)
          }

          const data = await response.json()

          if (data.success) {
            // Update localStorage after successful API call
            const updatedWishlist = wishlist.filter((id) => id !== productId)
            localStorage.setItem(`wishlist-${clientId}`, JSON.stringify(updatedWishlist))

            toast({
              title: "Removed from wishlist",
              description: "Item has been removed from your wishlist",
              variant: "default",
            })

            // Refresh wishlist from backend to ensure sync
            fetchWishlist()
          } else {
            throw new Error(data.message || "Failed to remove from wishlist")
          }
        } else {
          // Add to wishlist
          const product = products.find((p) => p.postId === productId)
          if (!product) {
            throw new Error("Product not found")
          }

          const adjustedPrice = calculateAdjustedPrice(product)

          const response = await fetch("https://evershinebackend-2.onrender.com/api/addToWishlist", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              productId,
              // Include the current price with commission applied
              price: adjustedPrice,
            }),
          })

          if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`)
          }

          const data = await response.json()

          if (data.success) {
            // Update localStorage after successful API call
            const updatedWishlist = [...wishlist.filter((id) => id !== productId), productId]
            localStorage.setItem(`wishlist-${clientId}`, JSON.stringify(updatedWishlist))

            toast({
              title: "Added to wishlist",
              description: (
                <div className="flex flex-col space-y-2">
                  <p>Item has been added to your wishlist</p>
                  <Button onClick={goToWishlist} className="bg-[#194a95] hover:bg-[#0f3a7a] text-white" size="sm">
                    View Wishlist
                  </Button>
                </div>
              ),
              variant: "default",
            })

            // Refresh wishlist from backend to ensure sync
            fetchWishlist()
          } else {
            throw new Error(data.message || "Failed to add to wishlist")
          }
        }
      } catch (error: any) {
        console.error("Error updating wishlist:", error)

        // Revert the optimistic update
        if (wishlist.includes(productId)) {
          // We were trying to remove, but failed, so add it back
          setWishlist((prev) => [...prev, productId])
        } else {
          // We were trying to add, but failed, so remove it
          setWishlist((prev) => prev.filter((id) => id !== productId))
        }

        toast({
          title: "Error",
          description: error.message || "Failed to update wishlist. Please try again.",
          variant: "destructive",
        })
      } finally {
        setAddingToWishlist((prev) => ({ ...prev, [productId]: false }))
      }
    },
    [wishlist, toast, clientId, router, fetchWishlist, products, calculateAdjustedPrice],
  )

  // Add to cart function
  const addToCart = async (e: React.MouseEvent, productId: string, productName: string) => {
    e.preventDefault() // Prevent navigation

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

      // Immediately update UI state to show item as added to cart
      setCart((prev) => [...prev, productId])

      // Update localStorage cart
      const savedCart = localStorage.getItem(`cart-${clientId}`)
      const cartItems = savedCart ? JSON.parse(savedCart) : []
      localStorage.setItem(`cart-${clientId}`, JSON.stringify([...cartItems, productId]))

      // Get the token
      const token = localStorage.getItem("clientImpersonationToken")

      if (!token) {
        throw new Error("No authentication token found. Please refresh the token and try again.")
      }

      const product = products.find((p) => p.postId === productId)
      if (!product) {
        throw new Error("Product not found")
      }

      const adjustedPrice = calculateAdjustedPrice(product)

      // Make API request in background
      const response = await fetch("https://evershinebackend-2.onrender.com/api/addToCart", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          // Include the current price with commission applied
          price: adjustedPrice,
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Added to cart",
          description: `${productName} has been added to your cart`,
          variant: "default",
        })
      } else {
        throw new Error(data.message || "Failed to add to cart")
      }
    } catch (error: any) {
      // If there was an error, revert the cart state
      setCart((prev) => prev.filter((id) => id !== productId))

      console.error("Error adding to cart:", error)
      toast({
        title: "Error adding to cart",
        description: error.message || "Failed to add item to cart. Please try again.",
        variant: "destructive",
      })
    } finally {
      // Clear loading state
      setAddingToCart((prev) => ({ ...prev, [productId]: false }))
    }
  }

  // Add refresh wishlist function
  const refreshWishlist = () => {
    fetchWishlist()
    toast({
      title: "Refreshing wishlist",
      description: "Getting the latest wishlist data from the server",
    })
  }

  // Filter products based on search query
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Handle image loading errors
  const handleImageError = useCallback((productId: string) => {
    console.log("Image error for product:", productId)
    setImageError((prev) => ({ ...prev, [productId]: true }))
  }, [])

  // Handle QR code scanning
  const handleScanQR = () => {
    router.push(`/client-dashboard/${clientId}/scan`)
  }

  // Fetch client data
  useEffect(() => {
    const fetchClientData = async () => {
      try {
        const token = localStorage.getItem("clientImpersonationToken")
        if (!token) return

        const response = await fetch(`https://evershinebackend-2.onrender.com/api/getClientDetails/${clientId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const data = await response.json()
          if (data.data) {
            setClientData(data.data)
          }
        }
      } catch (error) {
        console.error("Error fetching client data:", error)
      }
    }

    fetchClientData()
  }, [clientId])

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading products...</p>
      </div>
    )
  }

  // Add this function to handle product card clicks
  const handleProductClick = (e: React.MouseEvent, productId: string) => {
    // Check if the click was on a button or its children
    const target = e.target as HTMLElement
    if (target.closest("button")) {
      // If clicked on a button, don't navigate
      e.preventDefault()
      return
    }

    // Otherwise, allow navigation to proceed
    router.push(`/client-dashboard/${clientId}/product/${productId}`)
  }

  return (
    <ErrorBoundary>
      <div className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h1 className="text-3xl font-bold">Welcome, {clientData?.name?.split(" ")[0] || "Client"}</h1>
        </div>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Products</h1>

          <div className="flex items-center gap-4">
            {/* Commission dots moved before scan button */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCommissionRateChange(5)}
                className={`w-6 h-6 rounded-full bg-red-500 hover:ring-2 hover:ring-red-300 transition-all ${overrideCommissionRate === 5 ? "ring-2 ring-gray-400 border border-gray-400 scale-110" : ""}`}
                title="Set 5% additional commission"
                aria-label="Set 5% additional commission"
              />
              <button
                onClick={() => handleCommissionRateChange(10)}
                className={`w-6 h-6 rounded-full bg-yellow-500 hover:ring-2 hover:ring-yellow-300 transition-all ${overrideCommissionRate === 10 ? "ring-2 ring-gray-400 border border-gray-400 scale-110" : ""}`}
                title="Set 10% additional commission"
                aria-label="Set 10% additional commission"
              />
              <button
                onClick={() => handleCommissionRateChange(15)}
                className={`w-6 h-6 rounded-full bg-purple-500 hover:ring-2 hover:ring-purple-300 transition-all ${overrideCommissionRate === 15 ? "ring-2 ring-gray-400 border border-gray-400 scale-110" : ""}`}
                title="Set 15% additional commission"
                aria-label="Set 15% additional commission"
              />
              {overrideCommissionRate !== null && (
                <button
                  onClick={() => handleCommissionRateChange(null)}
                  className="text-xs text-gray-600 hover:text-gray-900"
                  title="Reset to default commission"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Refresh Wishlist Button */}
            <button
              onClick={refreshWishlist}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Refresh Wishlist"
              title="Refresh Wishlist"
              disabled={wishlistLoading}
            >
              {wishlistLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-gray-600" />
              ) : (
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
                  className="h-6 w-6 text-gray-600"
                >
                  <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                  <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                  <path d="M16 21h5v-5" />
                </svg>
              )}
            </button>

            {/* Scan QR Button */}
            <button
              onClick={handleScanQR}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Scan QR Code"
            >
              <QrCode className="h-6 w-6 text-gray-600" />
            </button>

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
            {filteredProducts.map((product) => {
              // Calculate the adjusted price based on commission
              const adjustedPrice = calculateAdjustedPrice(product)

              return (
                <div
                  key={product._id}
                  className="group relative bg-card rounded-lg overflow-hidden border border-border hover:border-primary transition-all hover:shadow-md cursor-pointer"
                  onClick={(e) => handleProductClick(e, product.postId)}
                >
                  <div className="p-3">
                    <div className="relative w-full overflow-hidden rounded-xl bg-gray-50 aspect-square">
                      <Image
                        src={imageError[product._id] ? "/placeholder.svg" : product.image?.[0] || "/placeholder.svg"}
                        alt={product.name}
                        fill
                        unoptimized={true} // This bypasses Vercel's image optimization
                        className="object-cover transition-transform group-hover:scale-105 duration-300"
                        onError={() => handleImageError(product._id)}
                      />

                      {/* Wishlist button overlay */}
                      <button
                        onClick={(e) => toggleWishlist(e, product.postId)}
                        className="absolute top-2 right-2 p-2 rounded-full bg-white/80 hover:bg-white transition-colors z-10"
                        aria-label={wishlist.includes(product.postId) ? "Remove from wishlist" : "Add to wishlist"}
                        type="button"
                        disabled={addingToWishlist[product.postId]}
                      >
                        {addingToWishlist[product.postId] ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Heart
                            className={`h-5 w-5 ${
                              wishlist.includes(product.postId) ? "text-red-500 fill-red-500" : "text-gray-600"
                            }`}
                          />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-lg text-foreground line-clamp-1">{product.name}</h3>

                    {/* Simplified price display - just the adjusted price */}
                    <div className="mt-2">
                      <p className="text-lg font-bold">₹{adjustedPrice.toLocaleString()}/sqft</p>
                    </div>

                    <p className="text-sm text-muted-foreground mt-1">
                      <span className="font-medium">Category:</span> {product.category}
                    </p>

                    <button
                      onClick={(e) => toggleWishlist(e, product.postId)}
                      className={`mt-4 w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2
                                ${
                                  wishlist.includes(product.postId)
                                    ? "bg-gray-100 text-gray-600 border border-gray-200"
                                    : addingToWishlist[product.postId]
                                      ? "bg-gray-200 text-gray-700"
                                      : "bg-primary hover:bg-primary/90 text-primary-foreground"
                                } 
                                transition-colors`}
                      disabled={addingToWishlist[product.postId]}
                      type="button"
                    >
                      {addingToWishlist[product.postId] ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : wishlist.includes(product.postId) ? (
                        <>
                          <Heart className="h-4 w-4 fill-gray-500 mr-1" />
                          Added to Wishlist
                        </>
                      ) : (
                        <>
                          <Heart className="h-4 w-4 mr-1" />
                          Add to Wishlist
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Add extra space at the bottom to ensure scrolling is possible */}
        <div className="h-[500px]"></div>
      </div>
    </ErrorBoundary>
  )
}
