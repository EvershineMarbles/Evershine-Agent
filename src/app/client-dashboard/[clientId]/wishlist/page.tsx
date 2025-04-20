"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, AlertCircle, Heart, ShoppingCart, Trash2, ArrowLeft, RefreshCw } from 'lucide-react'
import { useToast } from "@/components/ui/use-toast"
import { ErrorBoundary } from "@/components/error-boundary"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

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

interface Product {
  _id: string
  name: string
  price: number
  image: string[]
  postId: string
  category: string
  quantityAvailable?: number
  description?: string
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
  const [refreshing, setRefreshing] = useState(false)
  const [clearingWishlist, setClearingWishlist] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  // Add state for quantities with default of 100
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  // Fetch all products to get complete product details
  const fetchAllProducts = async (): Promise<Product[]> => {
    try {
      console.log("Fetching all products...")
      const response = await fetch("https://evershinebackend-2.onrender.com/api/getAllProducts")

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("Products API response:", data.success ? "Success" : "Failed")

      if (data.success && Array.isArray(data.data)) {
        return data.data
      } else {
        throw new Error("Invalid API response format")
      }
    } catch (error) {
      console.error("Error fetching products:", error)
      return []
    }
  }

  // Load wishlist items with complete product details
  const loadWishlist = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get the token
      const token = localStorage.getItem("clientImpersonationToken")

      if (!token) {
        throw new Error("No authentication token found. Please refresh the page and try again.")
      }

      console.log("Fetching wishlist...")
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
      console.log("Wishlist API response:", data)

      // Save debug info
      setDebugInfo(data)

