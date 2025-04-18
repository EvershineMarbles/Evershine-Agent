"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, AlertCircle, Heart, ShoppingCart, Trash2, ArrowLeft } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { ErrorBoundary } from "@/components/error-boundary"

interface WishlistItem {
  _id: string
  postId: string
  name: string
  price: number
  image: string[]
  category: string
  description?: string
  quantityAvailable?: number
}

export default function WishlistPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const clientId = params.clientId as string

  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [removing, setRemoving] = useState<Record<string, boolean>>({})
  const [addingToCart, setAddingToCart] = useState<Record<string, boolean>>({})
  const [imageError, setImageError] = useState<Record<string, boolean>>({})
  const [cart, setCart] = useState<string[]>([])

  // Fetch wishlist items
  useEffect(() => {
    const fetchWishlist = async () => {
      setLoading(true)
      setError(null)
      try {
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

        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()

        if (data.success && data.data && Array.isArray(data.data.items)) {
          setWishlistItems(data.data.items)
        } else {
          // Fallback to local storage if API doesn't return expected format
          const savedWishlist = localStorage.getItem("wishlist")
          if (savedWishlist) {
            const wishlistIds = JSON.parse(savedWishlist)
            // Here we would ideally fetch product details for each ID
            // For now, we'll just set the IDs
            setWishlistItems(
              wishlistIds.map((id: string) => ({ postId: id, name: "Product", price: 0, image: [], category: "" })),
            )
          } else {
            setWishlistItems([])
          }
        }
      } catch (err: any) {
        console.error("Error fetching wishlist:", err)
        setError(err.message || "Failed to load wishlist")

        // Fallback to local storage
        const savedWishlist = localStorage.getItem("wishlist")
        if (savedWishlist) {
          try {
            const wishlistIds = JSON.parse(savedWishlist)
            // Here we would ideally fetch product details for each ID
            setWishlistItems(
              wishlistIds.map((id: string) => ({ postId: id, name: "Product", price: 0, image: [], category: "" })),
            )
          } catch (e) {
            console.error("Error parsing local wishlist:", e)
            setWishlistItems([])
          }
        }
      } finally {
        setLoading(false)
      }
    }

    // Also fetch cart to check which items are already in cart
    const fetchCart = async () => {
      try {
        const savedCart = localStorage.getItem("cart")
        if (savedCart) {
          setCart(JSON.parse(savedCart))
        }

        const token = localStorage.getItem("clientImpersonationToken")
        if (token) {
          const response = await fetch("https://evershinebackend-2.onrender.com/api/getUserCart", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          })

          if (response.ok) {
            const data = await response.json()
            if (data.success && data.data && Array.isArray(data.data.items)) {
              setCart(data.data.items.map((item: any) => item.postId))
            }
          }
        }
      } catch (err) {
        console.error("Error fetching cart:", err)
      }
    }

    fetchWishlist()
    fetchCart()
  }, [clientId])

  // Handle removing item from wishlist
  const handleRemoveFromWishlist = async (postId: string) => {
    setRemoving((prev) => ({ ...prev, [postId]: true }))
    try {
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
        body: JSON.stringify({ productId: postId }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success) {
        // Update local state
        setWishlistItems((prev) => prev.filter((item) => item.postId !== postId))

        // Update localStorage
        const savedWishlist = localStorage.getItem("wishlist")
        if (savedWishlist) {
          const wishlistIds = JSON.parse(savedWishlist)
          localStorage.setItem("wishlist", JSON.stringify(wishlistIds.filter((id: string) => id !== postId)))
        }

        toast({
          title: "Item removed",
          description: "Item has been removed from your wishlist",
          variant: "default",
        })
      } else {
        throw new Error(data.message || "Failed to remove from wishlist")
      }
    } catch (err: any) {
      console.error("Error removing from wishlist:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to remove item from wishlist. Please try again.",
        variant: "destructive",
      })
    } finally {
      setRemoving((prev) => ({ ...prev, [postId]: false }))
    }
  }

  // Handle adding item to cart
  const handleAddToCart = async (postId: string, name: string) => {
    if (cart.includes(postId)) {
      toast({
        title: "Already in cart",
        description: "This item is already in your cart",
        variant: "default",
      })
      return
    }

    setAddingToCart((prev) => ({ ...prev, [postId]: true }))
    try {
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
        body: JSON.stringify({ productId: postId }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success) {
        // Update local state
        setCart((prev) => [...prev, postId])

        // Update localStorage
        const savedCart = localStorage.getItem("cart")
        const cartItems = savedCart ? JSON.parse(savedCart) : []
        localStorage.setItem("cart", JSON.stringify([...cartItems, postId]))

        toast({
          title: "Added to cart",
          description: `${name} has been added to your cart`,
          variant: "default",
        })
      } else {
        throw new Error(data.message || "Failed to add to cart")
      }
    } catch (err: any) {
      console.error("Error adding to cart:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to add item to cart. Please try again.",
        variant: "destructive",
      })
    } finally {
      setAddingToCart((prev) => ({ ...prev, [postId]: false }))
    }
  }

  // Handle image loading errors
  const handleImageError = (itemId: string) => {
    setImageError((prev) => ({ ...prev, [itemId]: true }))
  }

  return (
    <ErrorBoundary>
      <div className="p-6 md:p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-4">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back</span>
            </Button>
            <h1 className="text-3xl font-bold">Your Wishlist</h1>
          </div>

          <Link href={`/client-dashboard/${clientId}/cart`} className="relative">
            <Button variant="outline" size="icon" className="rounded-full h-10 w-10">
              <ShoppingCart className="h-5 w-5" />
              <span className="sr-only">View cart</span>
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </Button>
          </Link>
        </div>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4 text-red-800 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <p>{error}</p>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center h-[60vh]">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading your wishlist...</p>
          </div>
        ) : wishlistItems.length === 0 ? (
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
          <>
            <p className="text-sm text-muted-foreground mb-6">
              You have {wishlistItems.length} item{wishlistItems.length !== 1 ? "s" : ""} in your wishlist
            </p>

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
                      onClick={() => handleRemoveFromWishlist(item.postId)}
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
                        {item.quantityAvailable > 0 ? (
                          <span className="text-green-600">In stock: {item.quantityAvailable}</span>
                        ) : (
                          <span className="text-red-500">Out of stock</span>
                        )}
                      </p>
                    )}

                    <button
                      onClick={() => handleAddToCart(item.postId, item.name)}
                      className={`mt-4 w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2
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
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <ShoppingCart className="h-4 w-4" />
                          {cart.includes(item.postId)
                            ? "Added to Cart"
                            : item.quantityAvailable !== undefined && item.quantityAvailable <= 0
                              ? "Out of Stock"
                              : "Add to Cart"}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <Link href={`/client-dashboard/${clientId}/products`} className="text-primary hover:underline">
                Continue Shopping
              </Link>
            </div>
          </>
        )}
      </div>
    </ErrorBoundary>
  )
}
