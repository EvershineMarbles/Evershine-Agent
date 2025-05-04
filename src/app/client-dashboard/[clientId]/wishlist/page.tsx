"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Trash2, Loader2, Heart, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"

interface WishlistItem {
  _id: string
  name: string
  price: number
  image: string[]
  postId: string
  category: string
  quantity: number
  basePrice?: number
}

// Add the CommissionData interface
interface CommissionData {
  agentId: string
  name: string
  email: string
  commissionRate: number
  categoryCommissions?: Record<string, number>
}

export default function WishlistPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const clientId = params.clientId as string

  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<Record<string, { removing: boolean; addingToCart: boolean }>>({})
  const [cartCount, setCartCount] = useState(0)
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [error, setError] = useState<string | null>(null)
  const [commissionData, setCommissionData] = useState<CommissionData | null>(null)
  const [overrideCommissionRate, setOverrideCommissionRate] = useState<number | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Load saved commission rate from localStorage on component mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedRate = localStorage.getItem(`commission-override-${clientId}`)
      if (savedRate) {
        setOverrideCommissionRate(Number(savedRate))
      }
    }
  }, [clientId])

  // Fetch commission data
  const fetchCommissionData = useCallback(async () => {
    try {
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
    }
  }, [])

  // Calculate adjusted price function
  const calculateAdjustedPrice = useCallback(
    (basePrice: number, category: string) => {
      // Get the default commission rate (from agent or category-specific)
      let defaultRate = commissionData?.commissionRate || 10

      // Check for category-specific commission
      if (commissionData?.categoryCommissions && category && commissionData.categoryCommissions[category]) {
        defaultRate = commissionData.categoryCommissions[category]
      }

      // Add the override rate to the default rate if an override is set
      const finalRate = overrideCommissionRate !== null ? defaultRate + overrideCommissionRate : defaultRate

      // Calculate adjusted price based on the original basePrice
      const adjustedPrice = basePrice * (1 + finalRate / 100)
      return Math.round(adjustedPrice * 100) / 100 // Round to 2 decimal places
    },
    [commissionData, overrideCommissionRate],
  )

  // Fetch wishlist items
  const fetchWishlist = useCallback(async () => {
    if (isRefreshing) return // Prevent multiple simultaneous fetches

    try {
      setLoading(true)
      setIsRefreshing(true)
      setError(null)

      // First fetch commission data
      const commissionInfo = await fetchCommissionData()

      // Get the token
      const token = localStorage.getItem("clientImpersonationToken")

      if (!token) {
        throw new Error("No authentication token found. Please refresh the page and try again.")
      }

      console.log("Fetching wishlist with token:", token.substring(0, 15) + "...")

      const response = await fetch("https://evershinebackend-2.onrender.com/api/getUserWishlist", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      // Check for errors
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed. Please refresh the token and try again.")
        } else {
          throw new Error(`API error: ${response.status} ${response.statusText}`)
        }
      }

      const data = await response.json()

      if (data.data) {
        console.log("Wishlist data:", data.data)
        const items = data.data.items || []

        // Fetch original product data to get basePrice
        const productsResponse = await fetch("https://evershinebackend-2.onrender.com/api/getAllProducts", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!productsResponse.ok) {
          throw new Error(`API error: ${productsResponse.status} ${productsResponse.statusText}`)
        }

        const productsData = await productsResponse.json()
        const products = productsData.success && Array.isArray(productsData.data) ? productsData.data : []

        // Map products to wishlist items to ensure we have the latest prices
        const updatedItems = items.map((item: WishlistItem) => {
          const product = products.find((p: any) => p.postId === item.postId)
          if (product) {
            // Calculate the adjusted price using the current commission settings
            const basePrice = product.basePrice || product.price
            const adjustedPrice = calculateAdjustedPrice(basePrice, product.category)

            return {
              ...item,
              price: adjustedPrice, // Use the freshly calculated adjusted price
              basePrice: basePrice, // Store the base price for future calculations
            }
          }
          return item
        })

        setWishlistItems(updatedItems)

        // Initialize quantities state
        const initialQuantities: Record<string, number> = {}
        updatedItems.forEach((item: WishlistItem) => {
          initialQuantities[item.postId] = item.quantity || 1
        })
        setQuantities(initialQuantities)
      } else {
        setWishlistItems([])
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
      console.error("Error fetching wishlist:", error)
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage || "Failed to load your wishlist. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [toast, fetchCommissionData, calculateAdjustedPrice, isRefreshing])

  // Fetch wishlist on component mount - ONLY ONCE
  useEffect(() => {
    fetchWishlist()
    // Do not include fetchWishlist in the dependency array to prevent constant refreshing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch cart count - ONLY ONCE
  useEffect(() => {
    const fetchCartCount = async () => {
      try {
        const token = localStorage.getItem("clientImpersonationToken")
        if (!token) return

        const response = await fetch("https://evershinebackend-2.onrender.com/api/getUserCart", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data && Array.isArray(data.data.items)) {
            setCartCount(data.data.items.length)
          }
        }
      } catch (error) {
        console.error("Error fetching cart count:", error)
      }
    }

    fetchCartCount()
  }, [])

  // Initialize action loading state for each item
  useEffect(() => {
    const initialState: Record<string, { removing: boolean; addingToCart: boolean }> = {}
    wishlistItems.forEach((item) => {
      initialState[item.postId] = { removing: false, addingToCart: false }
    })
    setActionLoading(initialState)
  }, [wishlistItems])

  // Handle quantity change
  const handleQuantityChange = (postId: string, value: string) => {
    const numValue = Number.parseInt(value, 10)
    if (!isNaN(numValue) && numValue > 0) {
      setQuantities((prev) => ({
        ...prev,
        [postId]: numValue,
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

      // Get the token
      const token = localStorage.getItem("clientImpersonationToken")

      if (!token) {
        throw new Error("No authentication token found. Please refresh the page and try again.")
      }

      console.log("Removing item from wishlist with token:", token.substring(0, 15) + "...")

      const response = await fetch("https://evershinebackend-2.onrender.com/api/deleteUserWishlistItem", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId }),
      })

      // Check for errors
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed. Please refresh the token and try again.")
        } else {
          throw new Error(`API error: ${response.status} ${response.statusText}`)
        }
      }

      const data = await response.json()

      if (data.success) {
        setWishlistItems((prev) => prev.filter((item) => item.postId !== productId))

        toast({
          title: "Item removed",
          description: "Item has been removed from your wishlist",
          variant: "default",
        })
      } else {
        throw new Error(data.message || "Failed to remove item")
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
      console.error("Error removing item from wishlist:", error)
      toast({
        title: "Error",
        description: errorMessage || "Failed to remove item from wishlist. Please try again.",
        variant: "destructive",
      })
    } finally {
      setActionLoading((prev) => ({
        ...prev,
        [productId]: { ...prev[productId], removing: false },
      }))
    }
  }

  // Add item to cart and remove from wishlist
  const addToCart = async (productId: string) => {
    try {
      setActionLoading((prev) => ({
        ...prev,
        [productId]: { ...prev[productId], addingToCart: true },
      }))

      // Get the token
      const token = localStorage.getItem("clientImpersonationToken")

      if (!token) {
        throw new Error("No authentication token found. Please refresh the page and try again.")
      }

      // Get the current quantity for this item
      const quantity = quantities[productId] || 1

      // Get the item from wishlist to use its price
      const wishlistItem = wishlistItems.find((item) => item.postId === productId)

      if (!wishlistItem) {
        throw new Error("Item not found in wishlist")
      }

      console.log("Adding item to cart with token:", token.substring(0, 15) + "...")

      const response = await fetch("https://evershinebackend-2.onrender.com/api/addToCart", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          quantity,
          // Pass the adjusted price that was saved in the wishlist
          price: wishlistItem.price,
        }),
      })

      // Check for errors
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed. Please refresh the token and try again.")
        } else {
          throw new Error(`API error: ${response.status} ${response.statusText}`)
        }
      }

      const data = await response.json()

      if (data.success) {
        // Increment cart count
        setCartCount((prev) => prev + 1)

        // Now remove from wishlist
        await removeFromWishlist(productId)

        toast({
          title: "Added to cart",
          description: "Item has been added to your cart and removed from wishlist",
          variant: "default",
        })
      } else {
        throw new Error(data.message || "Failed to add item to cart")
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
      console.error("Error adding item to cart:", error)
      toast({
        title: "Error",
        description: errorMessage || "Failed to add item to cart. Please try again.",
        variant: "destructive",
      })
    } finally {
      setActionLoading((prev) => ({
        ...prev,
        [productId]: { ...prev[productId], addingToCart: false },
      }))
    }
  }

  // Refresh wishlist - ONLY when manually triggered
  const refreshWishlist = () => {
    if (!isRefreshing) {
      fetchWishlist()
      toast({
        title: "Refreshing wishlist",
        description: "Getting the latest wishlist data with updated prices",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading your wishlist...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 md:p-8">
        <div className="flex items-center mb-8">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">Your Wishlist</h1>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <p className="font-medium">Error loading wishlist</p>
          <p className="mt-1">{error}</p>
          <Button onClick={refreshWishlist} variant="outline" className="mt-4" disabled={isRefreshing}>
            {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Try Again
          </Button>
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
          {/* Refresh Wishlist Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={refreshWishlist}
            className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 border-blue-200"
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                <path d="M16 21h5v-5" />
              </svg>
            )}
            Refresh Prices
          </Button>

          {/* Cart icon */}
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
          <div className="p-4 bg-muted/20 border-b border-border flex justify-between items-center">
            <h2 className="font-semibold">Wishlist Items ({wishlistItems.length})</h2>
            <p className="text-xs text-muted-foreground">Prices include commission</p>
          </div>
          <div className="divide-y divide-border">
            {wishlistItems.map((item) => (
              <div key={item.postId} className="p-4 flex flex-col md:flex-row md:items-center">
                <div className="relative h-20 w-20 rounded-md overflow-hidden flex-shrink-0">
                  <Image
                    src={item.image && item.image.length > 0 ? item.image[0] : "/placeholder.svg?height=80&width=80"}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="md:ml-4 flex-grow mt-3 md:mt-0">
                  <h3 className="font-medium">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">{item.category}</p>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mt-2 gap-3">
                    <div>
                      <p className="font-semibold">₹{item.price?.toLocaleString()}/sqft</p>
                      <p className="text-xs text-muted-foreground">Price includes commission</p>
                    </div>

                    <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
                      <div className="flex items-center">
                        <label htmlFor={`quantity-${item.postId}`} className="text-sm mr-2">
                          Quantity:
                        </label>
                        <Input
                          id={`quantity-${item.postId}`}
                          type="number"
                          min="1"
                          value={quantities[item.postId] || 1}
                          onChange={(e) => handleQuantityChange(item.postId, e.target.value)}
                          className="w-20 h-8"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addToCart(item.postId)}
                          disabled={actionLoading[item.postId]?.addingToCart}
                          className="flex items-center"
                        >
                          {actionLoading[item.postId]?.addingToCart ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <ShoppingCart className="h-4 w-4 mr-2" />
                          )}
                          Add to Cart
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFromWishlist(item.postId)}
                          disabled={actionLoading[item.postId]?.removing}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          {actionLoading[item.postId]?.removing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
