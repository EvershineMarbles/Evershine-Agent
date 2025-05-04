"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Loader2, ShoppingCart, Trash2, ArrowLeft, AlertCircle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { ErrorBoundary } from "@/components/error-boundary"

// Define the WishlistItem interface
interface WishlistItem {
  postId: string
  name: string
  price: number
  basePrice?: number // Add this field to recognize the original price
  category: string
  applicationAreas?: string[]
  description: string
  image: string[]
  quantity: number
  quantityAvailable?: number
}

export default function WishlistPage() {
  // Use the useParams hook to get the clientId
  const params = useParams()
  const router = useRouter()
  const clientId = params.clientId as string

  const { toast } = useToast()
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [imageError, setImageError] = useState<Record<string, boolean>>({})
  const [removingItem, setRemovingItem] = useState<Record<string, boolean>>({})
  const [addingToCart, setAddingToCart] = useState<Record<string, boolean>>({})
  const [clientData, setClientData] = useState<any>(null)
  const [consultantLevel, setConsultantLevel] = useState<string | null>(null)
  const [cartCount, setCartCount] = useState(0)
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [isRefreshing, setIsRefreshing] = useState(false)
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
            setConsultantLevel(data.data.consultantLevel || null)
            console.log("Client data loaded:", data.data)
            console.log("Consultant level:", data.data.consultantLevel || "none")

            // Set consultant level and commission rate
            if (data.data.consultantLevel) {
              const level = data.data.consultantLevel
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
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem("clientImpersonationToken")
      console.log(`Fetching wishlist with token: ${token ? token.substring(0, 15) + "..." : "no token"}`)

      if (!token) {
        throw new Error("No authentication token found. Please log in again.")
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
      console.log("Wishlist API response:", data)

      if (data.success && data.data && Array.isArray(data.data.items)) {
        // Log each item's price for debugging
        data.data.items.forEach((item: WishlistItem) => {
          console.log(
            `Wishlist item ${item.postId}: ${item.name}, Price: ${item.price}, Base Price: ${item.basePrice || "N/A"}`,
          )
        })

        setWishlistItems(data.data.items)
      } else {
        console.log("No wishlist items found or invalid response format")
        setWishlistItems([])
      }
    } catch (error: any) {
      console.error("Error fetching wishlist:", error)
      setError(error.message || "Failed to load wishlist items")
    } finally {
      setLoading(false)
    }
  }, [])

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

  // Handle image loading errors
  const handleImageError = (postId: string) => {
    setImageError((prev) => ({ ...prev, [postId]: true }))
  }

  // Remove item from wishlist
  const removeFromWishlist = async (postId: string) => {
    try {
      setRemovingItem((prev) => ({ ...prev, [postId]: true }))

      const token = localStorage.getItem("clientImpersonationToken")
      if (!token) {
        throw new Error("No authentication token found. Please log in again.")
      }

      const response = await fetch("https://evershinebackend-2.onrender.com/api/deleteUserWishlistItem", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId: postId }),
      })

      if (!response.ok) {
        throw new Error(`Failed to remove item: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        // Remove item from local state
        setWishlistItems((prev) => prev.filter((item) => item.postId !== postId))

        toast({
          title: "Item removed",
          description: "Item has been removed from your wishlist",
          variant: "default",
        })
      } else {
        throw new Error(data.message || "Failed to remove item from wishlist")
      }
    } catch (error: any) {
      console.error("Error removing item from wishlist:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to remove item from wishlist",
        variant: "destructive",
      })
    } finally {
      setRemovingItem((prev) => ({ ...prev, [postId]: false }))
    }
  }

  // Add item to cart
  const addToCart = async (item: WishlistItem) => {
    try {
      setAddingToCart((prev) => ({ ...prev, [item.postId]: true }))

      const token = localStorage.getItem("clientImpersonationToken")
      if (!token) {
        throw new Error("No authentication token found. Please log in again.")
      }

      // Use the price from the wishlist item
      const itemPrice = item.price
      console.log(`Adding to cart: Product ${item.postId} with price ${itemPrice}`)

      const response = await fetch("https://evershinebackend-2.onrender.com/api/addToCart", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: item.postId,
          price: itemPrice, // Use the price from the wishlist item
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to add item to cart: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        // Update localStorage cart
        const savedCart = localStorage.getItem(`cart-${clientId}`)
        const cartItems = savedCart ? JSON.parse(savedCart) : []
        localStorage.setItem(`cart-${clientId}`, JSON.stringify([...cartItems, item.postId]))

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
        throw new Error(data.message || "Failed to add item to cart")
      }
    } catch (error: any) {
      console.error("Error adding item to cart:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to add item to cart",
        variant: "destructive",
      })
    } finally {
      setAddingToCart((prev) => ({ ...prev, [item.postId]: false }))
    }
  }

  // Clear wishlist
  const clearWishlist = async () => {
    try {
      setLoading(true)

      const token = localStorage.getItem("clientImpersonationToken")
      if (!token) {
        throw new Error("No authentication token found. Please log in again.")
      }

      const response = await fetch("https://evershinebackend-2.onrender.com/api/clearUserWishlist", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to clear wishlist: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setWishlistItems([])
        toast({
          title: "Wishlist cleared",
          description: "All items have been removed from your wishlist",
          variant: "default",
        })
      } else {
        throw new Error(data.message || "Failed to clear wishlist")
      }
    } catch (error: any) {
      console.error("Error clearing wishlist:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to clear wishlist",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
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
        <div className="flex items-center gap-2 mb-6">
          <Link
            href={`/client-dashboard/${clientId}/products-page`}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-3xl font-bold">My Wishlist</h1>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {wishlistItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl font-medium mb-4">Your wishlist is empty</p>
            <p className="text-muted-foreground mb-6">Add items to your wishlist to save them for later</p>
            <Button
              onClick={() => router.push(`/client-dashboard/${clientId}/products-page`)}
              className="bg-[#194a95] hover:bg-[#0f3a7a] text-white"
            >
              Browse Products
            </Button>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <p className="text-muted-foreground">{wishlistItems.length} items in your wishlist</p>
              <Button variant="outline" onClick={clearWishlist} className="text-red-500 hover:text-red-600">
                Clear Wishlist
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlistItems.map((item) => (
                <div
                  key={item.postId}
                  className="bg-card rounded-lg overflow-hidden border border-border hover:border-primary transition-all hover:shadow-md"
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

                    {/* Price display with both adjusted price and base price */}
                    <div className="mt-2">
                      <p className="text-lg font-bold">₹{Number(item.price).toFixed(2)}/sqft</p>
                      {item.basePrice && (
                        <p className="text-sm text-muted-foreground">Base: ₹{Number(item.basePrice).toFixed(2)}/sqft</p>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground mt-1">
                      <span className="font-medium">Category:</span> {item.category}
                    </p>

                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={() => addToCart(item)}
                        className="flex-1 bg-[#194a95] hover:bg-[#0f3a7a] text-white"
                        disabled={addingToCart[item.postId]}
                      >
                        {addingToCart[item.postId] ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <ShoppingCart className="h-4 w-4 mr-1" />
                        )}
                        Add to Cart
                      </Button>
                      <Button
                        onClick={() => removeFromWishlist(item.postId)}
                        variant="outline"
                        className="p-2"
                        disabled={removingItem[item.postId]}
                      >
                        {removingItem[item.postId] ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-red-500" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </ErrorBoundary>
  )
}
