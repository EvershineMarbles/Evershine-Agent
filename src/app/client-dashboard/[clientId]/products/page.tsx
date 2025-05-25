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

// Define the Product interface with updatedPrice
interface Product {
  _id: string
  name: string
  price: number
  basePrice?: number
  updatedPrice?: number // Backend calculated price
  image: string[]
  postId: string
  category: string
  description: string
  status?: "draft" | "pending" | "approved"
  applicationAreas?: string
  quantityAvailable?: number
  commissionInfo?: {
    currentAgentCommission: number
    consultantLevelCommission: number
    totalCommission: number
    consultantLevel: string
  }
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
  const [wishlistLoading, setWishlistLoading] = useState(false)

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
        const wishlistIds = data.data.items.map((item: WishlistItem) => item.postId)
        setWishlist(wishlistIds)
        localStorage.setItem(`wishlist-${clientId}`, JSON.stringify(wishlistIds))
      } else {
        setWishlist([])
        localStorage.setItem(`wishlist-${clientId}`, JSON.stringify([]))
      }
    } catch (error) {
      console.error("Error fetching wishlist:", error)
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

  // Fetch products function - NOW USES CLIENT-SPECIFIC ENDPOINT
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://evershinebackend-2.onrender.com"
      const endpoint = `${apiUrl}/api/getClientProducts`

      const token = localStorage.getItem("clientImpersonationToken")
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }

      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      } else {
        throw new Error("No authentication token found. Please refresh the page.")
      }

      const response = await fetch(endpoint, {
        method: "GET",
        headers,
        signal: AbortSignal.timeout(10000),
      })

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`)
      }

      const data = await response.json()

      if (data.success && Array.isArray(data.data)) {
        const validProducts = data.data.filter(
          (product: Product) => product.postId && typeof product.postId === "string",
        )

        if (validProducts.length < data.data.length) {
          console.warn(`Filtered out ${data.data.length - validProducts.length} products with invalid postId`)
        }

        const processedProducts = validProducts.map((product: Product) => ({
          ...product,
          image:
            Array.isArray(product.image) && product.image.length > 0
              ? product.image.filter((url: string) => typeof url === "string" && url.trim() !== "")
              : ["/placeholder.svg"],
          basePrice: product.basePrice || product.price,
        }))

        setProducts(processedProducts)
      } else {
        throw new Error(data.message || "Invalid API response format")
      }
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load products"
      console.error("Error fetching products:", error)
      setError(errorMessage)

      toast({
        title: "Error fetching products",
        description: "Could not load products from the server. Please try again later.",
        variant: "destructive",
      })

      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [toast])

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Auto-refresh products every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      console.log("🔄 Auto-refreshing products...")
      fetchProducts()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [fetchProducts])

  // Handle consultant level change with auto-save
  const handleConsultantLevelChange = async (level: string) => {
    try {
      const token = localStorage.getItem("clientImpersonationToken")
      if (!token) {
        toast({
          title: "Error",
          description: "No authentication token found",
          variant: "destructive",
        })
        return
      }

      // Optimistically update the UI
      setClientData((prev: any) => ({ ...prev, consultantLevel: level }))

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "https://evershinebackend-2.onrender.com"}/api/update-client`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...clientData,
            consultantLevel: level,
          }),
        },
      )

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }

  
      // Refresh products to get updated pricing
      fetchProducts()
    } catch (error: any) {
      console.error("Error updating consultant level:", error)
      // Revert the optimistic update
      setClientData((prev: any) => ({ ...prev, consultantLevel: clientData?.consultantLevel || "red" }))
      toast({
        title: "Error",
        description: error.message || "Failed to update consultant level",
        variant: "destructive",
      })
    }
  }

  // Navigate to wishlist page
  const goToWishlist = () => {
    router.push(`/client-dashboard/${clientId}/wishlist`)
  }

  // Update the toggleWishlist function
  const toggleWishlist = useCallback(
    async (e: React.MouseEvent, productId: string) => {
      e.preventDefault()

      if (!productId || typeof productId !== "string") {
        toast({
          title: "Error",
          description: "Invalid product ID. Cannot update wishlist.",
          variant: "destructive",
        })
        return
      }

      setAddingToWishlist((prev) => ({ ...prev, [productId]: true }))

      if (wishlist.includes(productId)) {
        setWishlist((prev) => prev.filter((id) => id !== productId))
      } else {
        setWishlist((prev) => [...prev, productId])
      }

      try {
        const token = localStorage.getItem("clientImpersonationToken")

        if (!token) {
          throw new Error("No authentication token found. Please refresh the token using the debug panel above")
        }

        if (wishlist.includes(productId)) {
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
            const updatedWishlist = wishlist.filter((id) => id !== productId)
            localStorage.setItem(`wishlist-${clientId}`, JSON.stringify(updatedWishlist))

            toast({
              title: "Removed from wishlist",
              description: "Item has been removed from your wishlist",
              variant: "default",
            })

            fetchWishlist()
          } else {
            throw new Error(data.message || "Failed to remove from wishlist")
          }
        } else {
          // Add to wishlist - let backend calculate the price
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

            fetchWishlist()
          } else {
            throw new Error(data.message || "Failed to add to wishlist")
          }
        }
      } catch (error: any) {
        console.error("Error updating wishlist:", error)

        if (wishlist.includes(productId)) {
          setWishlist((prev) => [...prev, productId])
        } else {
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
    [wishlist, toast, clientId, router, fetchWishlist, products],
  )

  // Add to cart function
  const addToCart = async (e: React.MouseEvent, productId: string, productName: string) => {
    e.preventDefault()

    if (cart.includes(productId)) {
      toast({
        title: "Already in cart",
        description: "This item is already in your cart",
        variant: "default",
      })
      return
    }

    try {
      setAddingToCart((prev) => ({ ...prev, [productId]: true }))
      setCart((prev) => [...prev, productId])

      const savedCart = localStorage.getItem(`cart-${clientId}`)
      const cartItems = savedCart ? JSON.parse(savedCart) : []
      localStorage.setItem(`cart-${clientId}`, JSON.stringify([...cartItems, productId]))

      const token = localStorage.getItem("clientImpersonationToken")

      if (!token) {
        throw new Error("No authentication token found. Please refresh the token and try again.")
      }

      // Make API request - let backend calculate price
      const response = await fetch("https://evershinebackend-2.onrender.com/api/addToCart", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          // Don't send price - let backend calculate it
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
      setCart((prev) => prev.filter((id) => id !== productId))

      console.error("Error adding to cart:", error)
      toast({
        title: "Error adding to cart",
        description: error.message || "Failed to add item to cart. Please try again.",
        variant: "destructive",
      })
    } finally {
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
      {/* Big gradient background showing consultant level */}
      <div
        className={`h-16 w-full flex items-center justify-center text-white font-medium ${
          clientData?.consultantLevel === "red"
            ? "bg-gradient-to-r from-red-400 via-red-500 to-red-600"
            : clientData?.consultantLevel === "yellow"
              ? "bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600"
              : clientData?.consultantLevel === "purple"
                ? "bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600"
                : "bg-gradient-to-r from-red-400 via-red-500 to-red-600"
        }`}
      >
        <span className="text-lg font-semibold">
          {clientData?.consultantLevel === "red"
            ? "Red Level - 5% Commission"
            : clientData?.consultantLevel === "yellow"
              ? "Yellow Level - 10% Commission"
              : clientData?.consultantLevel === "purple"
                ? "Purple Level - 15% Commission"
                : "Red Level - 5% Commission"}
        </span>
      </div>

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
            {/* Color dots for consultant level switching */}
            <div className="flex items-center gap-2 mr-2">
              <button
                onClick={() => handleConsultantLevelChange("red")}
                className={`w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 transition-all ${
                  clientData?.consultantLevel === "red" ? "ring-2 ring-red-300 scale-110" : "hover:scale-105"
                }`}
                title="Red Level (+5%)"
              />
              <button
                onClick={() => handleConsultantLevelChange("yellow")}
                className={`w-6 h-6 rounded-full bg-yellow-500 hover:bg-yellow-600 transition-all ${
                  clientData?.consultantLevel === "yellow" ? "ring-2 ring-yellow-300 scale-110" : "hover:scale-105"
                }`}
                title="Yellow Level (+10%)"
              />
              <button
                onClick={() => handleConsultantLevelChange("purple")}
                className={`w-6 h-6 rounded-full bg-purple-600 hover:bg-purple-700 transition-all ${
                  clientData?.consultantLevel === "purple" ? "ring-2 ring-purple-300 scale-110" : "hover:scale-105"
                }`}
                title="Purple Level (+15%)"
              />
            </div>

            {/* Scan QR Button */}
            <button
              onClick={handleScanQR}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Scan QR Code"
            >
              <QrCode className="h-6 w-6 text-gray-600" />
            </button>

            <Link
              href={`/client-dashboard/${clientId}/wishlist`}
              className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Heart className="h-6 w-6 text-gray-600" />
              {wishlist.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </Link>

            <Link
              href={`/client-dashboard/${clientId}/cart`}
              className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {filteredProducts.map((product) => {
              // USE BACKEND CALCULATED PRICE
              const displayPrice = product.updatedPrice || product.price
              const hasCommission = product.updatedPrice && product.updatedPrice !== product.price
              const originalPrice = product.basePrice || product.price

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
                        unoptimized={true}
                        className="object-cover transition-transform group-hover:scale-105 duration-300"
                        onError={() => handleImageError(product._id)}
                      />

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

                    {/* DISPLAY BACKEND CALCULATED PRICE */}
                    <div className="mt-2">
                      {hasCommission ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="text-lg font-bold text-green-600">₹{displayPrice.toLocaleString()}/sqft</p>
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                              Commission Applied ✓
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 line-through">₹{originalPrice.toLocaleString()}/sqft</p>
                          {product.commissionInfo && (
                            <p className="text-xs text-gray-600">
                              +{product.commissionInfo.totalCommission}% total commission
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-lg font-bold">₹{displayPrice.toLocaleString()}/sqft</p>
                      )}
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
