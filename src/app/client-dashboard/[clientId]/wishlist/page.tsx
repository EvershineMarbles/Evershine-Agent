"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, Heart, ShoppingCart, AlertCircle, ArrowLeft, Trash2 } from "lucide-react"
import Image from "next/image"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ErrorBoundary } from "@/components/error-boundary"

// Define the WishlistItem interface
interface WishlistItem {
  postId: string
  name: string
  price: number
  basePrice?: number
  category: string
  applicationAreas?: string[]
  description: string
  image: string[]
  quantity: number
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

export default function WishlistPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.clientId as string
  const { toast } = useToast()

  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [removingItem, setRemovingItem] = useState<Record<string, boolean>>({})
  const [imageError, setImageError] = useState<Record<string, boolean>>({})
  const [cart, setCart] = useState<string[]>([])
  const [addingToCart, setAddingToCart] = useState<Record<string, boolean>>({})

  // Add commission data state
  const [commissionData, setCommissionData] = useState<CommissionData | null>(null)
  // Add state for commission rate override
  const [overrideCommissionRate, setOverrideCommissionRate] = useState<number | null>(null)
  const [commissionLoading, setCommissionLoading] = useState(false)

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
    (item: WishlistItem) => {
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
    },
    [commissionData, overrideCommissionRate],
  )

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

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(`cart-${clientId}`, JSON.stringify(cart))
    }
  }, [cart, clientId])

  // Fetch client data to get consultant level
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
            // Set commission rate based on consultant level color
            if (data.data.consultantLevel) {
              const consultantLevel = data.data.consultantLevel
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
        }
      } catch (error) {
        console.error("Error fetching client data:", error)
      }
    }

    fetchClientData()
  }, [clientId])

  // Fetch wishlist items
  const fetchWishlistItems = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // First fetch commission data
      await fetchCommissionData()

      const token = localStorage.getItem("clientImpersonationToken")
      if (!token) {
        throw new Error("No authentication token found. Please refresh the token and try again.")
      }

      const response = await fetch("https://evershinebackend-2.onrender.com/api/getUserWishlist", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success && data.data && Array.isArray(data.data.items)) {
        console.log("Wishlist items:", data.data.items)

        // Process the items to ensure they have valid image URLs
        const processedItems = data.data.items.map((item: WishlistItem) => ({
          ...item,
          image:
            Array.isArray(item.image) && item.image.length > 0
              ? item.image.filter((url: string) => typeof url === "string" && url.trim() !== "")
              : ["/placeholder.svg"],
          // Ensure basePrice is set if it doesn't exist
          basePrice: item.basePrice || item.price,
        }))

        setWishlistItems(processedItems)
      } else {
        setWishlistItems([])
      }
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load wishlist items"
      console.error("Error fetching wishlist items:", error)
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast, clientId, fetchCommissionData])

  // Fetch wishlist items on component mount
  useEffect(() => {
    fetchWishlistItems()
  }, [fetchWishlistItems])

  // Handle image loading errors
  const handleImageError = useCallback((productId: string) => {
    setImageError((prev) => ({ ...prev, [productId]: true }))
  }, [])

  // Remove item from wishlist
  const removeFromWishlist = useCallback(
    async (productId: string) => {
      try {
        setRemovingItem((prev) => ({ ...prev, [productId]: true }))

        const token = localStorage.getItem("clientImpersonationToken")
        if (!token) {
          throw new Error("No authentication token found. Please refresh the token and try again.")
        }

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
          // Remove the item from the local state
          setWishlistItems((prev) => prev.filter((item) => item.postId !== productId))

          // Update localStorage
          const savedWishlist = localStorage.getItem(`wishlist-${clientId}`)
          if (savedWishlist) {
            const wishlistIds = JSON.parse(savedWishlist)
            localStorage.setItem(
              `wishlist-${clientId}`,
              JSON.stringify(wishlistIds.filter((id: string) => id !== productId)),
            )
          }

          toast({
            title: "Removed from wishlist",
            description: "Item has been removed from your wishlist",
            variant: "default",
          })
        } else {
          throw new Error(data.message || "Failed to remove from wishlist")
        }
      } catch (error: any) {
        const errorMessage = error instanceof Error ? error.message : "Failed to remove item from wishlist"
        console.error("Error removing from wishlist:", error)
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setRemovingItem((prev) => ({ ...prev, [productId]: false }))
      }
    },
    [toast, clientId],
  )

  // Add to cart function
  const addToCart = useCallback(
    async (item: WishlistItem) => {
      if (cart.includes(item.postId)) {
        toast({
          title: "Already in cart",
          description: "This item is already in your cart",
          variant: "default",
        })
        return
      }

      try {
        setAddingToCart((prev) => ({ ...prev, [item.postId]: true }))

        // Immediately update UI state
        setCart((prev) => [...prev, item.postId])

        // Update localStorage
        const savedCart = localStorage.getItem(`cart-${clientId}`)
        const cartItems = savedCart ? JSON.parse(savedCart) : []
        localStorage.setItem(`cart-${clientId}`, JSON.stringify([...cartItems, item.postId]))

        const token = localStorage.getItem("clientImpersonationToken")
        if (!token) {
          throw new Error("No authentication token found. Please refresh the token and try again.")
        }

        // Calculate the adjusted price with current commission rates
        const adjustedPrice = calculateAdjustedPrice(item)

        const response = await fetch("https://evershinebackend-2.onrender.com/api/addToCart", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productId: item.postId,
            // Use the recalculated price with current commission
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
            description: (
              <div className="flex flex-col space-y-2">
                <p>{item.name} has been added to your cart</p>
                <Button
                  onClick={() => router.push(`/client-dashboard/${clientId}/cart`)}
                  className="bg-[#194a95] hover:bg-[#0f3a7a] text-white"
                  size="sm"
                >
                  View Cart
                </Button>
              </div>
            ),
            variant: "default",
          })
        } else {
          throw new Error(data.message || "Failed to add to cart")
        }
      } catch (error: any) {
        // Revert UI state
        setCart((prev) => prev.filter((id) => id !== item.postId))

        const errorMessage = error instanceof Error ? error.message : "Failed to add item to cart"
        console.error("Error adding to cart:", error)
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setAddingToCart((prev) => ({ ...prev, [item.postId]: false }))
      }
    },
    [cart, toast, clientId, router, calculateAdjustedPrice],
  )

  // Go back to products
  const goBack = () => {
    router.push(`/client-dashboard/${clientId}/products`)
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading wishlist...</p>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="p-6 md:p-8">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2">
            <button
              onClick={goBack}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <h1 className="text-3xl font-bold">My Wishlist</h1>
          </div>

          <Link href={`/client-dashboard/${clientId}/cart`} className="relative">
            <ShoppingCart className="h-6 w-6 text-gray-600" />
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </Link>
        </div>

        {wishlistItems.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <p className="text-xl font-medium mb-4">Your wishlist is empty</p>
            <p className="text-muted-foreground mb-6">Add items to your wishlist to save them for later</p>
            <Button onClick={goBack} className="bg-primary hover:bg-primary/90">
              Browse Products
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlistItems.map((item) => {
              // Calculate the adjusted price with current commission rates
              const adjustedPrice = calculateAdjustedPrice(item)

              return (
                <Card
                  key={item.postId}
                  className="overflow-hidden border border-border hover:border-primary transition-all hover:shadow-md"
                >
                  <div className="p-3">
                    <div className="relative w-full overflow-hidden rounded-xl bg-gray-50 aspect-square">
                      <Image
                        src={imageError[item.postId] ? "/placeholder.svg" : item.image?.[0] || "/placeholder.svg"}
                        alt={item.name}
                        fill
                        unoptimized={true}
                        className="object-cover"
                        onError={() => handleImageError(item.postId)}
                      />
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-lg text-foreground line-clamp-1">{item.name}</h3>

                    {/* Display both stored price and recalculated price if they differ */}
                    <div className="mt-2">
                      <p className="text-lg font-bold">₹{adjustedPrice.toLocaleString()}/sqft</p>
                      {Math.abs(adjustedPrice - item.price) > 0.01 && (
                        <p className="text-sm text-muted-foreground">
                          <span className="line-through">₹{item.price.toLocaleString()}</span>
                          <span className="ml-2 text-green-600">
                            {adjustedPrice > item.price ? "Price updated" : "Price reduced"}
                          </span>
                        </p>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground mt-1">
                      <span className="font-medium">Category:</span> {item.category}
                    </p>

                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={() => addToCart(item)}
                        className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                        disabled={cart.includes(item.postId) || addingToCart[item.postId]}
                      >
                        {addingToCart[item.postId] ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : cart.includes(item.postId) ? (
                          "In Cart"
                        ) : (
                          "Add to Cart"
                        )}
                      </Button>

                      <Button
                        onClick={() => removeFromWishlist(item.postId)}
                        variant="outline"
                        className="p-2"
                        disabled={removingItem[item.postId]}
                        aria-label="Remove from wishlist"
                      >
                        {removingItem[item.postId] ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}
