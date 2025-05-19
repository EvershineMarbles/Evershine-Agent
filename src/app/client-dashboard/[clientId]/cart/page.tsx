"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Trash2, Loader2, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import axios from "axios"

// Add the CommissionData interface
interface CommissionData {
  agentId: string
  name: string
  email: string
  commissionRate: number
  categoryCommissions?: Record<string, number>
}

interface CartItem {
  _id: string
  name: string
  price: number
  basePrice?: number
  image: string[]
  postId: string
  category: string
  quantity: number
}

export default function CartPage() {
  const router = useRouter()
  const params = useParams()
  const clientId = params.clientId as string
  const { toast } = useToast()

  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<Record<string, boolean>>({})
  const [updating, setUpdating] = useState<Record<string, boolean>>({})
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  // Add commission data state
  const [commissionData, setCommissionData] = useState<CommissionData | null>(null)

  // We'll still fetch the commission data but NOT use the override rate
  // since it's already applied by the backend
  const [overrideCommissionRate, setOverrideCommissionRate] = useState<number | null>(null)

  // Get API URL from environment or use default
  const getApiUrl = () => {
    return process.env.NEXT_PUBLIC_API_URL || "https://evershinebackend-2.onrender.com"
  }

  // Get token from localStorage
  const getToken = () => {
    try {
      // Try both token storage options
      const token = localStorage.getItem("clientImpersonationToken") || localStorage.getItem("token")
      if (!token) {
        toast({
          title: "Authentication required",
          description: "Please log in to view your cart",
          variant: "destructive",
        })
        return null
      }
      return token
    } catch (e) {
      toast({
        title: "Error",
        description: "Error accessing authentication. Please refresh the page.",
        variant: "destructive",
      })
      return null
    }
  }

  // Add fetchCommissionData function
  const fetchCommissionData = async () => {
    try {
      const token = getToken()
      if (!token) return null

      const apiUrl = getApiUrl()
      const response = await axios.get(`${apiUrl}/api/client/agent-commission`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.data.success && response.data.data) {
        setCommissionData(response.data.data)
        return response.data.data
      }
      return null
    } catch (error) {
      console.error("Error fetching commission data:", error)
      return null
    }
  }

  // Load saved commission rate from localStorage on component mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Use a client-specific key for commission rate
      const savedRate = localStorage.getItem(`commission-override-${clientId}`)
      if (savedRate) {
        setOverrideCommissionRate(Number(savedRate))
      } else {
        // Reset to null if no saved rate for this client
        setOverrideCommissionRate(null)
      }
    }
  }, [clientId])

  // Fetch client data to get consultant level - we still fetch it but don't use it for calculations
  useEffect(() => {
    const fetchClientData = async () => {
      try {
        const token = getToken()
        if (!token) return

        const apiUrl = getApiUrl()
        const response = await axios.get(`${apiUrl}/api/getClientDetails/${clientId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.data.success && response.data.data) {
          // Set commission rate based on consultant level color
          if (response.data.data.consultantLevel) {
            const consultantLevel = response.data.data.consultantLevel
            console.log("Client consultant level:", consultantLevel)

            // Map color to commission rate
            let commissionRate = null
            switch (consultantLevel) {
              case "red":
                commissionRate = 5
                break
              case "yellow":
                commissionRate = 10
                break
              case "purple":
                commissionRate = 15
                break
              default:
                commissionRate = null
            }

            // Set the override commission rate
            setOverrideCommissionRate(commissionRate)
            console.log(`Setting commission rate to ${commissionRate}% based on consultant level ${consultantLevel}`)
          }
        }
      } catch (error) {
        console.error("Error fetching client data:", error)
      }
    }

    fetchClientData()
  }, [clientId])

  // Fetch cart items from server
  useEffect(() => {
    fetchCart()
  }, [])

  const fetchCart = async () => {
    try {
      setLoading(true)
      const token = getToken()

      if (!token) {
        setLoading(false)
        return
      }

      // First fetch commission data
      await fetchCommissionData()

      const apiUrl = getApiUrl()

      const response = await fetch(`${apiUrl}/api/getUserCart`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch cart")
      }

      const data = await response.json()

      if (data.data) {
        const validItems = (data.data.items || []).filter(
          (item: CartItem) => item.postId && typeof item.postId === "string",
        )

        console.log("CART - Items received from backend:", validItems)

        // Ensure all items have valid prices
        const itemsWithValidPrices = validItems.map((item: CartItem) => {
          console.log(`CART - Item ${item.name} - Price from backend:`, item.price)

          // If price is missing or invalid, try to get it from the product
          if (!item.price || item.price <= 0) {
            // We'll fetch the product details to get the correct price
            fetchProductPrice(item.postId).then((price) => {
              console.log(`CART - Fetched product price for ${item.name}:`, price)
              if (price > 0) {
                setCartItems((prev) =>
                  prev.map((cartItem) => (cartItem.postId === item.postId ? { ...cartItem, price } : cartItem)),
                )
              }
            })
          }
          return item
        })

        setCartItems(itemsWithValidPrices)
      } else {
        setCartItems([])
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load your cart. Please try again.",
        variant: "destructive",
      })
      setCartItems([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch product price if needed
  const fetchProductPrice = async (productId: string): Promise<number> => {
    try {
      const token = getToken()
      if (!token) return 0

      const apiUrl = getApiUrl()

      const response = await fetch(`${apiUrl}/api/getProduct/${productId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) return 0

      const data = await response.json()
      if (data.success && data.data && data.data.price) {
        return data.data.price
      }

      return 0
    } catch (error) {
      return 0
    }
  }

  // Update item quantity
  const updateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return

    try {
      setUpdating((prev) => ({ ...prev, [productId]: true }))
      const token = getToken()

      if (!token) return

      const apiUrl = getApiUrl()

      // Get the current item
      const currentItem = cartItems.find((item) => item.postId === productId)
      if (!currentItem) return

      console.log(`CART - Updating quantity for ${currentItem.name}:`)
      console.log(`CART - Original price:`, currentItem.price)
      console.log(`CART - New quantity:`, newQuantity)

      // First remove the item
      await fetch(`${apiUrl}/api/deleteUserCartItem`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId }),
      })

      // Then add it back with the new quantity and preserve the original price
      await fetch(`${apiUrl}/api/addToCart`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          quantity: newQuantity,
          price: currentItem.price, // Preserve the original price
        }),
      })

      // Update local state
      setCartItems((prev) =>
        prev.map((item) => (item.postId === productId ? { ...item, quantity: newQuantity } : item)),
      )

      toast({
        title: "Quantity Updated",
        description: "Item quantity has been updated",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update quantity. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUpdating((prev) => ({ ...prev, [productId]: false }))
    }
  }

  // Handle direct quantity input
  const handleQuantityChange = (productId: string, value: string) => {
    const numValue = Number.parseInt(value)
    if (!isNaN(numValue) && numValue > 0) {
      updateQuantity(productId, numValue)
    }
  }

  // Remove item from cart
  const removeFromCart = async (productId: string) => {
    try {
      setRemoving((prev) => ({ ...prev, [productId]: true }))
      const token = getToken()

      if (!token) return

      const apiUrl = getApiUrl()

      const response = await fetch(`${apiUrl}/api/deleteUserCartItem`, {
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
        setCartItems((prev) => prev.filter((item) => item.postId !== productId))
        toast({
          title: "Item removed",
          description: "Item has been removed from your cart",
        })
      } else {
        throw new Error("Failed to remove item")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to remove item from cart. Please try again.",
        variant: "destructive",
      })
    } finally {
      setRemoving((prev) => ({ ...prev, [productId]: false }))
    }
  }

  // Calculate total with original prices from backend
  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + item.price * item.quantity
    }, 0)
  }

  // Handle checkout
  const handleCheckout = async () => {
    try {
      setIsCheckingOut(true)
      setCheckoutError(null)

      if (cartItems.length === 0) {
        throw new Error("Your cart is empty")
      }

      const token = getToken()

      if (!token) return

      const apiUrl = getApiUrl()

      const shippingAddress = {
        street: "123 Main Street",
        city: "Mumbai",
        state: "Maharashtra",
        postalCode: "400001",
        country: "India",
      }

      const payload = {
        shippingAddress,
        paymentMethod: "bank_transfer",
        notes: "Order placed via dashboard",
      }

      const response = await fetch(`${apiUrl}/api/createOrder`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error("Failed to place order")
      }

      const data = await response.json()

      if (data.success) {
        setCartItems([])
        toast({
          title: "Order Placed",
          description: "Your order has been placed successfully!",
        })
        router.push(`/client-dashboard/${clientId}/orders`)
      } else {
        throw new Error("Failed to place order")
      }
    } catch (error: any) {
      setCheckoutError(error.message || "An error occurred during checkout")
      toast({
        title: "Checkout Failed",
        description: "Failed to place your order. Please try again.",
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
      const token = getToken()

      if (!token) return

      const apiUrl = getApiUrl()

      const response = await fetch(`${apiUrl}/api/clearCart`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to clear cart")
      }

      setCartItems([])
      toast({
        title: "Cart Cleared",
        description: "All items have been removed from your cart",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to clear cart. Please try again.",
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
    <div className="container mx-auto px-4 py-8">
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
        <div className="text-center py-16 bg-muted/20 rounded-lg shadow-sm">
          <ShoppingBag className="h-20 w-20 mx-auto text-muted-foreground mb-6" />
          <p className="text-2xl font-medium mb-4">Your cart is empty</p>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Looks like you haven't added any products to your cart yet.
          </p>
          <Button
            onClick={() => router.push(`/client-dashboard/${clientId}/products`)}
            className="bg-primary hover:bg-primary/90 px-8 py-6 h-auto text-lg"
          >
            Browse Products
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
              <div className="p-4 bg-muted/20 border-b">
                <h2 className="font-semibold text-lg">Cart Items ({cartItems.length})</h2>
              </div>
              <div className="divide-y">
                {cartItems.map((item) => {
                  return (
                    <div key={item.postId} className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="relative h-24 w-24 rounded-md overflow-hidden flex-shrink-0 border">
                        <Image
                          src={
                            item.image && item.image.length > 0 ? item.image[0] : "/placeholder.svg?height=96&width=96"
                          }
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-grow">
                        <h3 className="font-medium text-lg">{item.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{item.category}</p>
                        <p className="font-semibold text-lg text-primary">₹{item.price.toLocaleString()}</p>
                      </div>
                      <div className="flex flex-col sm:flex-row items-center gap-4 mt-2 sm:mt-0">
                        {/* Quantity input */}
                        <div className="flex items-center border rounded-md">
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(item.postId, e.target.value)}
                            className="h-10 w-20 text-center"
                            disabled={updating[item.postId]}
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => removeFromCart(item.postId)}
                          disabled={removing[item.postId]}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-10 w-10"
                        >
                          {removing[item.postId] ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden sticky top-4">
              <div className="p-4 bg-muted/20 border-b">
                <h2 className="font-semibold text-lg">Order Summary</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">₹{calculateTotal().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>Calculated at checkout</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span>Calculated at checkout</span>
                  </div>
                  <div className="border-t pt-4 mt-2">
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span className="text-primary">₹{calculateTotal().toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleCheckout}
                  className="w-full mt-8 bg-primary hover:bg-primary/90 py-6 h-auto text-lg"
                  disabled={isCheckingOut || cartItems.length === 0}
                >
                  {isCheckingOut ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Proceed to Checkout"
                  )}
                </Button>

                <div className="mt-6 text-center">
                  <Link
                    href={`/client-dashboard/${clientId}/products`}
                    className="text-primary hover:underline font-medium"
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
