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

interface CartItem {
  _id: string
  name: string
  price: number
  basePrice?: number
  updatedPrice?: number // Backend calculated price
  image: string[]
  postId: string
  category: string
  quantity: number
  customQuantity?: number
  customFinish?: string
  customThickness?: string
  commissionInfo?: {
    currentAgentCommission: number
    consultantLevelCommission: number
    totalCommission: number
    consultantLevel: string
  }
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

  const [editingCustomFields, setEditingCustomFields] = useState<
    Record<
      string,
      {
        customQuantity?: number
        customFinish?: string
        customThickness?: string
      }
    >
  >({})

  const finishOptions = ["Polish", "Leather", "Flute", "River", "Satin", "Dual"]

  const getApiUrl = () => {
    return process.env.NEXT_PUBLIC_API_URL || "https://evershinebackend-2.onrender.com"
  }

  const getToken = () => {
    try {
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

  useEffect(() => {
    fetchCart()
  }, [])

  const handleCustomFieldChange = (itemId: string, field: string, value: string | number) => {
    setEditingCustomFields((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
      },
    }))
  }

  const saveCustomFields = async (productId: string) => {
    try {
      const token = getToken()
      if (!token) return

      const apiUrl = getApiUrl()
      const customFields = editingCustomFields[productId]

      if (!customFields) return

      const response = await fetch(`${apiUrl}/api/updateCartItem`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          customQuantity: customFields.customQuantity,
          customFinish: customFields.customFinish,
          customThickness: customFields.customThickness,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setCartItems((prev) =>
            prev.map((item) => {
              if (item.postId === productId) {
                return {
                  ...item,
                  customQuantity: customFields.customQuantity,
                  customFinish: customFields.customFinish,
                  customThickness: customFields.customThickness,
                }
              }
              return item
            }),
          )

          setEditingCustomFields((prev) => {
            const newState = { ...prev }
            delete newState[productId]
            return newState
          })

          toast({
            title: "Custom fields updated",
            description: "Your custom specifications have been saved",
          })
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update custom fields",
        variant: "destructive",
      })
    }
  }

  const fetchCart = async () => {
    try {
      setLoading(true)
      const token = getToken()

      if (!token) {
        setLoading(false)
        return
      }

      const apiUrl = getApiUrl()

      // Use client-specific cart endpoint
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

        setCartItems(validItems)
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

  const updateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return

    try {
      setUpdating((prev) => ({ ...prev, [productId]: true }))
      const token = getToken()

      if (!token) return

      const apiUrl = getApiUrl()

      const currentItem = cartItems.find((item) => item.postId === productId)
      if (!currentItem) return

      await fetch(`${apiUrl}/api/deleteUserCartItem`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId }),
      })

      // Add back with new quantity - let backend calculate price
      await fetch(`${apiUrl}/api/addToCart`, {
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

  const handleQuantityChange = (productId: string, value: string) => {
    const numValue = Number.parseInt(value)
    if (!isNaN(numValue) && numValue > 0) {
      updateQuantity(productId, numValue)
    }
  }

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

  // Calculate total using backend prices
  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const displayPrice = item.updatedPrice || item.price
      return total + displayPrice * item.quantity
    }, 0)
  }

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
        body: JSON.stringify({}), // Declared payload as an empty object
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
    <div className="container mx-auto px-3 py-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-3">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl md:text-2xl font-bold">Your Cart</h1>
        </div>

        {cartItems.length > 0 && (
          <Button variant="outline" onClick={clearCart} className="text-red-500 border-red-200 hover:bg-red-50 text-xs">
            <Trash2 className="h-3 w-3 mr-1" />
            Clear Cart
          </Button>
        )}
      </div>

      {checkoutError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{checkoutError}</AlertDescription>
        </Alert>
      )}

      {cartItems.length === 0 ? (
        <div className="text-center py-12 bg-muted/20 rounded-lg shadow-sm">
          <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-xl font-medium mb-3">Your cart is empty</p>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Looks like you haven't added any products to your cart yet.
          </p>
          <Button
            onClick={() => router.push(`/client-dashboard/${clientId}/products`)}
            className="bg-primary hover:bg-primary/90 px-6 py-3 h-auto text-base"
          >
            Browse Products
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
              <div className="p-3 bg-muted/20 border-b">
                <h2 className="font-medium">Cart Items ({cartItems.length})</h2>
              </div>
              <div className="divide-y">
                {cartItems.map((item) => {
                  const displayPrice = item.updatedPrice || item.price
                  const hasCommission = item.updatedPrice && item.updatedPrice !== item.price
                  const originalPrice = item.basePrice || item.price
                  const isEditing = editingCustomFields[item.postId]
                  const currentCustomFields = isEditing || {
                    customQuantity: item.customQuantity,
                    customFinish: item.customFinish,
                    customThickness: item.customThickness,
                  }

                  return (
                    <div key={item.postId} className="p-3">
                      {/* Main Product Row - Tablet Layout */}
                      <div className="flex items-center gap-3">
                        {/* Product Image */}
                        <Link href={`/client-dashboard/${clientId}/product/${item.postId}`} className="flex-shrink-0">
                          <div className="relative h-16 w-16 rounded-lg overflow-hidden border border-gray-200 hover:border-primary/30 transition-all duration-200 hover:shadow-sm cursor-pointer group">
                            <Image
                              src={
                                item.image && item.image.length > 0
                                  ? item.image[0]
                                  : "/placeholder.svg?height=64&width=64"
                              }
                              alt={item.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                          </div>
                        </Link>

                        {/* Product Details */}
                        <div className="flex-grow min-w-0">
                          <Link href={`/client-dashboard/${clientId}/product/${item.postId}`} className="block group">
                            <h3 className="font-medium text-sm text-gray-900 group-hover:text-primary transition-colors duration-200 cursor-pointer line-clamp-1">
                              {item.name}
                            </h3>
                          </Link>
                          <p className="text-xs text-gray-500 mt-0.5">{item.category}</p>

                          {/* Price Display */}
                          <div className="mt-1">
                            {hasCommission ? (
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1 flex-wrap">
                                  <span className="font-semibold text-sm text-green-600">
                                    ₹{displayPrice.toLocaleString()}
                                  </span>
                                  <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
                                    Commission ✓
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 line-through">₹{originalPrice.toLocaleString()}</p>
                              </div>
                            ) : (
                              <span className="font-semibold text-sm text-primary">
                                ₹{displayPrice.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Quantity and Actions - Right Side */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="flex items-center gap-1">
                            <label className="text-xs font-medium text-gray-700 whitespace-nowrap">Qty:</label>
                            <div className="flex items-center border border-gray-300 rounded-md overflow-hidden focus-within:border-primary">
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleQuantityChange(item.postId, e.target.value)}
                                className="h-8 w-16 text-center border-0 focus:ring-0 focus:border-0 text-xs"
                                disabled={updating[item.postId]}
                              />
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => removeFromCart(item.postId)}
                            disabled={removing[item.postId]}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200 h-8 w-8 flex-shrink-0"
                          >
                            {removing[item.postId] ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Custom Specifications - Ultra Compact */}
                      {(item.customQuantity || item.customFinish || item.customThickness || isEditing) && (
                        <div className="mt-2 bg-gray-50 rounded-md p-2 border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-xs font-medium text-gray-900">Custom Specifications</h4>
                            {!isEditing && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setEditingCustomFields((prev) => ({
                                    ...prev,
                                    [item.postId]: {
                                      customQuantity: item.customQuantity,
                                      customFinish: item.customFinish,
                                      customThickness: item.customThickness,
                                    },
                                  }))
                                }
                                className="h-6 text-xs px-2 text-primary hover:text-primary/80"
                              >
                                Edit
                              </Button>
                            )}
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                                Quantity
                              </label>
                              {isEditing ? (
                                <Input
                                  type="number"
                                  value={currentCustomFields.customQuantity || ""}
                                  onChange={(e) =>
                                    handleCustomFieldChange(item.postId, "customQuantity", Number(e.target.value))
                                  }
                                  className="h-7 text-xs"
                                  placeholder="sqft"
                                />
                              ) : (
                                <p className="text-xs font-medium text-gray-900">
                                  {item.customQuantity ? `${item.customQuantity} sqft` : "Not specified"}
                                </p>
                              )}
                            </div>

                            <div className="space-y-1">
                              <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                                Finish
                              </label>
                              {isEditing ? (
                                <select
                                  value={currentCustomFields.customFinish || ""}
                                  onChange={(e) => handleCustomFieldChange(item.postId, "customFinish", e.target.value)}
                                  className="h-7 w-full px-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-primary focus:border-primary"
                                >
                                  <option value="">Select finish</option>
                                  {finishOptions.map((option) => (
                                    <option key={option} value={option}>
                                      {option}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <p className="text-xs font-medium text-gray-900">
                                  {item.customFinish || "Not specified"}
                                </p>
                              )}
                            </div>

                            <div className="space-y-1">
                              <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                                Thickness
                              </label>
                              {isEditing ? (
                                <Input
                                  type="text"
                                  value={currentCustomFields.customThickness || ""}
                                  onChange={(e) =>
                                    handleCustomFieldChange(item.postId, "customThickness", e.target.value)
                                  }
                                  className="h-7 text-xs"
                                  placeholder="mm"
                                />
                              ) : (
                                <p className="text-xs font-medium text-gray-900">
                                  {item.customThickness ? `${item.customThickness} mm` : "Not specified"}
                                </p>
                              )}
                            </div>
                          </div>

                          {isEditing && (
                            <div className="flex gap-2 mt-2 pt-2 border-t border-gray-200">
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => saveCustomFields(item.postId)}
                                className="h-6 text-xs px-2"
                              >
                                Save
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setEditingCustomFields((prev) => {
                                    const newState = { ...prev }
                                    delete newState[item.postId]
                                    return newState
                                  })
                                }
                                className="h-6 text-xs px-2"
                              >
                                Cancel
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden sticky top-4">
              <div className="p-3 bg-muted/20 border-b">
                <h2 className="font-medium">Order Summary</h2>
              </div>
              <div className="p-3">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Subtotal</span>
                    <span className="text-sm font-medium">₹{calculateTotal().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Shipping</span>
                    <span className="text-sm">Calculated at checkout</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Tax</span>
                    <span className="text-sm">Calculated at checkout</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span className="text-primary">₹{calculateTotal().toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleCheckout}
                  className="w-full mt-4 bg-primary hover:bg-primary/90 py-2 h-auto text-sm"
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

                <div className="mt-3 text-center">
                  <Link
                    href={`/client-dashboard/${clientId}/products`}
                    className="text-primary hover:underline font-medium text-xs"
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
