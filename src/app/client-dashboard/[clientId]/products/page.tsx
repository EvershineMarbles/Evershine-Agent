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
  basePrice?: number // Original price before commission
  image: string[]
  postId: string
  category: string
  description: string
  status?: "draft" | "pending" | "approved"
  applicationAreas?: string
  quantityAvailable?: number
}

// Define the agent data interface
interface AgentData {
  _id: string
  name: string
  email: string
  commissionRate: number
}

export default function ProductsPage() {
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
  const [showBackToTop, setShowBackToTop] = useState(false)
  // Agent data state
  const [agentData, setAgentData] = useState<AgentData | null>(null)

  // Handle scroll for Back to Top button
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowBackToTop(true)
      } else {
        setShowBackToTop(false)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  // Handle QR scan
  const handleScanQR = () => {
    router.push(`/client-dashboard/${clientId}/scan-qr/sqt`)
  }

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

  // Fetch agent data from the backend
  const fetchAgentData = useCallback(async () => {
    try {
      console.log("Fetching agent data...")

      // Get the token
      const token = localStorage.getItem("clientImpersonationToken")
      if (!token) {
        throw new Error("No authentication token found")
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://evershinebackend-2.onrender.com"

      // Try to extract agent info from the token
      try {
        const base64Url = token.split(".")[1]
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join(""),
        )

        const payload = JSON.parse(jsonPayload)
        console.log("Token payload:", payload)

        // If this is an impersonation token, it should have agent info
        if (payload.isImpersonating && payload.agentId) {
          console.log("Found agent ID in token:", payload.agentId)

          // Fetch client details to get the agent email
          const clientResponse = await fetch(`${apiUrl}/api/getClientDetails/${clientId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          })

          if (clientResponse.ok) {
            const clientData = await clientResponse.json()
            console.log("Client data:", clientData)

            if (clientData.success && clientData.data && clientData.data.agentAffiliated) {
              // Now fetch the agent details using the agent email
              const agentEmail = clientData.data.agentAffiliated
              console.log("Agent email from client data:", agentEmail)

              // Find the agent by email in the database
              const agentsResponse = await fetch(`${apiUrl}/api/getAllAgents`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              })

              if (agentsResponse.ok) {
                const agentsData = await agentsResponse.json()
                console.log("All agents data:", agentsData)

                if (agentsData.success && Array.isArray(agentsData.data)) {
                  // Find the agent with matching email
                  const agent = agentsData.data.find((a: any) => a.email === agentEmail)

                  if (agent) {
                    console.log("Found agent with matching email:", agent)
                    setAgentData({
                      _id: agent._id,
                      name: agent.name,
                      email: agent.email,
                      commissionRate: agent.commissionRate || 0,
                    })
                    return
                  }
                }
              }
            }
          }
        }
      } catch (tokenError) {
        console.error("Error extracting agent data from token:", tokenError)
      }

      // If we couldn't get the agent data from the token, try the direct API endpoint
      try {
        // This endpoint should be implemented on your backend
        const response = await fetch(`${apiUrl}/api/client/agent-info`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          signal: AbortSignal.timeout(5000),
        })

        if (response.ok) {
          const data = await response.json()
          console.log("Agent data response:", data)

          if (data.success && data.data) {
            setAgentData(data.data)
            return
          }
        }
      } catch (apiError) {
        console.error("Error fetching agent data from API:", apiError)
      }

      // Check if we have cached data
      const savedAgentData = localStorage.getItem(`agentData_${clientId}`)
      if (savedAgentData) {
        const parsedData = JSON.parse(savedAgentData)
        setAgentData(parsedData)
        console.log(`Using cached agent data with commission rate: ${parsedData.commissionRate}%`)
        return
      }

      // As a last resort, use hardcoded data
      console.log("Using hardcoded agent data")
      const hardcodedAgent = {
        _id: "680cb109d48d142ea4fbd751",
        name: "Agent",
        email: "agent@example.com",
        commissionRate: 10, // Use the correct commission rate from your database
      }

      // Save to localStorage to prevent refetching on each render
      localStorage.setItem(`agentData_${clientId}`, JSON.stringify(hardcodedAgent))
      setAgentData(hardcodedAgent)
    } catch (error) {
      console.error("Error fetching agent data:", error)

      // Use hardcoded data as fallback
      const hardcodedAgent = {
        _id: "680cb109d48d142ea4fbd751",
        name: "Agent",
        email: "agent@example.com",
        commissionRate: 10, // Use the correct commission rate from your database
      }

      // Save to localStorage to prevent refetching on each render
      localStorage.setItem(`agentData_${clientId}`, JSON.stringify(hardcodedAgent))
      setAgentData(hardcodedAgent)
    }
  }, [clientId])

  // Fetch agent data on component mount
  useEffect(() => {
    fetchAgentData()
  }, [fetchAgentData])

  // Fetch products function
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Get the token for authentication
      const token = localStorage.getItem("clientImpersonationToken")

      if (!token) {
        throw new Error("Authentication token not found. Please log in again.")
      }

      // Use environment variable if available, otherwise use a default URL
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://evershinebackend-2.onrender.com"

      // Try the client/products endpoint first which should have commission already applied
      console.log("Fetching from client products endpoint:", `${apiUrl}/api/client/products`)

      const response = await fetch(`${apiUrl}/api/client/products`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(8000), // 8 second timeout
      })

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`)
      }

      const data = await response.json()
      console.log("Products response:", data)

      if (data.success && Array.isArray(data.data)) {
        // Process the image URLs to ensure they're valid
        const processedProducts = data.data.map((product: Product) => ({
          ...product,
          image:
            Array.isArray(product.image) && product.image.length > 0
              ? product.image.filter((url: string) => typeof url === "string" && url.trim() !== "")
              : ["/assorted-products-display.png"],
        }))

        setProducts(processedProducts)
      } else {
        throw new Error(data.msg || "Invalid API response format")
      }
    } catch (error: any) {
      // If client/products endpoint fails, try the agent/products endpoint
      try {
        console.log("Client products endpoint failed, trying agent products endpoint")

        const token = localStorage.getItem("clientImpersonationToken")
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://evershinebackend-2.onrender.com"

        const response = await fetch(`${apiUrl}/api/agent/products`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          signal: AbortSignal.timeout(8000),
        })

        if (!response.ok) {
          throw new Error(`Agent products API request failed with status ${response.status}`)
        }

        const data = await response.json()
        console.log("Agent products response:", data)

        if (data.success && Array.isArray(data.data)) {
          // Process the image URLs to ensure they're valid
          const processedProducts = data.data.map((product: Product) => ({
            ...product,
            image:
              Array.isArray(product.image) && product.image.length > 0
                ? product.image.filter((url: string) => typeof url === "string" && url.trim() !== "")
                : ["/assorted-products-display.png"],
          }))

          setProducts(processedProducts)
          return
        }
      } catch (agentError) {
        console.error("Error fetching from agent products endpoint:", agentError)

        // If both endpoints fail, try the general products endpoint and apply commission manually
        try {
          console.log("Both endpoints failed, trying general products endpoint")

          const token = localStorage.getItem("clientImpersonationToken")
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://evershinebackend-2.onrender.com"

          const response = await fetch(`${apiUrl}/api/getAllProducts`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            signal: AbortSignal.timeout(8000),
          })

          if (!response.ok) {
            throw new Error(`General products API request failed with status ${response.status}`)
          }

          const data = await response.json()
          console.log("General products response:", data)

          if (data.success && Array.isArray(data.data) && agentData) {
            // Apply commission rate manually
            const commissionRate = agentData.commissionRate || 0

            const productsWithCommission = data.data.map((product: Product) => {
              const originalPrice = product.price
              const adjustedPrice = Math.round(originalPrice * (1 + commissionRate / 100))

              return {
                ...product,
                basePrice: originalPrice,
                price: adjustedPrice,
                image:
                  Array.isArray(product.image) && product.image.length > 0
                    ? product.image.filter((url: string) => typeof url === "string" && url.trim() !== "")
                    : ["/assorted-products-display.png"],
              }
            })

            setProducts(productsWithCommission)
            return
          }
        } catch (generalError) {
          console.error("Error fetching from general products endpoint:", generalError)
        }
      }

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
  }, [agentData, toast])

  // Fetch products when agentData is available
  useEffect(() => {
    if (agentData) {
      fetchProducts()
    }
  }, [agentData, fetchProducts])

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
            toast({
              title: "Removed from wishlist",
              description: "Item has been removed from your wishlist",
              variant: "default",
            })
          } else {
            throw new Error(data.message || "Failed to remove from wishlist")
          }
        } else {
          // Add to wishlist
          const response = await fetch("https://evershinebackend-2.onrender.com/api/addToWishlist", {
            method: "POST",
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
            toast({
              title: "Added to wishlist",
              description: (
                <div className="flex flex-col space-y-2">
                  <p>Item has been added to your wishlist</p>
                  <Button
                    size="sm"
                    onClick={() => router.push(`/client-dashboard/${clientId}/wishlist`)}
                    className="bg-[#194a95] hover:bg-[#0f3a7a] text-white w-fit"
                  >
                    View Wishlist
                  </Button>
                </div>
              ),
              variant: "default",
            })
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
    [wishlist, toast, router, clientId],
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
      const savedCart = localStorage.getItem("cart")
      const cartItems = savedCart ? JSON.parse(savedCart) : []
      localStorage.setItem("cart", JSON.stringify([...cartItems, productId]))

      // Get the token
      const token = localStorage.getItem("clientImpersonationToken")

      if (!token) {
        throw new Error("No authentication token found. Please refresh the token and try again.")
      }

      // Make API request in background
      const response = await fetch("https://evershinebackend-2.onrender.com/api/addToCart", {
        method: "POST",
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

        {agentData && (
          <Alert className="mb-4 bg-blue-50 border-blue-200">
            <div className="text-sm">
              <p className="font-semibold">Agent Commission Info:</p>
              <p>Agent: {agentData.name}</p>
              <p>Commission Rate: {agentData.commissionRate}%</p>
            </div>
          </Alert>
        )}

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Products</h1>

          <div className="flex items-center gap-4">
            {/* Scan QR Button - Added before wishlist */}
            <Button onClick={handleScanQR} variant="outline" className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              <span className="hidden sm:inline">Scan QR</span>
            </Button>

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

                {/* Product details */}
                <div className="p-4">
                  <h3 className="font-semibold text-lg text-foreground line-clamp-1">{product.name}</h3>

                  {/* Price display with commission information */}
                  <div className="mt-2">
                    <p className="text-lg font-bold text-foreground">₹{product.price.toLocaleString()}/sqft</p>
                    {product.basePrice && product.basePrice !== product.price && (
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground line-through">
                          ₹{product.basePrice.toLocaleString()}/sqft
                        </p>
                        <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-800 rounded-full">
                          {Math.round(((product.price - product.basePrice) / product.basePrice) * 100)}% commission
                        </span>
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground mt-1">{product.category}</p>

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
            ))}
          </div>
        )}

        {/* Back to top button */}
        {showBackToTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 p-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors"
            aria-label="Back to top"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
        )}
      </div>
    </ErrorBoundary>
  )
}
