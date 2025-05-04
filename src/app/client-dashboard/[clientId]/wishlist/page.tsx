"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Trash2, Loader2, Heart, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface WishlistItem {
  _id: string
  name: string
  price: number
  image: string[]
  postId: string
  category: string
  quantity: number
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

  // Fetch wishlist items
  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        setLoading(true)
        setError(null)

        // For demo purposes, we'll create some mock data
        // In a real app, you would fetch this from an API
        const mockWishlistItems: WishlistItem[] = [
          {
            _id: "1",
            name: "Marble Countertop",
            price: 12500,
            image: ["/placeholder.svg?key=eb2mh"],
            postId: "1",
            category: "Kitchen",
            quantity: 1,
          },
          {
            _id: "2",
            name: "Granite Flooring",
            price: 8900,
            image: ["/placeholder.svg?key=092h1"],
            postId: "2",
            category: "Flooring",
            quantity: 1,
          },
          {
            _id: "3",
            name: "Quartz Backsplash",
            price: 7500,
            image: ["/placeholder.svg?key=irrkc"],
            postId: "3",
            category: "Kitchen",
            quantity: 1,
          },
        ]

        // Get saved wishlist from localStorage
        if (typeof window !== "undefined") {
          const savedWishlist = localStorage.getItem("wishlist")
          if (savedWishlist) {
            const wishlistIds = JSON.parse(savedWishlist)
            // Filter mock items to only include those in the wishlist
            setWishlistItems(mockWishlistItems.filter((item) => wishlistIds.includes(item.postId)))
          } else {
            setWishlistItems(mockWishlistItems)
          }
        } else {
          setWishlistItems(mockWishlistItems)
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

      // In a real app, you would make an API call here
      // For demo purposes, we'll just update the local state

      // Update localStorage wishlist
      if (typeof window !== "undefined") {
        const savedWishlist = localStorage.getItem("wishlist")
        if (savedWishlist) {
          const wishlistArray = JSON.parse(savedWishlist)
          localStorage.setItem("wishlist", JSON.stringify(wishlistArray.filter((id: string) => id !== productId)))
        }
      }

      // Update state
      setWishlistItems((prev) => prev.filter((item) => item.postId !== productId))

      toast({
        title: "Item removed",
        description: "Item has been removed from your wishlist",
        variant: "default",
      })
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
      console.error("Error removing item from wishlist:", error)
      toast({
        title: "Error",
        description: errorMessage || "Failed to remove item from wishlist. Please try again.",
        variant: "destructive",
      })
    } finally {
      setRemoving((prev) => ({ ...prev, [productId]: false }))
    }
  }

  // Add to cart
  const addToCart = async (productId: string, productName: string) => {
    try {
      setAddingToCart((prev) => ({ ...prev, [productId]: true }))

      // Check if item is already in cart
      const savedCart = localStorage.getItem("cart")
      const cartArray = savedCart ? JSON.parse(savedCart) : []

      if (cartArray.includes(productId)) {
        toast({
          title: "Already in cart",
          description: "This item is already in your cart",
          variant: "default",
        })
        return
      }

      // In a real app, you would make an API call here
      // For demo purposes, we'll just update localStorage

      // Update localStorage cart
      cartArray.push(productId)
      localStorage.setItem("cart", JSON.stringify(cartArray))

      toast({
        title: "Added to cart",
        description: `${productName} has been added to your cart`,
        variant: "default",
      })
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
      console.error("Error adding to cart:", error)
      toast({
        title: "Error",
        description: errorMessage || "Failed to add item to cart. Please try again.",
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
    <div className="p-6 md:p-8">
      <div className="flex items-center mb-8">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-4">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">Your Wishlist</h1>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

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
        <Card className="bg-card rounded-lg border border-border overflow-hidden">
          <CardHeader className="p-4 bg-muted/20 border-b border-border">
            <CardTitle className="font-semibold">Wishlist Items ({wishlistItems.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/20">
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Product</th>
                    <th className="text-left py-3 px-4">Price</th>
                    <th className="text-center py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {wishlistItems.map((item) => (
                    <tr key={item.postId} className="hover:bg-muted/10">
                      <td className="py-4 px-4">
                        <div className="flex items-center">
                          <div className="relative h-20 w-20 rounded-md overflow-hidden flex-shrink-0">
                            <Image
                              src={
                                item.image && item.image.length > 0
                                  ? item.image[0]
                                  : "/placeholder.svg?height=80&width=80"
                              }
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="ml-4">
                            <h3 className="font-medium">{item.name}</h3>
                            <p className="text-sm text-muted-foreground">{item.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-semibold">₹{item.price.toLocaleString()}</p>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addToCart(item.postId, item.name)}
                            disabled={addingToCart[item.postId]}
                            className="text-primary hover:text-primary-foreground hover:bg-primary"
                          >
                            {addingToCart[item.postId] ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <ShoppingCart className="h-4 w-4 mr-2" />
                            )}
                            Add to Cart
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-8 text-center">
        <Link href={`/client-dashboard/${clientId}/products`} className="text-primary hover:underline">
          Continue Shopping
        </Link>
      </div>
    </div>
  )
}
