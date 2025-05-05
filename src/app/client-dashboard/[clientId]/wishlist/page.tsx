"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { ArrowLeft, Trash2, Loader2, Heart, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

interface WishlistItem {
  _id: string
  name: string
  price: number
  image: string[]
  postId: string
  category: string
  basePrice?: number
}

export default function WishlistPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<Record<string, boolean>>({})
  const [addingToCart, setAddingToCart] = useState<Record<string, boolean>>({})

  // Fetch wishlist items from server
  useEffect(() => {
    fetchWishlist()
  }, [])

  const fetchWishlist = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")

      if (!token) {
        throw new Error("No authentication token found")
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/getUserWishlist`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch wishlist")
      }

      const data = await response.json()

      if (data.data && data.data.items) {
        const validItems = data.data.items.filter(
          (item: WishlistItem) => item.postId && typeof item.postId === "string",
        )
        setWishlistItems(validItems)
      } else {
        setWishlistItems([])
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load your wishlist. Please try again.",
        variant: "destructive",
      })
      setWishlistItems([])
    } finally {
      setLoading(false)
    }
  }

  // Remove item from wishlist
  const removeFromWishlist = async (productId: string) => {
    try {
      setRemoving((prev) => ({ ...prev, [productId]: true }))
      const token = localStorage.getItem("token")

      if (!token) {
        throw new Error("No authentication token found")
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/deleteUserWishlistItem`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId }),
      })

      if (!response.ok) {
        throw new Error("Failed to remove item")
      }

      const data = await response.json()

      if (data.success) {
        setWishlistItems((prev) => prev.filter((item) => item.postId !== productId))
        toast({
          title: "Item removed",
          description: "Item has been removed from your wishlist",
        })
      } else {
        throw new Error("Failed to remove item")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to remove item from wishlist. Please try again.",
        variant: "destructive",
      })
    } finally {
      setRemoving((prev) => ({ ...prev, [productId]: false }))
    }
  }

  // Add item to cart
  const addToCart = async (productId: string) => {
    try {
      setAddingToCart((prev) => ({ ...prev, [productId]: true }))
      const token = localStorage.getItem("token")

      if (!token) {
        throw new Error("No authentication token found")
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/addToCart`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId }),
      })

      if (!response.ok) {
        throw new Error("Failed to add item to cart")
      }

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Added to cart",
          description: "Item has been added to your cart",
        })
      } else {
        throw new Error("Failed to add item to cart")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      })
    } finally {
      setAddingToCart((prev) => ({ ...prev, [productId]: false }))
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-8">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-4">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">Your Wishlist</h1>
      </div>

      {wishlistItems.length === 0 ? (
        <div className="text-center py-16 bg-muted/20 rounded-lg shadow-sm">
          <Heart className="h-20 w-20 mx-auto text-muted-foreground mb-6" />
          <p className="text-2xl font-medium mb-4">Your wishlist is empty</p>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Save items you love to your wishlist and revisit them anytime.
          </p>
          <Button
            onClick={() => router.push("/products")}
            className="bg-primary hover:bg-primary/90 px-8 py-6 h-auto text-lg"
          >
            Browse Products
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlistItems.map((item) => (
            <div key={item.postId} className="bg-white rounded-lg border shadow-sm overflow-hidden">
              <div className="relative h-48 w-full overflow-hidden">
                <Image
                  src={item.image && item.image.length > 0 ? item.image[0] : "/placeholder.svg?height=192&width=384"}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="font-medium text-lg line-clamp-1">{item.name}</h3>
                <p className="text-sm text-muted-foreground mb-2">{item.category}</p>

                {item.basePrice && item.basePrice !== item.price ? (
                  <div className="mb-3">
                    <div className="flex items-center gap-2">
                      <span className="line-through text-muted-foreground">₹{item.basePrice.toLocaleString()}</span>
                      <span className="font-semibold text-lg text-primary">₹{item.price.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-green-600">
                      {Math.round((item.price / item.basePrice - 1) * 100)}% commission
                    </p>
                  </div>
                ) : (
                  <p className="font-semibold text-lg text-primary mb-3">₹{item.price.toLocaleString()}</p>
                )}

                <div className="flex gap-2 mt-2">
                  <Button
                    className="flex-1 bg-primary hover:bg-primary/90"
                    onClick={() => addToCart(item.postId)}
                    disabled={addingToCart[item.postId]}
                  >
                    {addingToCart[item.postId] ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <ShoppingCart className="h-4 w-4 mr-2" />
                    )}
                    Add to Cart
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeFromWishlist(item.postId)}
                    disabled={removing[item.postId]}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    {removing[item.postId] ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { ArrowLeft, Trash2, Loader2, Heart, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

interface WishlistItem {
  _id: string
  name: string
  price: number
  image: string[]
  postId: string
  category: string
  basePrice?: number
}

export default function WishlistPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<Record<string, boolean>>({})
  const [addingToCart, setAddingToCart] = useState<Record<string, boolean>>({})

  // Fetch wishlist items from server
  useEffect(() => {
    fetchWishlist()
  }, [])

  const fetchWishlist = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")

      if (!token) {
        throw new Error("No authentication token found")
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/getUserWishlist`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch wishlist")
      }

      const data = await response.json()

      if (data.data && data.data.items) {
        const validItems = data.data.items.filter(
          (item: WishlistItem) => item.postId && typeof item.postId === "string",
        )
        setWishlistItems(validItems)
      } else {
        setWishlistItems([])
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load your wishlist. Please try again.",
        variant: "destructive",
      })
      setWishlistItems([])
    } finally {
      setLoading(false)
    }
  }

  // Remove item from wishlist
  const removeFromWishlist = async (productId: string) => {
    try {
      setRemoving((prev) => ({ ...prev, [productId]: true }))
      const token = localStorage.getItem("token")

      if (!token) {
        throw new Error("No authentication token found")
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/deleteUserWishlistItem`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId }),
      })

      if (!response.ok) {
        throw new Error("Failed to remove item")
      }

      const data = await response.json()

      if (data.success) {
        setWishlistItems((prev) => prev.filter((item) => item.postId !== productId))
        toast({
          title: "Item removed",
          description: "Item has been removed from your wishlist",
        })
      } else {
        throw new Error("Failed to remove item")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to remove item from wishlist. Please try again.",
        variant: "destructive",
      })
    } finally {
      setRemoving((prev) => ({ ...prev, [productId]: false }))
    }
  }

  // Add item to cart
  const addToCart = async (productId: string) => {
    try {
      setAddingToCart((prev) => ({ ...prev, [productId]: true }))
      const token = localStorage.getItem("token")

      if (!token) {
        throw new Error("No authentication token found")
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/addToCart`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId }),
      })

      if (!response.ok) {
        throw new Error("Failed to add item to cart")
      }

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Added to cart",
          description: "Item has been added to your cart",
        })
      } else {
        throw new Error("Failed to add item to cart")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      })
    } finally {
      setAddingToCart((prev) => ({ ...prev, [productId]: false }))
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-8">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-4">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">Your Wishlist</h1>
      </div>

      {wishlistItems.length === 0 ? (
        <div className="text-center py-16 bg-muted/20 rounded-lg shadow-sm">
          <Heart className="h-20 w-20 mx-auto text-muted-foreground mb-6" />
          <p className="text-2xl font-medium mb-4">Your wishlist is empty</p>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Save items you love to your wishlist and revisit them anytime.
          </p>
          <Button
            onClick={() => router.push("/products")}
            className="bg-primary hover:bg-primary/90 px-8 py-6 h-auto text-lg"
          >
            Browse Products
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlistItems.map((item) => (
            <div key={item.postId} className="bg-white rounded-lg border shadow-sm overflow-hidden">
              <div className="relative h-48 w-full overflow-hidden">
                <Image
                  src={item.image && item.image.length > 0 ? item.image[0] : "/placeholder.svg?height=192&width=384"}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="font-medium text-lg line-clamp-1">{item.name}</h3>
                <p className="text-sm text-muted-foreground mb-2">{item.category}</p>

                {item.basePrice && item.basePrice !== item.price ? (
                  <div className="mb-3">
                    <div className="flex items-center gap-2">
                      <span className="line-through text-muted-foreground">₹{item.basePrice.toLocaleString()}</span>
                      <span className="font-semibold text-lg text-primary">₹{item.price.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-green-600">
                      {Math.round((item.price / item.basePrice - 1) * 100)}% commission
                    </p>
                  </div>
                ) : (
                  <p className="font-semibold text-lg text-primary mb-3">₹{item.price.toLocaleString()}</p>
                )}

                <div className="flex gap-2 mt-2">
                  <Button
                    className="flex-1 bg-primary hover:bg-primary/90"
                    onClick={() => addToCart(item.postId)}
                    disabled={addingToCart[item.postId]}
                  >
                    {addingToCart[item.postId] ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <ShoppingCart className="h-4 w-4 mr-2" />
                    )}
                    Add to Cart
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeFromWishlist(item.postId)}
                    disabled={removing[item.postId]}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    {removing[item.postId] ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
