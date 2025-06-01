"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Trash2, Loader2, ShoppingBag, Calculator, Package, Shield, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

interface CartItem {
  _id: string
  name: string
  price: number
  basePrice?: number
  updatedPrice?: number
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

interface AdditionalCharges {
  loadingFee: number
  woodPackaging: number
  insurance: number
  transportAdvance: number
  gstRate: number
  gstAmount: number
}

interface CartData {
  items: CartItem[]
  additionalCharges: AdditionalCharges
  subtotal: number
  totalAmount: number
}

const WOOD_PACKAGING_OPTIONS = [
  { value: 0, label: "None", description: "No wood packaging" },
  { value: 1500, label: "Basic", description: "Basic protection" },
  { value: 2500, label: "Standard", description: "Standard protection" },
  { value: 3500, label: "Premium", description: "Premium protection" },
  { value: 4500, label: "Deluxe", description: "Maximum protection" },
]

const GST_OPTIONS = [
  { value: 18, label: "18%", description: "Standard items" },
  { value: 12, label: "12%", description: "Block items" },
]

export default function CartPage() {
  const router = useRouter()
  const params = useParams()
  const clientId = params.clientId as string
  const { toast } = useToast()

  const [cartData, setCartData] = useState<CartData | null>(null)
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<Record<string, boolean>>({})
  const [updating, setUpdating] = useState<Record<string, boolean>>({})
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [updatingCharges, setUpdatingCharges] = useState(false)

  // Local state for additional charges
  const [localCharges, setLocalCharges] = useState<AdditionalCharges>({
    loadingFee: 1000,
    woodPackaging: 0,
    insurance: 0,
    transportAdvance: 15000,
    gstRate: 18,
    gstAmount: 0,
  })

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

  // Calculate insurance based on amount
  const calculateInsurance = useCallback((amount: number) => {
    const amountInLakhs = amount / 100000
    return Math.ceil(amountInLakhs * 345)
  }, [])

  // Calculate totals in real-time
  const calculateTotals = useCallback(
    (items: CartItem[], charges: AdditionalCharges) => {
      const itemsTotal = items.reduce((total, item) => {
        const displayPrice = item.updatedPrice || item.price
        return total + displayPrice * item.quantity
      }, 0)

      const insurance = calculateInsurance(itemsTotal)
      const subtotalBeforeGST =
        itemsTotal + charges.loadingFee + charges.woodPackaging + insurance + charges.transportAdvance
      const gstAmount = Math.round((subtotalBeforeGST * charges.gstRate) / 100)
      const totalAmount = subtotalBeforeGST + gstAmount

      return {
        itemsTotal,
        insurance,
        subtotalBeforeGST,
        gstAmount,
        totalAmount,
      }
    },
    [calculateInsurance],
  )

  // Debounced function to update charges on backend
  const debouncedUpdateCharges = useCallback(
    debounce(async (charges: AdditionalCharges) => {
      try {
        setUpdatingCharges(true)
        const token = getToken()
        if (!token) return

        const apiUrl = getApiUrl()
        const response = await fetch(`${apiUrl}/api/updateCartAdditionalCharges`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            loadingFee: charges.loadingFee,
            woodPackaging: charges.woodPackaging,
            transportAdvance: charges.transportAdvance,
            gstRate: charges.gstRate,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            // Update cart data with response
            if (cartData) {
              const calculations = calculateTotals(cartData.items, charges)
              setCartData({
                ...cartData,
                additionalCharges: {
                  ...charges,
                  insurance: calculations.insurance,
                  gstAmount: calculations.gstAmount,
                },
                subtotal: calculations.subtotalBeforeGST,
                totalAmount: calculations.totalAmount,
              })
            }
          }
        }
      } catch (error) {
        console.error("Error updating charges:", error)
        toast({
          title: "Error",
          description: "Failed to update additional charges",
          variant: "destructive",
        })
      } finally {
        setUpdatingCharges(false)
      }
    }, 1000),
    [cartData, calculateTotals, toast],
  )

  // Update local charges and trigger backend update
  const updateCharges = (newCharges: Partial<AdditionalCharges>) => {
    const updatedCharges = { ...localCharges, ...newCharges }
    setLocalCharges(updatedCharges)

    if (cartData) {
      const calculations = calculateTotals(cartData.items, updatedCharges)
      const finalCharges = {
        ...updatedCharges,
        insurance: calculations.insurance,
        gstAmount: calculations.gstAmount,
      }

      // Update local display immediately
      setCartData({
        ...cartData,
        additionalCharges: finalCharges,
        subtotal: calculations.subtotalBeforeGST,
        totalAmount: calculations.totalAmount,
      })

      // Debounced backend update
      debouncedUpdateCharges(finalCharges)
    }
  }

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

