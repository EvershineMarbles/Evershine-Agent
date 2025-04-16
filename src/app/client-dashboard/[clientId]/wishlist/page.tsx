"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Trash2, Loader2, Heart, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface WishlistItem {
  _id: string
  name: string
  price: number
  image: string[]
  postId: string
  category: string
  quantity: number
  description?: string
  applicationAreas?: string[]
  quantityAvailable?: number
}

export default function WishlistPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const clientId = params.clientId as string

  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<Record<string, boolean>>({})
  const [addingToCart, setAddingToCart] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<string | null>(null)
  const [imageError, setImageError] = useState<Record<string, boolean>>({})
  const [cart, setCart] = useState<string[]>([])

  // Load cart from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedCart = localStorage.getItem("cart")
        if (savedCart) {
          setCart(JSON.parse(savedCart))
        }
      } catch (e) {
        console.error("Error loading cart from localStorage:", e)
      }
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("cart", JSON.stringify(cart))
    }
  }, [cart])

  // Fetch wishlist items
  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get the token
        const token = localStorage.getItem("clientImpersonationToken")

        if (!token) {
          throw new Error("No authentication token found. Please refresh the page and try again.")
        }

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

        if (data.data && data.data.items) {
          // Process the image URLs to ensure they're valid
          const processedItems = data.data.items.map((item: WishlistItem) => ({
            ...item,
            image:
              Array.isArray(item.image) && item.image.length > 0
                ? item.image.filter((url: string) => typeof url === "string" && url.trim() !== "")
                : ["/placeholder.svg?height=300&width=300"],
          }))

          setWishlistItems(processedItems)
        } else {
          setWishlistItems([])
        }
      } catch (error: any) {
        console.error("Error fetching wishlist:", error)
        setError(error.message || "Failed to load your wishlist. Please try again.")
        toast({
          title: "Error",
          description: error.message || "Failed to load your wishlist. Please try again.",
          variant: "destructive",
        })
        setWishlistItems([])
      } finally {
        setLoading(false)
      }
    }

    fetchWishlist()
  }, [toast])

  // Remove item from wishlist
  const removeFromWishlist = async (productId: string) => {
    try {
      setRemoving((prev) => ({ ...prev, [productId]: true }))

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

        // Update localStorage wishlist
        if (typeof window !== "undefined") {
          const savedWishlist = localStorage.getItem("wishlist")
          if (savedWishlist) {
            const wishlistArray = JSON.parse(savedWishlist)
            localStorage.setItem("wishlist", JSON.stringify(wishlistArray.filter((id: string) => id !== productId)))
          }
        }

        toast({
          title: "Item removed",
          description: "Item has been removed from your wishlist",
          variant: "default",
        })
      } else {
        throw new Error(data.message || "Failed to remove item")
      }
    } catch (error: any) {
      console.error("Error removing item from wishlist:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to remove item from wishlist. Please try again.",
        variant: "destructive",
      })
    } finally {
      setRemoving((prev) => ({ ...prev, [productId]: false }))
    }
  }

  // Add to cart function
  const addToCart = async (productId: string, productName: string) => {
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

      // Get the token
      const token = localStorage.getItem("clientImpersonationToken")

      if (!token) {
        throw new Error("No authentication token found. Please refresh the page and try again.")
      }

      const response = await fetch("https://evershinebackend-2.onrender.com/api/addToCart", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId }),
      })

      // Check for errors
      if (!response.ok) {
        let errorMessage = `API error: ${response.status} ${response.statusText}`

        try {
          const errorText = await response.text()

          // Try to parse as JSON if possible
          try {
            const errorJson = JSON.parse(errorText)
            if (errorJson.message) {
              errorMessage = errorJson.message
            }
          } catch (e) {
            // If not JSON, use the text as is
            if (errorText) {
              errorMessage = errorText
            }
          }
        } catch (e) {
          console.error("Could not read error response:", e)
        }

        if (response.status === 401) {
          errorMessage = "Authentication failed. Please refresh the token and try again."
        }

        throw new Error(errorMessage)
      }

      const data = await response.json()

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

  // Handle image loading errors
  const handleImageError = useCallback((itemId: string) => {
    setImageError((prev) => ({ ...prev, [itemId]: true }))
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading your wishlist...</p>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center mb-8">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-4">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">Your Wishlist</h1>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {wishlistItems.length === 0 ? (
        <div className="text-center py-12 bg-muted/20 rounded-lg">
          <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-xl font-medium mb-4">Your wishlist is empty</p>
          <p className="text-muted-foreground mb-6">Save items you like to your wishlist</p>
          <Button
            onClick={() => router.push(`/client-dashboard/${clientId}/products`)}
            className="bg-primary hover:bg-primary/90"
          >
            Browse Products
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlistItems.map((item) => (
            <div
              key={item._id || item.postId}
              className="group relative bg-card rounded-lg overflow-hidden border border-border hover:border-primary transition-all hover:shadow-md"
            >
              <div className="relative aspect-square">
                <Image
                  src={
                    imageError[item._id]
                      ? "/placeholder.svg?height=300&width=300"
                      : item.image && item.image.length > 0 && item.image[0]
                        ? item.image[0]
                        : "/placeholder.svg?height=300&width=300"
                  }
                  alt={item.name}
                  fill
                  className="object-cover transition-transform group-hover:scale-105 duration-300"
                  onError={() => handleImageError(item._id)}
                  unoptimized={true}
                />

                {/* Remove button overlay */}
                <button
                  onClick={() => removeFromWishlist(item.postId)}
                  disabled={removing[item.postId]}
                  className="absolute top-2 right-2 p-2 rounded-full bg-white/80 hover:bg-white transition-colors z-10 text-red-500 hover:text-red-700"
                  aria-label="Remove from wishlist"
                  type="button"
                >
                  {removing[item.postId] ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Trash2 className="h-5 w-5" />
                  )}
                </button>
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-lg text-foreground line-clamp-1">{item.name}</h3>
                <p className="text-lg font-bold mt-2">₹{item.price.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground mt-1">{item.category}</p>

                {item.quantityAvailable !== undefined && (
                  <p className="text-sm mt-1">
                    {item.quantityAvailable > 0 ? `In stock: ${item.quantityAvailable}` : "Out of stock"}
                  </p>
                )}

                <button
                  onClick={() => addToCart(item.postId, item.name)}
                  className={`mt-4 w-full py-2 rounded-lg text-sm font-medium
                            ${
                              cart.includes(item.postId)
                                ? "bg-muted text-muted-foreground"
                                : "bg-primary hover:bg-primary/90 text-primary-foreground"
                            } 
                            transition-colors`}
                  disabled={
                    cart.includes(item.postId) ||
                    addingToCart[item.postId] ||
                    (item.quantityAvailable !== undefined && item.quantityAvailable <= 0)
                  }
                  type="button"
                >
                  {addingToCart[item.postId] ? (
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  ) : cart.includes(item.postId) ? (
                    "Added to Cart"
                  ) : item.quantityAvailable !== undefined && item.quantityAvailable <= 0 ? (
                    "Out of Stock"
                  ) : (
                    "Add to Cart"
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 text-center">
        <Link href={`/client-dashboard/${clientId}/products`} className="text-primary hover:underline">
          Continue Shopping
        </Link>
      </div>
    </div>
  )
}
