"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Trash2, Loader2, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

interface CartItem {
  _id: string
  name: string
  price: number
  image: string[]
  postId: string
  category: string
  quantity: number
}

export default function CartPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const clientId = params.clientId as string

  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<Record<string, boolean>>({})

  // Fetch cart items
  useEffect(() => {
    const fetchCart = async () => {
      try {
        setLoading(true)

        // Get the token
        const token = localStorage.getItem("clientImpersonationToken")

        if (!token) {
          throw new Error("No authentication token found. Please refresh the page and try again.")
        }

        console.log("Fetching cart with token:", token.substring(0, 15) + "...")

        const response = await fetch("http://localhost:8000/api/getUserCart", {
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

        if (data.data) {
          console.log("Cart data:", data.data)
          setCartItems(data.data.items || [])
        } else {
          setCartItems([])
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
        console.error("Error fetching cart:", error)
        toast({
          title: "Error",
          description: errorMessage || "Failed to load your cart. Please try again.",
          variant: "destructive",
        })
        setCartItems([])
      } finally {
        setLoading(false)
      }
    }

    fetchCart()
  }, [toast])

  // Remove item from cart
  const removeFromCart = async (productId: string) => {
    try {
      setRemoving((prev) => ({ ...prev, [productId]: true }))

      // Get the token
      const token = localStorage.getItem("clientImpersonationToken")

      if (!token) {
        throw new Error("No authentication token found. Please refresh the page and try again.")
      }

      console.log("Removing item from cart with token:", token.substring(0, 15) + "...")

      const response = await fetch("http://localhost:8000/api/deleteUserCartItem", {
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
        setCartItems((prev) => prev.filter((item) => item.postId !== productId))

        // Update localStorage cart
        if (typeof window !== "undefined") {
          const savedCart = localStorage.getItem("cart")
          if (savedCart) {
            const cartArray = JSON.parse(savedCart)
            localStorage.setItem("cart", JSON.stringify(cartArray.filter((id: string) => id !== productId)))
          }
        }

        toast({
          title: "Item removed",
          description: "Item has been removed from your cart",
          variant: "default",
        })
      } else {
        throw new Error(data.message || "Failed to remove item")
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
      console.error("Error removing item from cart:", error)
      toast({
        title: "Error",
        description: errorMessage || "Failed to remove item from cart. Please try again.",
        variant: "destructive",
      })
    } finally {
      setRemoving((prev) => ({ ...prev, [productId]: false }))
    }
  }

  // Calculate total
  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  // Handle checkout
  const handleCheckout = async () => {
    try {
      setLoading(true)

      // Get the token
      const token = localStorage.getItem("clientImpersonationToken")

      if (!token) {
        throw new Error("No authentication token found. Please refresh the page and try again.")
      }

      // Basic shipping address - in a real app, you would collect this from the user
      const shippingAddress = {
        street: "123 Main Street",
        city: "Mumbai",
        state: "Maharashtra",
        postalCode: "400001",
        country: "India",
      }

      // Make API request to create order - ensure method is POST and use the correct endpoint
      const response = await fetch("https://evershinebackend-2.onrender.com/api/createOrder", {
        method: "POST", // Ensure this is POST
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shippingAddress,
          paymentMethod: "bank_transfer", // Default payment method
          notes: "Order placed via agent dashboard",
        }),
      })

      // Log the response for debugging
      console.log("Checkout response status:", response.status)
      console.log("Checkout response status text:", response.statusText)

      // Check for errors
      if (!response.ok) {
        const errorText = await response.text()
        console.error("Checkout error response:", errorText)

        try {
          const errorData = JSON.parse(errorText)
          throw new Error(errorData.message || `API error: ${response.status} ${response.statusText}`)
        } catch {
          throw new Error(`API error: ${response.status} ${response.statusText}`)
        }
      }

      const data = await response.json()

      if (data.success) {
        // Clear cart items from state
        setCartItems([])

        // Clear localStorage cart
        if (typeof window !== "undefined") {
          localStorage.removeItem("cart")
        }

        toast({
          title: "Order Placed Successfully",
          description: "Your order has been placed and is being processed.",
          variant: "default",
        })

        // Redirect to orders page or confirmation page
        setTimeout(() => {
          router.push(`/client-dashboard/${clientId}/orders`)
        }, 2000)
      } else {
        throw new Error(data.message || "Failed to place order")
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
      console.error("Error during checkout:", error)
      toast({
        title: "Checkout Failed",
        description: errorMessage || "Failed to place your order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading your cart...</p>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center mb-8">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-4">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">Your Cart</h1>
      </div>

      {cartItems.length === 0 ? (
        <div className="text-center py-12 bg-muted/20 rounded-lg">
          <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-xl font-medium mb-4">Your cart is empty</p>
          <p className="text-muted-foreground mb-6">Add some products to your cart to see them here</p>
          <Button
            onClick={() => router.push(`/client-dashboard/${clientId}/products`)}
            className="bg-primary hover:bg-primary/90"
          >
            Browse Products
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="p-4 bg-muted/20 border-b border-border">
                <h2 className="font-semibold">Cart Items ({cartItems.length})</h2>
              </div>
              <div className="divide-y divide-border">
                {cartItems.map((item) => (
                  <div key={item.postId} className="p-4 flex items-center">
                    <div className="relative h-20 w-20 rounded-md overflow-hidden flex-shrink-0">
                      <Image
                        src={
                          item.image && item.image.length > 0 ? item.image[0] : "/placeholder.svg?height=80&width=80"
                        }
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="ml-4 flex-grow">
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">{item.category}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="font-semibold">₹{item.price.toLocaleString()}</p>
                        <div className="flex items-center">
                          <span className="mx-2">Qty: {item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFromCart(item.postId)}
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
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg border border-border overflow-hidden sticky top-4">
              <div className="p-4 bg-muted/20 border-b border-border">
                <h2 className="font-semibold">Order Summary</h2>
              </div>
              <div className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{calculateTotal().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>Calculated at checkout</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span>Calculated at checkout</span>
                  </div>
                  <div className="border-t border-border pt-2 mt-2">
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>₹{calculateTotal().toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <Button onClick={handleCheckout} className="w-full mt-6 bg-primary hover:bg-primary/90">
                  Proceed to Checkout
                </Button>

                <div className="mt-4 text-center">
                  <Link
                    href={`/client-dashboard/${clientId}/products`}
                    className="text-sm text-primary hover:underline"
                  >
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
