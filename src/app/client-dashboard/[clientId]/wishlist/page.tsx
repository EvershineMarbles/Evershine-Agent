"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ShoppingCart, Trash2, Loader2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"

// Mock data for fallback
const MOCK_PRODUCTS = [
  {
    _id: "1",
    name: "Marble Tile - White",
    price: 1200,
    image: ["/placeholder.svg?height=300&width=300"],
    postId: "marble-1",
    category: "Marble",
    description: "Premium quality white marble tile",
    status: "approved" as const,
  },
  {
    _id: "2",
    name: "Granite Countertop",
    price: 3500,
    image: ["/placeholder.svg?height=300&width=300"],
    postId: "granite-1",
    category: "Granite",
    description: "Durable granite countertop",
    status: "approved" as const,
  },
  {
    _id: "3",
    name: "Limestone Flooring",
    price: 950,
    image: ["/placeholder.svg?height=300&width=300"],
    postId: "limestone-1",
    category: "Limestone",
    description: "Natural limestone flooring tiles",
    status: "approved" as const,
  },
  {
    _id: "4",
    name: "Sandstone Pavers",
    price: 850,
    image: ["/placeholder.svg?height=300&width=300"],
    postId: "sandstone-1",
    category: "Sandstone",
    description: "Outdoor sandstone pavers",
    status: "approved" as const,
  },
  {
    _id: "5",
    name: "Quartz Slab",
    price: 4200,
    image: ["/placeholder.svg?height=300&width=300"],
    postId: "quartz-1",
    category: "Quartz",
    description: "Engineered quartz slab",
    status: "approved" as const,
  },
  {
    _id: "6",
    name: "Travertine Tiles",
    price: 1100,
    image: ["/placeholder.svg?height=300&width=300"],
    postId: "travertine-1",
    category: "Travertine",
    description: "Natural travertine tiles",
    status: "approved" as const,
  },
]

// Product type definition
interface Product {
  _id: string
  name: string
  price: number
  image: string[]
  postId: string
  category: string
  description?: string
  status?: "draft" | "pending" | "approved"
}

export default function WishlistPage({ params }: { params: { clientId: string } }) {
  const [wishlistItems, setWishlistItems] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const [cart, setCart] = useState<string[]>([])
  const [wishlist, setWishlist] = useState<string[]>([])

  // Load cart and wishlist from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedCart = localStorage.getItem("cart")
        if (savedCart) {
          setCart(JSON.parse(savedCart))
        }

        const savedWishlist = localStorage.getItem("wishlist")
        if (savedWishlist) {
          setWishlist(JSON.parse(savedWishlist))
        }
      } catch (e) {
        console.error("Error loading data from localStorage:", e)
      }
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("cart", JSON.stringify(cart))
    }
  }, [cart])

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("wishlist", JSON.stringify(wishlist))
    }
  }, [wishlist])

  // Fetch all products and filter wishlist items
  const fetchWishlistItems = useCallback(async () => {
    try {
      setLoading(true)

      // Get wishlist IDs from localStorage
      let wishlistIds: string[] = []
      if (typeof window !== "undefined") {
        try {
          const savedWishlist = localStorage.getItem("wishlist")
          if (savedWishlist) {
            wishlistIds = JSON.parse(savedWishlist)
          }
        } catch (e) {
          console.error("Error parsing wishlist from localStorage:", e)
        }
      }

      if (wishlistIds.length === 0) {
        setWishlistItems([])
        setLoading(false)
        return
      }

      // Try to fetch products from API
      let productsData: Product[] = []

      try {
        // Use environment variable if available, otherwise use a default URL
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
        console.log("Attempting to fetch products from:", `${apiUrl}/api/getAllProducts`)

        const response = await fetch(`${apiUrl}/api/getAllProducts`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          // Add a timeout to prevent long waiting times
          signal: AbortSignal.timeout(5000), // 5 second timeout
        })

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`)
        }

        const data = await response.json()

        if (data.success && Array.isArray(data.data)) {
          // Add type assertion to ensure the status is one of the allowed values
          productsData = data.data.map((product: any) => {
            return product as Product
          })
          console.log("Successfully fetched products from API")
        } else {
          throw new Error(data.msg || "Invalid API response format")
        }
      } catch (apiError) {
        console.error("API fetch error:", apiError)
        // Use mock data as fallback
        console.log("Using mock product data as fallback")
        productsData = MOCK_PRODUCTS

        // Show a toast only if we're in a browser environment
        if (typeof window !== "undefined") {
          toast({
            title: "Using demo data",
            description: "Could not connect to the server. Showing demo products.",
            variant: "default",
          })
        }
      }

      // Create a map of products by postId for easy lookup
      const productsById: Record<string, Product> = {}
      productsData.forEach((product: Product) => {
        productsById[product.postId] = product
      })

      // Remove the unused allProducts state

      // Filter products that are in the wishlist
      const items = wishlistIds.map((id) => productsById[id]).filter(Boolean) // Remove undefined items

      setWishlistItems(items)
    } catch (err) {
      console.error("Error processing wishlist items:", err)
      setWishlistItems([])
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchWishlistItems()
  }, [fetchWishlistItems])

  const removeFromWishlist = useCallback(
    (productId: string) => {
      // Update state
      setWishlist((prev) => prev.filter((id) => id !== productId))
      setWishlistItems((prev) => prev.filter((item) => item.postId !== productId))

      toast({
        title: "Removed from Wishlist",
        description: "Item has been removed from your wishlist",
        variant: "default",
      })
    },
    [toast],
  )

  const addToCart = useCallback(
    (productId: string, productName: string) => {
      if (!cart.includes(productId)) {
        setCart((prev) => [...prev, productId])

        toast({
          title: "Added to Cart",
          description: `${productName} has been added to your cart`,
          variant: "default",
        })
      } else {
        toast({
          title: "Already in Cart",
          description: "This product is already in your cart",
          variant: "default",
        })
      }
    },
    [cart, toast],
  )

  // Loading state
  if (loading) {
    return (
      <div className="p-6 md:p-8">
        <h1 className="text-3xl font-bold mb-8">Your Wishlist</h1>

        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-blue mb-4" />
          <p className="text-muted-foreground">Loading wishlist items...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-3xl font-bold mb-8">Your Wishlist</h1>

      {wishlistItems.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-medium mb-4">Your wishlist is empty</h2>
          <p className="text-muted-foreground mb-6">Add items to your wishlist to save them for later</p>
          <Link href={`/client-dashboard/${params.clientId}/products`}>
            <Button className="bg-blue hover:bg-blue/90">Browse Products</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlistItems.map((item) => (
            <Card key={item._id} className="overflow-hidden">
              <div className="relative h-48 w-full">
                <Image
                  src={item.image[0] || "/placeholder.svg?height=300&width=300"}
                  alt={item.name}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = "/placeholder.svg?height=300&width=300"
                  }}
                />
                <Badge className="absolute top-2 right-2 bg-blue">{item.category}</Badge>
              </div>
              <CardHeader className="pb-2">
                <CardTitle>{item.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {item.description || `Premium quality ${item.name.toLowerCase()}`}
                </p>
                <p className="text-lg font-bold mt-2">₹{item.price}</p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => removeFromWishlist(item.postId)}
                  className="text-red-500"
                  type="button"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => addToCart(item.postId, item.name)}
                  className="bg-blue hover:bg-blue/90"
                  disabled={cart.includes(item.postId)}
                  type="button"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {cart.includes(item.postId) ? "Added to Cart" : "Add to Cart"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

