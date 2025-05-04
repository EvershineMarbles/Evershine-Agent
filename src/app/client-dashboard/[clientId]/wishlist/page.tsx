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
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [clientData, setClientData] = useState<any>(null)
  const [consultantLevel, setConsultantLevel] = useState<string | null>(null)
  const [commissionRate, setCommissionRate] = useState<number | null>(null)

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

            // Set consultant level and commission rate
            if (data.data.consultantLevel) {
              const level = data.data.consultantLevel
              setConsultantLevel(level)
              console.log("Client consultant level:", level)

              // Map color to commission rate
              let rate = null
              switch (level) {
                case "red":
                  rate = 5
                  break
                case "yellow":
                  rate = 10
                  break
                case "purple":
                  rate = 15
                  break
                default:
                  rate = 5
              }

              setCommissionRate(rate)
              console.log(`Setting commission rate to ${rate}% based on consultant level ${level}`)

              // Store in localStorage for other components
              localStorage.setItem("consultantLevel", level)
            }
          }
        }
      } catch (error) {
        console.error("Error fetching client data:", error)
      }
    }

    fetchClientData()
  }, [clientId])

  // Fetch wishlist items
  const fetchWishlist = useCallback(async () => {
    if (isRefreshing) return // Prevent multiple simultaneous fetches

    try {
      setLoading(true)
      setIsRefreshing(true)
      setError(null)

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
      console.log("Wishlist data:", data)

      if (data.success && data.data && data.data.items) {
        const items = data.data.items || []
        console.log("Wishlist items:", items)

        // Log each item's price for debugging
        if (items.length > 0) {
          console.log("Wishlist items with prices:")
          items.forEach((item: WishlistItem) => {
            console.log(
              `Item ${item.postId}: ${item.name}, Price: ${item.price}, Base Price: ${item.basePrice || "N/A"}`,
            )
          })
        }

        setWishlistItems(items)

        // Initialize quantities state
        const initialQuantities: Record<string, number> = {}
        items.forEach((item: WishlistItem) => {
          initialQuantities[item.postId] = item.quantity || 1
        })
        setQuantities(initialQuantities)
      } else {
        console.log("No wishlist items found or invalid response format")
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
  }, [toast, isRefreshing])

  // Fetch wishlist on component mount
  useEffect(() => {
    fetchWishlist()
  }, [fetchWishlist])

  // Fetch cart count
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

      console.log(`Adding item ${productId} to cart with price ${wishlistItem.price}`)

      const response = await fetch("https://evershinebackend-2.onrender.com/api/addToCart", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          quantity,
          // Pass the price from the wishlist item
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

  // Function to update wishlist prices based on current commission rates
  const updateWishlistPrices = async () => {
    try {
      setIsRefreshing(true)
      const token = localStorage.getItem("clientImpersonationToken")

      if (!token) {
        throw new Error("No authentication token found. Please refresh the page and try again.")
      }

      // Use the current consultant level from state
      const level = consultantLevel || "red"

      // Calculate commission rate based on consultant level
      let rate = 5 // Default to red (5%)
      if (level === "yellow") rate = 10
      else if (level === "purple") rate = 15

      console.log(`Updating wishlist prices with commission rate ${rate}% based on consultant level ${level}`)

      const response = await fetch("https://evershinebackend-2.onrender.com/api/updateWishlistPrices", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          commissionRate: rate,
          clientData: {
            consultantLevel: level,
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Prices Updated",
          description: "Wishlist prices have been updated based on your consultant level",
          variant: "default",
        })

        // Refresh the wishlist to show updated prices
        fetchWishlist()
      } else {
        throw new Error(data.message || "Failed to update prices")
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
      console.error("Error updating wishlist prices:", error)
      toast({
        title: "Error",
        description: errorMessage || "Failed to update wishlist prices. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
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
          <Button onClick={fetchWishlist} variant="outline" className="mt-4" disabled={isRefreshing}>
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
          {/* Display consultant level indicator */}
          {consultantLevel && (
            <div className="flex items-center mr-2">
              <div
                className={`w-4 h-4 rounded-full mr-1 ${
                  consultantLevel === "red"
                    ? "bg-red-500"
                    : consultantLevel === "yellow"
                      ? "bg-yellow-500"
                      : "bg-purple-500"
                }`}
              />
              <span className="text-xs text-gray-600">
                {consultantLevel} level ({commissionRate}% commission)
              </span>
            </div>
          )}

          {/* Refresh Wishlist Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={updateWishlistPrices}
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
            Update Prices & Refresh
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
            <div className="flex items-center">
              {consultantLevel && (
                <span className="text-xs text-muted-foreground mr-2">
                  {commissionRate}% commission ({consultantLevel} level)
                </span>
              )}
              <p className="text-xs text-muted-foreground">Prices include commission</p>
            </div>
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
                      {/* Display the price with 2 decimal places */}
                      <p className="font-semibold">₹{Number(item.price).toFixed(2)}/sqft</p>
                      {item.basePrice && (
                        <p className="text-xs text-muted-foreground">
                          Base price: ₹{Number(item.basePrice).toFixed(2)}/sqft
                        </p>
                      )}
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
