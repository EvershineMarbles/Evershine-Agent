"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Trash2, Loader2, Heart, ShoppingCart, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import axios from "axios"

// Add the CommissionData interface
interface CommissionData {
  agentId: string
  name: string
  email: string
  commissionRate: number
  categoryCommissions?: Record<string, number>
}

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
  const [actionLoading, setActionLoading] = useState<Record<string, { removing: boolean; addingToCart: boolean }>>({})
  const [cartCount, setCartCount] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  // Add commission data state
  const [commissionData, setCommissionData] = useState<CommissionData | null>(null)
  const [overrideCommissionRate, setOverrideCommissionRate] = useState<number | null>(null)

  // Get API URL from environment or use default
  const getApiUrl = () => {
    return process.env.NEXT_PUBLIC_API_URL || "https://evershinebackend-2.onrender.com"
  }

  // Get token from localStorage
  const getToken = () => {
    try {
      // Try both token storage options
      const token = localStorage.getItem("clientImpersonationToken") || localStorage.getItem("token")
      if (!token) {
        setError("No authentication token found. Please log in again.")
        return null
      }
      return token
    } catch (e) {
      setError("Error accessing authentication. Please refresh the page.")
      return null
    }
  }

  // Add fetchCommissionData function
  const fetchCommissionData = async () => {
    try {
      const token = getToken()
      if (!token) return null

      const apiUrl = getApiUrl()
      const response = await axios.get(`${apiUrl}/api/client/agent-commission`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.data.success && response.data.data) {
        setCommissionData(response.data.data)
        return response.data.data
      }
      return null
    } catch (error) {
      console.error("Error fetching commission data:", error)
      return null
    }
  }

  // Add calculateAdjustedPrice function
  const calculateAdjustedPrice = (item: WishlistItem) => {
    // Always use basePrice (which should be the original price)
    const basePrice = item.basePrice || item.price

    // Get the default commission rate (from agent or category-specific)
    let defaultRate = commissionData?.commissionRate || 0

    // Check for category-specific commission
    if (commissionData?.categoryCommissions && item.category && commissionData.categoryCommissions[item.category]) {
      defaultRate = commissionData.categoryCommissions[item.category]
    }

    // Add the override rate to the default rate if an override is set
    const finalRate = overrideCommissionRate !== null ? defaultRate + overrideCommissionRate : defaultRate

    // Calculate adjusted price based on the original basePrice
    const adjustedPrice = basePrice * (1 + finalRate / 100)
    return Math.round(adjustedPrice * 100) / 100 // Round to 2 decimal places
  }

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

  // Fetch client data to get consultant level
  useEffect(() => {
    const fetchClientData = async () => {
      try {
        const token = getToken()
        if (!token) return

        const apiUrl = getApiUrl()
        const response = await axios.get(`${apiUrl}/api/getClientDetails/${clientId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.data.success && response.data.data) {
          // Set commission rate based on consultant level color
          if (response.data.data.consultantLevel) {
            const consultantLevel = response.data.data.consultantLevel
            console.log("Client consultant level:", consultantLevel)

            // Map color to commission rate
            let commissionRate = null
            switch (consultantLevel) {
              case "red":
                commissionRate = 5
                break
              case "yellow":
                commissionRate = 10
                break
              case "purple":
                commissionRate = 15
                break
              default:
                commissionRate = null
            }

            // Set the override commission rate
            setOverrideCommissionRate(commissionRate)
            console.log(`Setting commission rate to ${commissionRate}% based on consultant level ${consultantLevel}`)
          }
        }
      } catch (error) {
        console.error("Error fetching client data:", error)
      }
    }

    fetchClientData()
  }, [clientId])

  // Fetch wishlist items
  const fetchWishlist = async () => {
    try {
      setLoading(true)

      const token = getToken()
      if (!token) {
        setLoading(false)
        return
      }

      // First fetch commission data
      await fetchCommissionData()

      const apiUrl = getApiUrl()

      const response = await axios.get(`${apiUrl}/api/getUserWishlist`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.data.success) {
        const items = response.data.data.items || []
        setWishlistItems(items)

        // Initialize action loading state for each item
        const initialState: Record<string, { removing: boolean; addingToCart: boolean }> = {}
        const initialQuantities: Record<string, number> = {}

        items.forEach((item: WishlistItem) => {
          const itemId = item.postId || item._id
          initialState[itemId] = { removing: false, addingToCart: false }
          initialQuantities[itemId] = 1000 // Default quantity is now 1000
        })

        setActionLoading(initialState)
        setQuantities(initialQuantities)
      } else {
        setError("Failed to fetch wishlist: " + (response.data.message || "Unknown error"))
      }
    } catch (error: any) {
      if (error.response && error.response.status === 401) {
        setError("Authentication failed. Please log in again.")
      } else {
        setError("Error loading wishlist. Please try again.")
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

      const apiUrl = getApiUrl()

      const response = await axios.get(`${apiUrl}/api/getUserCart`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.data.success && response.data.data && Array.isArray(response.data.data.items)) {
        setCartCount(response.data.data.items.length)
      }
    } catch (error) {
      // Silently fail for cart count
    }
  }

  // Initialize data on component mount
  useEffect(() => {
    fetchWishlist()
    fetchCartCount()
  }, [])

  // Handle quantity change
  const handleQuantityChange = (itemId: string, value: string) => {
    const numValue = Number.parseInt(value)

    if (!isNaN(numValue) && numValue > 0) {
      setQuantities((prev) => ({
        ...prev,
        [itemId]: numValue,
      }))
    }
  }

  // Remove item from wishlist
  const removeFromWishlist = async (productId: string) => {
    try {
      setActionLoading((prev) => ({
        ...prev,
        [productId]: { ...prev[productId], removing: true },
      }))

      const token = getToken()
      if (!token) return

      const apiUrl = getApiUrl()

      const response = await axios.delete(`${apiUrl}/api/deleteUserWishlistItem`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: { productId },
      })

      if (response.data.success) {
        // Update local state
        setWishlistItems((prev) => prev.filter((item) => (item.postId || item._id) !== productId))

        toast({
          title: "Item removed",
          description: "Item has been removed from your wishlist",
        })
      } else {
        toast({
          title: "Failed to remove item",
          description: response.data.message || "Unknown error",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      if (error.response && error.response.status === 401) {
        toast({
          title: "Authentication failed",
          description: "Please log in again to continue.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to remove item from wishlist",
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

      const token = getToken()
      if (!token) return

      const apiUrl = getApiUrl()

      // Get the quantity for this product
      const quantity = quantities[productId] || 1000

      // Find the item to get its data
      const item = wishlistItems.find((item) => (item.postId || item._id) === productId)

      // Calculate adjusted price with commission if item exists
      const adjustedPrice = item ? calculateAdjustedPrice(item) : 0

      // Try with axios - now sending the quantity and adjusted price
      const response = await axios.post(
        `${apiUrl}/api/addToCart`,
        {
          productId,
          quantity, // Send the quantity to the API
          price: adjustedPrice, // Send the adjusted price with commission
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (response.data.success) {
        // Then remove from wishlist
        await axios.delete(`${apiUrl}/api/deleteUserWishlistItem`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: { productId },
        })

        // Update local state
        setWishlistItems((prev) => prev.filter((item) => (item.postId || item._id) !== productId))
        setCartCount((prev) => prev + 1)

        toast({
          title: "Added to cart",
          description: `Item has been added to your cart with quantity: ${quantity}`,
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
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      })
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
            <div className="h-6 w-6 text-red-500 mr-2" />
            <h2 className="text-xl font-semibold text-red-700">Error Loading Wishlist</h2>
          </div>
          <p className="text-red-600 mb-4">{error}</p>
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
              // Calculate the adjusted price with commission
              const adjustedPrice = calculateAdjustedPrice(item)

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
                      <span className="font-semibold">₹{adjustedPrice.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row items-center gap-4 mt-4 md:mt-0">
                    <div className="flex items-center">
                      <Input
                        type="number"
                        min="1"
                        value={quantities[itemId] || 1000}
                        onChange={(e) => handleQuantityChange(itemId, e.target.value)}
                        className="h-9 w-24 text-center"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
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
