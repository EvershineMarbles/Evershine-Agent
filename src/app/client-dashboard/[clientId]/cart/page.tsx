"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Trash2, Loader2, ShoppingBag, Plus, Minus } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

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
  const [updating, setUpdating] = useState<Record<string, boolean>>({})
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  // Fetch cart items from server
  useEffect(() => {
    fetchCart()
  }, [])

  const fetchCart = async () => {
    try {
      setLoading(true)

      // Get the token
      const token = localStorage.getItem("clientImpersonationToken")

      if (!token) {
        throw new Error("No authentication token found. Please refresh the page and try again.")
      }

      const response = await fetch("https://evershinebackend-2.onrender.com/api/getUserCart", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed. Please refresh the token and try again.")
        } else {
          throw new Error(`API error: ${response.status} ${response.statusText}`)
        }
      }

      const data = await response.json()

      if (data.data) {
        // Filter out any items with null or undefined postId
        const validItems = (data.data.items || []).filter(
          (item: CartItem) => item.postId && typeof item.postId === "string"
        )

        setCartItems(validItems)

        // Update localStorage cart to match server
        const cartIds = validItems.map((item: CartItem) => item.postId)
        localStorage.setItem("cart", JSON.stringify(cartIds))
      } else {
        setCartItems([])
        localStorage.removeItem("cart")
      }
    } catch (error: any) {
      console.error("Error fetching cart:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load your cart. Please try again.",
        variant: "destructive",
      })
      setCartItems([])
    } finally {
      setLoading(false)
    }
  }

  // Update item quantity
  const updateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return

    try {
      setUpdating((prev) => ({ ...prev, [productId]: true }))

      // Get the token
      const token = localStorage.getItem("clientImpersonationToken")

      if (!token) {
        throw new Error("No authentication token found. Please refresh the page and try again.")
      }

      // First remove the item
      const removeResponse = await fetch("https://evershinebackend-2.onrender.com/api/deleteUserCartItem", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId }),
      })

      if (!removeResponse.ok) {
        throw new Error(`Failed to update quantity: ${removeResponse.status}`)
      }

      // Then add it back with the new quantity
      const addResponse = await fetch("https://evershinebackend-2.onrender.com/api/addToCart", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          quantity: newQuantity,
        }),
      })

      if (!addResponse.ok) {
        throw new Error(`Failed to update quantity: ${addResponse.status}`)
      }

      // Update local state
      setCartItems((prev) =>
        prev.map((item) => (item.postId === productId ? { ...item, quantity: newQuantity } : item))
      )

      toast({
        title: "Quantity Updated",
        description: "Item quantity has been updated",
        variant: "default",
      })
    } catch (error: any) {
      console.error("Error updating quantity:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update quantity. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUpdating((prev) => ({ ...prev, [productId]: false }))
    }
  }

  // Remove item from cart
  const removeFromCart = async (productId: string) => {
    try {
      setRemoving((prev) => ({ ...prev, [productId]: true }))

      // Get the token
      const token = localStorage.getItem("clientImpersonationToken")

      if (!token) {
        throw new Error("No authentication token found. Please refresh the page and try again.")
      }

      const response = await fetch("https://evershinebackend-2.onrender.com/api/deleteUserCartItem", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId }),
      })

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
        const savedCart = localStorage.getItem("cart")
        if (savedCart) {
          const cartArray = JSON.parse(savedCart)
          localStorage.setItem("cart", JSON.stringify(cartArray.filter((id: string) => id !== productId)))
        }

        toast({
          title: "Item removed",
          description: "Item has been removed from your cart",
          variant: "default",
        })
      } else {
        throw new Error(data.message || "Failed to remove item")
      }
    } catch (error: any) {
      console.error("Error removing item from cart:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to remove item from cart. Please try again.",
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
      setIsCheckingOut(true)
      setCheckoutError(null)

      // Validate cart has items
      if (cartItems.length === 0) {
        throw new Error("Your cart is empty. Please add items before checking out.")
      }

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

      const payload = {
        shippingAddress,
        paymentMethod: "bank_transfer", // Default payment method
        notes: "Order placed via agent dashboard",
      }

      // Make API request to create order
      const response = await fetch("https://evershinebackend-2.onrender.com/api/createOrder", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success) {
        // Clear cart items from state
        setCartItems([])

        // Clear localStorage cart
        localStorage.removeItem("cart")

        // Redirect to orders page
        router.push(`/client-dashboard/${clientId}/orders`)
      } else {
        throw new Error(data.message || "Failed to place order")
      }
    } catch (error: any) {
      console.error("Error during checkout:", error)
      setCheckoutError(error.message || "An unknown error occurred during checkout")

      toast({
        title: "Checkout Failed",
        description: error.message || "Failed to place your order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCheckingOut(false)
    }
  }

  // Clear cart
  const clearCart = async () => {
    try {
      setLoading(true)

      // Get the token
      const token = localStorage.getItem("clientImpersonationToken")

      if (!token) {
        throw new Error("No authentication token found. Please refresh the page and try again.")
      }

      // Call the clear cart API endpoint
      const response = await fetch("https://evershinebackend-2.onrender.com/api/clearCart", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }

      // Clear local state
      setCartItems([])

      // Clear localStorage
      localStorage.removeItem("cart")

      toast({
        title: "Cart Cleared",
        description: "All items have been removed from your cart",
        variant: "default",
      })
    } catch (error: any) {
      console.error("Error clearing cart:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to clear cart. Please try again.",
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
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">Your Cart</h1>
        </div>

        {cartItems.length > 0 && (
          <Button variant="outline" onClick={clearCart} className="text-red-500 border-red-200 hover:bg-red-50">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Cart
          </Button>
        )}
      </div>

      {checkoutError && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{checkoutError}</AlertDescription>
        </Alert>
      )}

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
                  <div key={item._id || item.postId} className="p-4 flex items-center">
                    <div className="relative h-20 w-20 rounded-md overflow-hidden flex-shrink-0">
                      <Image
                        src={
                          item.image && item.image.length > 0 ? item.image[0] : "/placeholder.svg?height=80&width=80"
                        }
                        alt={item.name}
                        fill
                        unoptimized={true}
                        className="object-cover"
                      />
                    </div>
                    <div className="ml-4 flex-grow">
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">{item.category}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="font-semibold">₹{item.price.toLocaleString()}</p>
                        <div className="flex items-center">
                          {/* Quantity controls */}
                          <div className="flex items-center border rounded-md mr-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 p-0"
                              onClick={() => updateQuantity(item.postId, item.quantity - 1)}
                              disabled={updating[item.postId] || item.quantity <= 1}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 p-0"
                              onClick={() => updateQuantity(item.postId, item.quantity + 1)}
                              disabled={updating[item.postId]}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
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

                <Button
                  onClick={handleCheckout}
                  className="w-full mt-6 bg-primary hover:bg-primary/90"
                  disabled={isCheckingOut || cartItems.length === 0}
                >
                  {isCheckingOut ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Proceed to Checkout"
                  )}
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