      if (data.success && data.data && Array.isArray(data.data.items)) {
        // Extract product IDs from wishlist
        const wishlistProductIds = data.data.items.map((item: any) => item.postId)
        console.log("Wishlist product IDs:", wishlistProductIds)

        if (wishlistProductIds.length === 0) {
          setWishlistItems([])
          return
        }

        // Fetch all products to get complete details
        const allProducts = await fetchAllProducts()
        console.log("All products count:", allProducts.length)

        // Filter products that are in the wishlist
        const wishlistProducts = allProducts.filter((product) => wishlistProductIds.includes(product.postId))
        console.log("Matched wishlist products:", wishlistProducts.length)

        if (wishlistProducts.length > 0) {
          setWishlistItems(wishlistProducts)

          // Initialize quantities for each product with 100
          const initialQuantities: Record<string, number> = {}
          wishlistProducts.forEach((product) => {
            initialQuantities[product.postId] = 1000
          })
          setQuantities(initialQuantities)
        } else {
          // Fallback to original wishlist items if no matches found
          setWishlistItems(data.data.items)

          // Initialize quantities for each product with 100
          const initialQuantities: Record<string, number> = {}
          data.data.items.forEach((item: any) => {
            initialQuantities[item.postId] = 1000
          })
          setQuantities(initialQuantities)
        }
      } else {
        // Fallback to local storage
        const savedWishlist = localStorage.getItem("wishlist")
        if (savedWishlist) {
          const wishlistIds = JSON.parse(savedWishlist)

          // Fetch all products
          const allProducts = await fetchAllProducts()

          // Filter products that are in the local wishlist
          const wishlistProducts = allProducts.filter((product) => wishlistIds.includes(product.postId))

          if (wishlistProducts.length > 0) {
            setWishlistItems(wishlistProducts)

            // Initialize quantities for each product with 100
            const initialQuantities: Record<string, number> = {}
            wishlistProducts.forEach((product) => {
              initialQuantities[product.postId] = 1000
            })
            setQuantities(initialQuantities)
          } else {
            // Create placeholder items if no matches found
            const placeholderItems = wishlistIds.map((id: string) => ({
              _id: id,
              postId: id,
              name: "Product (Local)",
              price: 0,
              image: [],
              category: "Unknown",
            }))
            setWishlistItems(placeholderItems)

            // Initialize quantities for each product with 100
            const initialQuantities: Record<string, number> = {}
            placeholderItems.forEach((item) => {
              initialQuantities[item.postId] = 1000
            })
            setQuantities(initialQuantities)
          }
        } else {
          setWishlistItems([])
        }
      }
    } catch (err: any) {
      console.error("Error loading wishlist:", err)
      setError(err.message || "Failed to load wishlist")

      // Fallback to local storage
      try {
        const savedWishlist = localStorage.getItem("wishlist")
        if (savedWishlist) {
          const wishlistIds = JSON.parse(savedWishlist)

          // Fetch all products
          const allProducts = await fetchAllProducts()

          // Filter products that are in the local wishlist
          const wishlistProducts = allProducts.filter((product) => wishlistIds.includes(product.postId))

          if (wishlistProducts.length > 0) {
            setWishlistItems(wishlistProducts)

            // Initialize quantities for each product with 100
            const initialQuantities: Record<string, number> = {}
            wishlistProducts.forEach((product) => {
              initialQuantities[product.postId] = 1000
            })
            setQuantities(initialQuantities)
          } else {
            // Create placeholder items if no matches found
            const placeholderItems = wishlistIds.map((id: string) => ({
              _id: id,
              postId: id,
              name: "Product (Local)",
              price: 0,
              image: [],
              category: "Unknown",
            }))
            setWishlistItems(placeholderItems)

            // Initialize quantities for each product with 100
            const initialQuantities: Record<string, number> = {}
            placeholderItems.forEach((item) => {
              initialQuantities[item.postId] = 1000
            })
            setQuantities(initialQuantities)
          }
        } else {
          setWishlistItems([])
        }
      } catch (e) {
        console.error("Error with local storage fallback:", e)
      }
    } finally {
      setLoading(false)
    }
  }

  // Fetch wishlist items and cart
  useEffect(() => {
    loadWishlist()

    // Load cart from localStorage
    try {
      const savedCart = localStorage.getItem("cart")
      if (savedCart) {
        setCart(JSON.parse(savedCart))
      }
    } catch (err) {
      console.error("Error loading cart:", err)
    }
  }, [clientId])

  // Handle refreshing the wishlist
  const handleRefresh = async () => {
    setRefreshing(true)
    await loadWishlist()
    setRefreshing(false)
  }

  // Handle clearing the entire wishlist
  const handleClearWishlist = async () => {
    if (wishlistItems.length === 0) return

    setClearingWishlist(true)
    try {
      const token = localStorage.getItem("clientImpersonationToken")

      if (!token) {
        throw new Error("No authentication token found. Please refresh the page and try again.")
      }

      // First, update local state for immediate UI feedback
      const itemsToRemove = [...wishlistItems]
      setWishlistItems([])

      // Update localStorage
      localStorage.setItem("wishlist", JSON.stringify([]))

      // Then make API calls to remove each item
      const promises = itemsToRemove.map(item => 
        fetch("https://evershinebackend-2.onrender.com/api/deleteUserWishlistItem", {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ productId: item.postId }),
        })
      )

      await Promise.allSettled(promises)

      toast({
        title: "Wishlist cleared",
        description: "All items have been removed from your wishlist",
        variant: "default",
      })
    } catch (err: any) {
      console.error("Error clearing wishlist:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to clear wishlist. Please try again.",
        variant: "destructive",
      })
      
      // Reload wishlist to get current state
      loadWishlist()
    } finally {
      setClearingWishlist(false)
    }
  }

  // Handle removing item from wishlist
  const handleRemoveFromWishlist = async (postId: string) => {
    setRemoving((prev) => ({ ...prev, [postId]: true }))

    try {
      const token = localStorage.getItem("clientImpersonationToken")

      if (!token) {
        throw new Error("No authentication token found. Please refresh the page and try again.")
      }

      console.log(`Removing product ${postId} from wishlist...`)

      // First, update local state for immediate UI feedback
      setWishlistItems((prev) => prev.filter((item) => item.postId !== postId))

      // Update localStorage
      const savedWishlist = localStorage.getItem("wishlist")
      if (savedWishlist) {
        const wishlistIds = JSON.parse(savedWishlist)
        localStorage.setItem("wishlist", JSON.stringify(wishlistIds.filter((id: string) => id !== postId)))
      }

      // Then make the API call
      const response = await fetch("https://evershinebackend-2.onrender.com/api/deleteUserWishlistItem", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId: postId }),
      })

      // Log the full response for debugging
      const responseText = await response.text()
      console.log(`API response (${response.status}):`, responseText)

      // Try to parse the response as JSON if possible
      let data
      try {
        data = JSON.parse(responseText)
      } catch (e) {
        console.warn("Could not parse response as JSON:", e)
      }

      if (!response.ok) {
        console.warn(`API error: ${response.status}, but item removed from UI`)
        // We don't throw here because we've already updated the UI
      }

      toast({
        title: "Item removed",
        description: "Item has been removed from your wishlist",
        variant: "default",
      })
    } catch (err: any) {
      console.error("Error removing from wishlist:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to remove item from wishlist. Please try again.",
        variant: "destructive",
      })

      // Note: We don't revert the UI change here for better UX
    } finally {
      setRemoving((prev) => ({ ...prev, [postId]: false }))
    }
  }

  // Handle quantity change
  const handleQuantityChange = (postId: string, value: string) => {
    // Convert to number and ensure it's positive
    const numValue = Math.max(1, Number.parseInt(value) || 1000)
    setQuantities((prev) => ({
      ...prev,
      [postId]: numValue,
    }))
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

      // Get the quantity for this product
      const quantity = quantities[postId] || 1000

      // Make a single API call with the quantity
      const response = await fetch("https://evershinebackend-2.onrender.com/api/addToCart", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: postId,
          quantity: quantity, // Pass the quantity from the wishlist
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || "Failed to add to cart")
      }

      // Update local state for cart
      setCart((prev) => [...prev, postId])

      // Update localStorage for cart
      const savedCart = localStorage.getItem("cart")
      const cartItems = savedCart ? JSON.parse(savedCart) : []
      localStorage.setItem("cart", JSON.stringify([...cartItems, postId]))

      // Store the quantity in localStorage
      try {
        const savedCartQuantities = localStorage.getItem("cartQuantities")
        const cartQuantities = savedCartQuantities ? JSON.parse(savedCartQuantities) : {}
        cartQuantities[postId] = quantity
        localStorage.setItem("cartQuantities", JSON.stringify(cartQuantities))
      } catch (e) {
        console.error("Error storing cart quantity:", e)
      }

      // Now remove from wishlist
      await handleRemoveFromWishlist(postId)

      toast({
        title: "Added to cart",
        description: `${quantity} ${quantity > 1 ? "units" : "unit"} of ${name} added to cart and removed from wishlist`,
        variant: "default",
      })
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
        {/* Debug info - only visible in development */}
        {process.env.NODE_ENV === "development" && debugInfo && (
          <div className="mb-4 p-4 bg-gray-100 rounded-md text-xs overflow-auto max-h-40">
            <details>
              <summary className="font-bold cursor-pointer">Debug Info</summary>
              <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            </details>
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-4">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back</span>
            </Button>
            <h1 className="text-3xl font-bold">Your Wishlist</h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Clear Wishlist Button with Confirmation */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={clearingWishlist || wishlistItems.length === 0}
                  className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                >
                  {clearingWishlist ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Clear Wishlist
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear your wishlist?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove all items from your wishlist. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleClearWishlist}
                    className="bg-red-500 text-white hover:bg-red-600"
                  >
                    Clear Wishlist
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="rounded-full h-10 w-10"
            >
              <RefreshCw className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`} />
              <span className="sr-only">Refresh</span>
            </Button>

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
            <div className="flex justify-between items-center mb-6">
              <p className="text-sm text-muted-foreground">
                You have {wishlistItems.length} item{wishlistItems.length !== 1 ? "s" : ""} in your wishlist
              </p>

              <Button variant="outline" size="sm" onClick={() => router.push(`/client-dashboard/${clientId}/products`)}>
                Add More Items
              </Button>
            </div>

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
                          ? "/placeholder.svg?height=300&width=300&query=product"
                          : item.image && item.image.length > 0 && item.image[0]
                            ? item.image[0]
                            : `/placeholder.svg?height=300&width=300&query=${encodeURIComponent(item.name)}`
                      }
                      alt={item.name}
                      fill
                      className="object-cover transition-transform group-hover:scale-105 duration-300"
                      onError={() => handleImageError(item._id)}
                      unoptimized={true}
                    />

                    {/* Debug info overlay */}
                    {process.env.NODE_ENV === "development" && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 overflow-hidden">
                        ID: {item.postId.substring(0, 8)}...
                      </div>
                    )}

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
                    <p className="text-lg font-bold mt-2">₹{item.price.toLocaleString()}/sqft</p>
                    <p className="text-sm text-muted-foreground mt-1">{item.category}</p>

                    {/* Quantity input - simplified without +/- buttons */}
                    <div className="mt-4 mb-2">
                      <label
                        htmlFor={`quantity-${item.postId}`}
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Quantity:
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

                    <button
                      onClick={() => handleAddToCart(item.postId, item.name)}
                      className={`w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2
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