        // Set cart data with additional charges if available
        const charges = data.data.additionalCharges || {
          loadingFee: 1000,
          woodPackaging: 0,
          insurance: 0,
          transportAdvance: 15000,
          gstRate: 18,
          gstAmount: 0,
        }

        setLocalCharges(charges)

        const calculations = calculateTotals(validItems, charges)

        setCartData({
          items: validItems,
          additionalCharges: {
            ...charges,
            insurance: calculations.insurance,
            gstAmount: calculations.gstAmount,
          },
          subtotal: calculations.subtotalBeforeGST,
          totalAmount: calculations.totalAmount,
        })
      } else {
        setCartData({
          items: [],
          additionalCharges: localCharges,
          subtotal: 0,
          totalAmount: 0,
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load your cart. Please try again.",
        variant: "destructive",
      })
      setCartData({
        items: [],
        additionalCharges: localCharges,
        subtotal: 0,
        totalAmount: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCustomFieldChange = (itemId: string, field: string, value: string | number) => {
    setEditingCustomFields((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
      },
    }))

    if (field === "customQuantity" && typeof value === "number" && value > 0 && cartData) {
      const updatedItems = cartData.items.map((item) => {
        if (item.postId === itemId) {
          return { ...item, quantity: value }
        }
        return item
      })

      const calculations = calculateTotals(updatedItems, cartData.additionalCharges)
      setCartData({
        ...cartData,
        items: updatedItems,
        additionalCharges: {
          ...cartData.additionalCharges,
          insurance: calculations.insurance,
          gstAmount: calculations.gstAmount,
        },
        subtotal: calculations.subtotalBeforeGST,
        totalAmount: calculations.totalAmount,
      })
    }
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
        if (data.success && cartData) {
          const updatedItems = cartData.items.map((item) => {
            if (item.postId === productId) {
              return {
                ...item,
                customQuantity: customFields.customQuantity,
                customFinish: customFields.customFinish,
                customThickness: customFields.customThickness,
                quantity: customFields.customQuantity || item.quantity,
              }
            }
            return item
          })

          const calculations = calculateTotals(updatedItems, cartData.additionalCharges)
          setCartData({
            ...cartData,
            items: updatedItems,
            additionalCharges: {
              ...cartData.additionalCharges,
              insurance: calculations.insurance,
              gstAmount: calculations.gstAmount,
            },
            subtotal: calculations.subtotalBeforeGST,
            totalAmount: calculations.totalAmount,
          })

          setEditingCustomFields((prev) => {
            const newState = { ...prev }
            delete newState[productId]
            return newState
          })

          toast({
            title: "Custom fields updated",
            description: "Your custom specifications have been saved and quantity synced",
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

  const updateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity < 1 || !cartData) return

    try {
      setUpdating((prev) => ({ ...prev, [productId]: true }))
      const token = getToken()

      if (!token) return

      const apiUrl = getApiUrl()

      const currentItem = cartData.items.find((item) => item.postId === productId)
      if (!currentItem) return

      await fetch(`${apiUrl}/api/deleteUserCartItem`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId }),
      })

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

      const updatedItems = cartData.items.map((item) =>
        item.postId === productId ? { ...item, quantity: newQuantity } : item,
      )

      const calculations = calculateTotals(updatedItems, cartData.additionalCharges)
      setCartData({
        ...cartData,
        items: updatedItems,
        additionalCharges: {
          ...cartData.additionalCharges,
          insurance: calculations.insurance,
          gstAmount: calculations.gstAmount,
        },
        subtotal: calculations.subtotalBeforeGST,
        totalAmount: calculations.totalAmount,
      })

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

      if (!token || !cartData) return

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
        const updatedItems = cartData.items.filter((item) => item.postId !== productId)
        const calculations = calculateTotals(updatedItems, cartData.additionalCharges)

        setCartData({
          ...cartData,
          items: updatedItems,
          additionalCharges: {
            ...cartData.additionalCharges,
            insurance: calculations.insurance,
            gstAmount: calculations.gstAmount,
          },
          subtotal: calculations.subtotalBeforeGST,
          totalAmount: calculations.totalAmount,
        })

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

  const handleCheckout = async () => {
    try {
      setIsCheckingOut(true)
      setCheckoutError(null)

      if (!cartData || cartData.items.length === 0) {
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
        setCartData({
          items: [],
          additionalCharges: localCharges,
          subtotal: 0,
          totalAmount: 0,
        })
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
        body: JSON.stringify({}),
      })

      if (!response.ok) {
        throw new Error("Failed to clear cart")
      }

      setCartData({
        items: [],
        additionalCharges: localCharges,
        subtotal: 0,
        totalAmount: 0,
      })
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

  if (!cartData) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <p className="text-muted-foreground">Failed to load cart data</p>
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

        {cartData.items.length > 0 && (
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

      {cartData.items.length === 0 ? (
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
          <div className="lg:col-span-2 space-y-4">
            {/* Cart Items */}
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
              <div className="p-3 bg-muted/20 border-b">
                <h2 className="font-medium">Cart Items ({cartData.items.length})</h2>
              </div>
              <div className="divide-y">
                {cartData.items.map((item) => {
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
                      <div className="flex items-center gap-3">
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

                        <div className="flex-grow min-w-0">
                          <Link href={`/client-dashboard/${clientId}/product/${item.postId}`} className="block group">
                            <h3 className="font-medium text-sm text-gray-900 group-hover:text-primary transition-colors duration-200 cursor-pointer line-clamp-1">
                              {item.name}
                            </h3>
                          </Link>
                          <p className="text-xs text-gray-500 mt-0.5">{item.category}</p>

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

            {/* Additional Charges Section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Additional Charges
                  {updatingCharges && <Loader2 className="h-4 w-4 animate-spin" />}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Loading Fee */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">Loading Fee</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">₹</span>
                    <Input
                      type="number"
                      min="0"
                      value={localCharges.loadingFee}
                      onChange={(e) => updateCharges({ loadingFee: Number(e.target.value) || 0 })}
                      className="w-32"
                      placeholder="1000"
                    />
                  </div>
                </div>

                {/* Wood Packaging */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">Wood Packaging</Label>
                  </div>
                  <RadioGroup
                    value={localCharges.woodPackaging.toString()}
                    onValueChange={(value) => updateCharges({ woodPackaging: Number(value) })}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
                  >
                    {WOOD_PACKAGING_OPTIONS.map((option) => (
                      <div
                        key={option.value}
                        className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-muted/50"
                      >
                        <RadioGroupItem value={option.value.toString()} id={`wood-${option.value}`} />
                        <Label htmlFor={`wood-${option.value}`} className="flex-1 cursor-pointer">
                          <div className="font-medium">{option.label}</div>
                          <div className="text-sm text-muted-foreground">{option.description}</div>
                          <div className="text-sm font-medium text-primary">₹{option.value.toLocaleString()}</div>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Insurance */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">Insurance</Label>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">₹345 per lakh of billing amount</span>
                      <span className="font-medium">₹{cartData.additionalCharges.insurance.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Transport Advance */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">Transport Advance</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">₹</span>
                    <Input
                      type="number"
                      min="0"
                      value={localCharges.transportAdvance}
                      onChange={(e) => updateCharges({ transportAdvance: Number(e.target.value) || 0 })}
                      className="w-32"
                      placeholder="15000"
                    />
                  </div>
                </div>

                {/* GST Rate */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">GST Rate</Label>
                  <RadioGroup
                    value={localCharges.gstRate.toString()}
                    onValueChange={(value) => updateCharges({ gstRate: Number(value) })}
                    className="flex gap-4"
                  >
                    {GST_OPTIONS.map((option) => (
                      <div
                        key={option.value}
                        className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-muted/50"
                      >
                        <RadioGroupItem value={option.value.toString()} id={`gst-${option.value}`} />
                        <Label htmlFor={`gst-${option.value}`} className="cursor-pointer">
                          <div className="font-medium">{option.label}</div>
                          <div className="text-sm text-muted-foreground">{option.description}</div>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Items Subtotal</span>
                    <span>
                      ₹
                      {(
                        cartData.subtotal -
                        cartData.additionalCharges.loadingFee -
                        cartData.additionalCharges.woodPackaging -
                        cartData.additionalCharges.insurance -
                        cartData.additionalCharges.transportAdvance
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Loading Fee</span>
                    <span>₹{cartData.additionalCharges.loadingFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Wood Packaging</span>
                    <span>₹{cartData.additionalCharges.woodPackaging.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Insurance</span>
                    <span>₹{cartData.additionalCharges.insurance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Transport Advance</span>
                    <span>₹{cartData.additionalCharges.transportAdvance.toLocaleString()}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal before GST</span>
                  <span className="font-medium">₹{cartData.subtotal.toLocaleString()}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">GST ({cartData.additionalCharges.gstRate}%)</span>
                  <span>₹{cartData.additionalCharges.gstAmount.toLocaleString()}</span>
                </div>

                <Separator />

                <div className="flex justify-between font-semibold text-lg">
                  <span>Total Amount</span>
                  <span className="text-primary">₹{cartData.totalAmount.toLocaleString()}</span>
                </div>

                <Button
                  onClick={handleCheckout}
                  className="w-full mt-4 bg-primary hover:bg-primary/90 py-2 h-auto text-sm"
                  disabled={isCheckingOut || cartData.items.length === 0}
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
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout
  return ((...args: any[]) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }) as T
}
