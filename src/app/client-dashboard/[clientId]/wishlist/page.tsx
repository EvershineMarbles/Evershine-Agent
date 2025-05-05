"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Trash2, Loader2, Heart, ShoppingCart, RefreshCw, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import axios from "axios"

interface WishlistItem {
  _id: string
  postId: string
  name: string
  price: number
  basePrice?: number
  image: string[]
  category: string
}

export default function WishlistPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const clientId = params.clientId as string

  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [authStatus, setAuthStatus] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<Record<string, { removing: boolean; addingToCart: boolean }>>({})
  const [cartCount, setCartCount] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  // Get token from localStorage with better error handling
  const getToken = () => {
    try {
      const token = localStorage.getItem("clientImpersonationToken")
      if (!token) {
        console.error("No clientImpersonationToken found in localStorage")
        setAuthStatus("No clientImpersonationToken found")
        return null
      }
      return token
    } catch (e) {
      console.error("Error accessing localStorage:", e)
      setAuthStatus("Error accessing localStorage")
      return null
    }
  }

  // Fetch wishlist items
  const fetchWishlist = async () => {
    try {
      setLoading(true)
      console.log("Fetching wishlist...")

      const token = getToken()
      if (!token) {
        setError("Authentication required. Please log in again.")
        setLoading(false)
        return
      }

      // Log the token format (first few characters for security)
      console.log(`Token format check: ${token.substring(0, 10)}...`)
      setAuthStatus(`Using token starting with: ${token.substring(0, 10)}...`)

      // Make sure we're using the correct API URL
      const apiUrl = process.env.REACT_APP_API_URL || "https://evershinebackend-2.onrender.com"
      console.log(`Using API URL: ${apiUrl}`)

      const response = await axios.get(`${apiUrl}/api/getUserWishlist`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log("Wishlist API response:", response.data)

      if (response.data.success) {
        const items = response.data.data.items || []

        // Log the raw items to see their structure
        console.log("Raw wishlist items:", JSON.stringify(items, null, 2))

        setWishlistItems(items)

        // Initialize action loading state for each item
        const initialState: Record<string, { removing: boolean; addingToCart: boolean }> = {}
        items.forEach((item: WishlistItem) => {
          const itemId = item.postId || item._id
          initialState[itemId] = { removing: false, addingToCart: false }
        })
        setActionLoading(initialState)

        // Log each item's details
        items.forEach((item: WishlistItem, index: number) => {
          const itemId = item.postId || item._id
          const basePrice = item.basePrice || item.price
          const commission = item.price - (basePrice || 0)

          console.log(`Wishlist item ${index + 1}:`, {
            id: itemId,
            name: item.name,
            category: item.category,
            basePrice: basePrice,
            adjustedPrice: item.price,
            commission: commission,
            commissionPercent: basePrice ? ((item.price / basePrice - 1) * 100).toFixed(2) + "%" : "N/A",
          })
        })
      } else {
        console.error("Failed to fetch wishlist:", response.data.message)
        setError("Failed to fetch wishlist: " + (response.data.message || "Unknown error"))
      }
    } catch (error: any) {
      console.error("Error fetching wishlist:", error)

      // Provide more detailed error information
      if (error.response) {
        console.error("Response error data:", error.response.data)
        console.error("Response error status:", error.response.status)

        if (error.response.status === 401) {
          setError("Authentication failed. Please log in again.")
          setAuthStatus("Token rejected by server (401)")
        } else {
          setError(`Server error: ${error.response.status} - ${error.response.data?.message || "Unknown error"}`)
        }
      } else if (error.request) {
        console.error("No response received:", error.request)
        setError("No response from server. Please check your internet connection.")
      } else {
        console.error("Request setup error:", error.message)
        setError("Error setting up request: " + error.message)
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Fetch cart count
  const fetchCartCount = async () => {
    try {
      const token = getToken()
      if (!token) return

      const apiUrl = process.env.REACT_APP_API_URL || "https://evershinebackend-2.onrender.com"

      const response = await axios.get(`${apiUrl}/api/getUserCart`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.data.success && response.data.data && Array.isArray(response.data.data.items)) {
        setCartCount(response.data.data.items.length)
      }
    } catch (error) {
      console.error("Error fetching cart count:", error)
    }
  }

  // Initialize data on component mount
  useEffect(() => {
    fetchWishlist()
    fetchCartCount()
  }, [])

  // Remove item from wishlist
  const removeFromWishlist = async (productId: string) => {
    try {
      setActionLoading((prev) => ({
        ...prev,
        [productId]: { ...prev[productId], removing: true },
      }))

      console.log(`Removing product ${productId} from wishlist...`)

      const token = getToken()
      if (!token) {
        toast({
          title: "Authentication required",
          description: "Please log in again to continue.",
          variant: "destructive",
        })
        return
      }

      // Make sure we're using the correct API URL
      const apiUrl = process.env.REACT_APP_API_URL || "https://evershinebackend-2.onrender.com"

      const response = await axios.delete(`${apiUrl}/api/deleteUserWishlistItem`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: { productId },
      })

      console.log("Remove from wishlist response:", response.data)

      if (response.data.success) {
        console.log(`Product ${productId} removed successfully`)
        // Update local state
        setWishlistItems((prev) => prev.filter((item) => (item.postId || item._id) !== productId))

        toast({
          title: "Item removed",
          description: "Item has been removed from your wishlist",
        })
      } else {
        console.error("Failed to remove item:", response.data.message)
        toast({
          title: "Failed to remove item",
          description: response.data.message || "Unknown error",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Error removing item from wishlist:", error)

      if (error.response && error.response.status === 401) {
        toast({
          title: "Authentication failed",
          description: "Please log in again to continue.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to remove item from wishlist",
          variant: "destructive",
        })
      }
    } finally {
      setActionLoading((prev) => ({
        ...prev,
        [productId]: { ...prev[productId], removing: false },
      }))
    }
  }

  // Add item to cart
  const addToCart = async (productId: string) => {
    try {
      setActionLoading((prev) => ({
        ...prev,
        [productId]: { ...prev[productId], addingToCart: true },
      }))

      console.log(`Adding product ${productId} to cart...`)

      const token = getToken()
      if (!token) {
        toast({
          title: "Authentication required",
          description: "Please log in again to continue.",
          variant: "destructive",
        })
        return
      }

      // Make sure we're using the correct API URL
      const apiUrl = process.env.REACT_APP_API_URL || "https://evershinebackend-2.onrender.com"

      const response = await axios.post(
        `${apiUrl}/api/addToCart`,
        { productId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      console.log("Add to cart response:", response.data)

      if (response.data.success) {
        // Increment cart count
        setCartCount((prev) => prev + 1)

        // Remove from wishlist
        await removeFromWishlist(productId)

        toast({
          title: "Added to cart",
          description: "Item has been added to your cart and removed from wishlist",
          action: (
            <Button variant="outline" size="sm" onClick={() => router.push(`/client-dashboard/${clientId}/cart`)}>
              View Cart
            </Button>
          ),
        })
      } else {
        toast({
          title: "Failed to add item",
          description: response.data.message || "Failed to add item to cart",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Error adding item to cart:", error)

      if (error.response && error.response.status === 401) {
        toast({
          title: "Authentication failed",
          description: "Please log in again to continue.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to add item to cart",
          variant: "destructive",
        })
      }
    } finally {
      setActionLoading((prev) => ({
        ...prev,
        [productId]: { ...prev[productId], addingToCart: false },
      }))
    }
  }

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true)
    fetchWishlist()
    fetchCartCount()
  }

  // Handle login
  const handleLogin = () => {
    router.push("/agent-login")
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading your wishlist...</p>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
          <div className="flex items-center mb-4">
            <AlertCircle className="h-6 w-6 text-red-500 mr-2" />
            <h2 className="text-xl font-semibold text-red-700">Error Loading Wishlist</h2>
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          {authStatus && <p className="text-sm text-gray-500 mb-4">Auth status: {authStatus}</p>}
          <div className="flex flex-wrap gap-2 mt-4">
            <Button onClick={handleLogin} variant="default">
              Go to Login
            </Button>
            <Button onClick={fetchWishlist} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">Your Wishlist</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing} className="relative">
            <RefreshCw className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`} />
          </Button>

          <Link
            href={`/client-dashboard/${clientId}/cart`}
            className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ShoppingCart className="h-6 w-6 text-gray-600" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {wishlistItems.length === 0 ? (
        <div className="text-center py-12 bg-muted/20 rounded-lg">
          <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-xl font-medium mb-4">Your wishlist is empty</p>
          <p className="text-muted-foreground mb-6">Add some products to your wishlist to see them here</p>
          <Button
            onClick={() => router.push(`/client-dashboard/${clientId}/products`)}
            className="bg-primary hover:bg-primary/90"
          >
            Browse Products
          </Button>
        </div>
      ) : (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="p-4 bg-muted/20 border-b border-border">
            <h2 className="font-semibold">Wishlist Items ({wishlistItems.length})</h2>
          </div>
          <div className="divide-y divide-border">
            {wishlistItems.map((item) => {
              const itemId = item.postId || item._id
              const basePrice = item.basePrice || item.price
              const commission = item.price - (basePrice || 0)
              const commissionPercent = basePrice ? ((item.price / basePrice - 1) * 100).toFixed(2) : "0"

              return (
                <div key={itemId} className="p-4 flex flex-col md:flex-row md:items-center">
                  <div className="relative h-20 w-20 rounded-md overflow-hidden flex-shrink-0 mb-4 md:mb-0">
                    <Image
                      src={item.image && item.image.length > 0 ? item.image[0] : "/placeholder.svg?height=80&width=80"}
                      alt={item.name}
                      fill
                      className="object-cover"
                      unoptimized={true}
                    />
                  </div>
                  <div className="md:ml-4 flex-grow">
                    <h3 className="font-medium">{item.name || "Unknown Product"}</h3>
                    <p className="text-sm text-muted-foreground">{item.category || "Uncategorized"}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                      <div>
                        {basePrice !== item.price ? (
                          <div>
                            <span className="line-through text-sm text-muted-foreground">
                              ₹{basePrice.toLocaleString()}
                            </span>
                            <span className="font-semibold ml-2">₹{item.price.toLocaleString()}</span>
                          </div>
                        ) : (
                          <span className="font-semibold">₹{item.price.toLocaleString()}</span>
                        )}
                      </div>

                      {commission > 0 && (
                        <Badge variant="outline" className="text-green-600 bg-green-50">
                          +₹{commission.toLocaleString()} ({commissionPercent}%)
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 mt-4 md:mt-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addToCart(itemId)}
                      disabled={actionLoading[itemId]?.addingToCart}
                      className="flex items-center"
                    >
                      {actionLoading[itemId]?.addingToCart ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <ShoppingCart className="h-4 w-4 mr-2" />
                      )}
                      Add to Cart
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFromWishlist(itemId)}
                      disabled={actionLoading[itemId]?.removing}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      {actionLoading[itemId]?.removing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="p-4 bg-muted/10 border-t border-border">
            <div className="flex justify-end">
              <Link href={`/client-dashboard/${clientId}/products`} className="text-sm text-primary hover:underline">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
