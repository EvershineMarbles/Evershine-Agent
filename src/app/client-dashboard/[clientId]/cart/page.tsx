"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, CheckCircle, Clock, Loader2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/hooks/use-toast"

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
  quantity?: number
}

export default async function CartPage({ params }: { params: Promise<{ clientId: string }> }) {
  const unwrappedParams = await params
  const clientId = unwrappedParams.clientId

  const router = useRouter()
  const { toast } = useToast()

  const [items, setItems] = useState<Product[]>([])
  const [allProducts, setAllProducts] = useState<Record<string, Product>>({})
  const [loading, setLoading] = useState(true)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [checkoutLoading, setCheckoutLoading] = useState(false)
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

  // Fetch cart items
  const fetchCartItems = useCallback(async () => {
    try {
      setLoading(true)

      // Get cart IDs from localStorage
      let cartIds: string[] = []
      if (typeof window !== "undefined") {
        try {
          const savedCart = localStorage.getItem("cart")
          if (savedCart) {
            cartIds = JSON.parse(savedCart)
          }
        } catch (e) {
          console.error("Error parsing cart from localStorage:", e)
        }
      }

      if (cartIds.length === 0) {
        setItems([])
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
          productsData = data.data.map((product: unknown) => {
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

      setAllProducts(productsById)

      // Filter products that are in the cart
      const cartItems = cartIds.map((id) => productsById[id]).filter(Boolean) // Remove undefined items

      // Initialize quantities
      const initialQuantities: Record<string, number> = {}
      cartItems.forEach((item) => {
        initialQuantities[item.postId] = 1
      })

      setQuantities(initialQuantities)
      setItems(cartItems)
    } catch (err) {
      console.error("Error processing cart items:", err)
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (!orderPlaced) {
      fetchCartItems()
    }
  }, [fetchCartItems, orderPlaced])

  const removeFromCart = useCallback(
    (productId: string) => {
      // Update state
      setCart((prev) => prev.filter((id) => id !== productId))
      setItems((prev) => prev.filter((item) => item.postId !== productId))

      toast({
        title: "Removed from Cart",
        description: "Item has been removed from your cart",
        variant: "default",
      })
    },
    [toast],
  )

  const updateQuantity = useCallback((productId: string, newQuantity: number) => {
    if (newQuantity < 1) return

    setQuantities((prev) => ({
      ...prev,
      [productId]: newQuantity,
    }))
  }, [])

  const calculateSubtotal = useCallback(
    (productId: string) => {
      const product = allProducts[productId]
      const quantity = quantities[productId] || 1
      return product.price * quantity
    },
    [allProducts, quantities],
  )

  const calculateTotal = useCallback(() => {
    return items.reduce((total, item) => {
      return total + calculateSubtotal(item.postId)
    }, 0)
  }, [items, calculateSubtotal])

  const handleConfirmOrder = useCallback(async () => {
    try {
      setCheckoutLoading(true)

      // Simulate API call with delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Clear cart
      if (typeof window !== "undefined") {
        localStorage.setItem("cart", "[]")
      }

      setCart([])

      // Update order placed state
      setOrderPlaced(true)

      toast({
        title: "Order Placed",
        description: "Your order has been placed successfully!",
        variant: "default",
      })
    } catch (err) {
      console.error("Error placing order:", err)
      toast({
        title: "Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setCheckoutLoading(false)
    }
  }, [toast])

  // Loading state
  if (loading) {
    return (
      <div className="p-6 md:p-8">
        <h1 className="text-3xl font-bold mb-8">Your Cart</h1>

        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-blue mb-4" />
          <p className="text-muted-foreground">Loading cart items...</p>
        </div>
      </div>
    )
  }

  // Error state
  // if (error && items.length === 0 && !orderPlaced) {
  //   return (
  //     <div className="p-6 md:p-8">
  //       <h1 className="text-3xl font-bold mb-8">Your Cart</h1>
  //       <div className="text-center py-12">
  //         <h2 className="text-xl font-medium mb-4">Error Loading Cart</h2>
  //         <p className="text-muted-foreground mb-6">{error}</p>
  //         <Button onClick={() => window.location.reload()} className="bg-blue hover:bg-blue/90">
  //           Retry
  //         </Button>
  //       </div>
  //     </div>
  //   )
  // }

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-3xl font-bold mb-8">Your Cart</h1>

      {items.length === 0 && !orderPlaced ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-medium mb-4">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">Add items to your cart to place an order</p>
          <Link href={`/client-dashboard/${clientId}/products`}>
            <Button className="bg-blue hover:bg-blue/90">Browse Products</Button>
          </Link>
        </div>
      ) : (
        <>
          {orderPlaced ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center mb-6">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-medium mb-2">Order Placed Successfully!</h2>
              <p className="text-muted-foreground mb-8">Your order has been confirmed and will be processed soon.</p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/client-dashboard/${clientId}/products`)}
                  className="h-12"
                  type="button"
                >
                  Continue Shopping
                </Button>
                <Button
                  className="bg-blue hover:bg-blue/90 h-12"
                  onClick={() => {
                    setOrderPlaced(false)
                    setItems([])
                  }}
                  type="button"
                >
                  View Order Status
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-6 mb-8">
                {items.map((item) => (
                  <Card key={item._id} className="overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                      <div className="relative h-48 md:h-auto md:w-48 flex-shrink-0">
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
                      <div className="flex-1 flex flex-col">
                        <CardHeader className="pb-2">
                          <CardTitle>{item.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1">
                          <p className="text-muted-foreground">
                            {item.description || `Premium quality ${item.name.toLowerCase()}`}
                          </p>
                          <p className="text-lg font-bold mt-2">₹{item.price}</p>

                          <div className="flex items-center mt-4">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => updateQuantity(item.postId, (quantities[item.postId] || 1) - 1)}
                              type="button"
                            >
                              -
                            </Button>
                            <span className="mx-4 font-medium">{quantities[item.postId] || 1}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => updateQuantity(item.postId, (quantities[item.postId] || 1) + 1)}
                              type="button"
                            >
                              +
                            </Button>
                          </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeFromCart(item.postId)}
                            className="text-red-500"
                            type="button"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </Button>
                          <p className="font-bold">Subtotal: ₹{calculateSubtotal(item.postId)}</p>
                        </CardFooter>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>₹{calculateTotal()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>₹500</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax</span>
                      <span>₹{Math.round(calculateTotal() * 0.18)}</span>
                    </div>
                    <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>₹{calculateTotal() + 500 + Math.round(calculateTotal() * 0.18)}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row justify-between gap-4">
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/client-dashboard/${clientId}/products`)}
                    type="button"
                  >
                    Continue Shopping
                  </Button>
                  <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <Button variant="outline" className="border-blue text-blue" type="button">
                      <Clock className="h-4 w-4 mr-2" />
                      Order Status
                    </Button>
                    <Button
                      className="bg-blue hover:bg-blue/90"
                      onClick={handleConfirmOrder}
                      disabled={checkoutLoading}
                      type="button"
                    >
                      {checkoutLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Processing...
                        </>
                      ) : (
                        "Confirm Order"
                      )}
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  )
}

