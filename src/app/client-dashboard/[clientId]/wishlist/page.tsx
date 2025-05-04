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
import { Input } from "@/components/ui/input"

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
  // Add console log at the beginning of the component
  console.log("Wishlist page component initialized")

  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const clientId = params.clientId as string

  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<Record<string, boolean>>({})
  const [addingToCart, setAddingToCart] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<string | null>(null)
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  // Fetch wishlist items
  // Add detailed logging to the useEffect hook for fetching wishlist
  useEffect(() => {
    const fetchWishlist = async () => {
      console.log("Starting fetchWishlist function")
      try {
        setLoading(true)
        setError(null)
        console.log("Attempting to fetch wishlist data")

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
        console.log("Mock wishlist items created:", mockWishlistItems)

        // Get saved wishlist from localStorage
        if (typeof window !== "undefined") {
          console.log("Checking localStorage for saved wishlist")
          const savedWishlist = localStorage.getItem("wishlist")
          console.log("Saved wishlist from localStorage:", savedWishlist)

          if (savedWishlist) {
            const wishlistIds = JSON.parse(savedWishlist)
            console.log("Parsed wishlist IDs:", wishlistIds)

            // Filter mock items to only include those in the wishlist
            const filteredItems = mockWishlistItems.filter((item) => wishlistIds.includes(item.postId))
            console.log("Filtered wishlist items:", filteredItems)
            setWishlistItems(filteredItems)

            // Initialize quantities
            const initialQuantities: Record<string, number> = {}
            filteredItems.forEach((item) => {
              initialQuantities[item.postId] = 1000
            })
            console.log("Initial quantities set:", initialQuantities)
            setQuantities(initialQuantities)
          } else {
            console.log("No saved wishlist found, using mock data")
            setWishlistItems(mockWishlistItems)

            // Initialize quantities
            const initialQuantities: Record<string, number> = {}
            mockWishlistItems.forEach((item) => {
              initialQuantities[item.postId] = 1000
            })
            console.log("Initial quantities set:", initialQuantities)
            setQuantities(initialQuantities)
          }
        } else {
          console.log("Window not defined, using mock data")
          setWishlistItems(mockWishlistItems)
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
        console.error("Error fetching wishlist:", error)
        console.log("Error details:", { message: errorMessage, error })
        setError(errorMessage)
        toast({
          title: "Error",
          description: errorMessage || "Failed to load your wishlist. Please try again.",
          variant: "destructive",
        })
        setWishlistItems([])
      } finally {
        console.log("Finished fetching wishlist data")
        setLoading(false)
      }
    }

    console.log("Setting up wishlist fetch")
    fetchWishlist()
  }, [toast])

  // Remove item from wishlist
  // Add detailed logging to removeFromWishlist function
  const removeFromWishlist = async (productId: string) => {
    console.log(`Starting removeFromWishlist for product ID: ${productId}`)
    try {
      setRemoving((prev) => {
        console.log("Current removing state:", prev)
        return { ...prev, [productId]: true }
      })

      // In a real app, you would make an API call here
      console.log("Would make API call to remove item from wishlist")

      // Update localStorage wishlist
      if (typeof window !== "undefined") {
        console.log("Updating localStorage wishlist")
        const savedWishlist = localStorage.getItem("wishlist")
        console.log("Current localStorage wishlist:", savedWishlist)

        if (savedWishlist) {
          const wishlistArray = JSON.parse(savedWishlist)
          console.log("Parsed wishlist array:", wishlistArray)

          const updatedWishlist = wishlistArray.filter((id: string) => id !== productId)
          console.log("Updated wishlist array:", updatedWishlist)

          localStorage.setItem("wishlist", JSON.stringify(updatedWishlist))
          console.log("Wishlist updated in localStorage")
        }
      }

      // Update state
      setWishlistItems((prev) => {
        console.log("Current wishlist items:", prev)
        const updated = prev.filter((item) => item.postId !== productId)
        console.log("Updated wishlist items:", updated)
        return updated
      })

      console.log("Item successfully removed from wishlist")
      toast({
        title: "Item removed",
        description: "Item has been removed from your wishlist",
        variant: "default",
      })
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
      console.error("Error removing item from wishlist:", error)
      console.log("Error details:", { message: errorMessage, error })
      toast({
        title: "Error",
        description: errorMessage || "Failed to remove item from wishlist. Please try again.",
        variant: "destructive",
      })
    } finally {
      console.log(`Finished removeFromWishlist for product ID: ${productId}`)
      setRemoving((prev) => ({ ...prev, [productId]: false }))
    }
  }

  // Add to cart
  // Add detailed logging to addToCart function
  const addToCart = async (productId: string, productName: string) => {
    console.log(`Starting addToCart for product: ${productName} (ID: ${productId})`)
    try {
      setAddingToCart((prev) => {
        console.log("Current addingToCart state:", prev)
        return { ...prev, [productId]: true }
      })

      // Check if item is already in cart
      const savedCart = localStorage.getItem("cart")
      console.log("Current cart from localStorage:", savedCart)

      const cartArray = savedCart ? JSON.parse(savedCart) : []
      console.log("Parsed cart array:", cartArray)

      if (cartArray.includes(productId)) {
        console.log("Product already in cart, aborting")
        toast({
          title: "Already in cart",
          description: "This item is already in your cart",
          variant: "default",
        })
        return
      }

      // Get the quantity for this product
      const quantity = quantities[productId] || 1000
      console.log(`Adding ${quantity} sqft of product ${productId} to cart`)

      // In a real app, you would make an API call here
      console.log("Would make API call to add item to cart with quantity:", quantity)

      // Update localStorage cart
      cartArray.push(productId)
      console.log("Updated cart array:", cartArray)

      localStorage.setItem("cart", JSON.stringify(cartArray))
      console.log("Cart updated in localStorage")

      // Store the quantity in localStorage
      try {
        console.log("Storing cart quantity in localStorage")
        const savedCartQuantities = localStorage.getItem("cartQuantities")
        console.log("Current cart quantities from localStorage:", savedCartQuantities)

        const cartQuantities = savedCartQuantities ? JSON.parse(savedCartQuantities) : {}
        cartQuantities[productId] = quantity
        console.log("Updated cart quantities:", cartQuantities)

        localStorage.setItem("cartQuantities", JSON.stringify(cartQuantities))
        console.log("Cart quantities updated in localStorage")
      } catch (e) {
        console.error("Error storing cart quantity:", e)
      }

      console.log("Item successfully added to cart")
      toast({
        title: "Added to cart",
        description: `${productName} has been added to your cart`,
        variant: "default",
      })
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
      console.error("Error adding to cart:", error)
      console.log("Error details:", { message: errorMessage, error })
      toast({
        title: "Error",
        description: errorMessage || "Failed to add item to cart. Please try again.",
        variant: "destructive",
      })
    } finally {
      console.log(`Finished addToCart for product ID: ${productId}`)
      setAddingToCart((prev) => ({ ...prev, [productId]: false }))
    }
  }

  // Add detailed logging to handleQuantityChange function
  const handleQuantityChange = (productId: string, value: string) => {
    console.log(`Quantity change for product ${productId}: ${value}`)
    const parsedValue = Number.parseInt(value)
    console.log(`Parsed quantity value: ${parsedValue}`)

    setQuantities((prevQuantities) => {
      console.log("Current quantities:", prevQuantities)
      const newQuantities = {
        ...prevQuantities,
        [productId]: isNaN(parsedValue) ? 0 : parsedValue,
      }
      console.log("Updated quantities:", newQuantities)
      return newQuantities
    })

    // Calculate and log the adjusted price
    const item = wishlistItems.find((item) => item.postId === productId)
    if (item) {
      const adjustedPrice = item.price * (isNaN(parsedValue) ? 0 : parsedValue)
      console.log(
        `Adjusted price for ${item.name}: ₹${adjustedPrice.toLocaleString()} (${parsedValue} sqft × ₹${item.price}/sqft)`,
      )
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

  // Add console log for rendering
  console.log("Rendering wishlist page with state:", {
    wishlistItems,
    loading,
    error,
    removing,
    addingToCart,
    quantities,
  })

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
                        <div className="mt-2">
                          <p className="text-sm text-muted-foreground">₹{item.price.toLocaleString()}/sqft</p>
                          <p className="text-lg font-bold text-primary">
                            Total: ₹{(item.price * (quantities[item.postId] || 1000) || 0).toLocaleString()}
                          </p>
                        </div>
                        <div className="mt-4 mb-2">
                          <label
                            htmlFor={`quantity-${item.postId}`}
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Quantity (sqft):
                          </label>
                          <Input
                            id={`quantity-${item.postId}`}
                            type="number"
                            min="1"
                            value={quantities[item.postId] || 1000}
                            onChange={(e) => handleQuantityChange(item.postId, e.target.value)}
                            className="h-8 w-full text-center"
                          />
                        </div>
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
