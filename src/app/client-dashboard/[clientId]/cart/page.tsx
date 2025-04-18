"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Trash2, Loader2, ShoppingBag, Plus, Minus, Bug, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getCartItemQuantity } from "@/lib/cart-service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

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

  // Debug state
  const [showDebug, setShowDebug] = useState(true)
  const [apiResponse, setApiResponse] = useState<any>(null)
  const [localStorageData, setLocalStorageData] = useState<any>(null)
  const [debugLog, setDebugLog] = useState<string[]>([])

  // Add to debug log
  const addToLog = (message: string) => {
    console.log(message)
    setDebugLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
  }

  // Update local storage debug data
  const updateLocalStorageDebug = () => {
    try {
      const cart = localStorage.getItem("cart")
      const cartQuantities = localStorage.getItem("cartQuantities")

      setLocalStorageData({
        cart: cart ? JSON.parse(cart) : null,
        cartQuantities: cartQuantities ? JSON.parse(cartQuantities) : null,
      })

      addToLog(`LocalStorage updated: Cart has ${cart ? JSON.parse(cart).length : 0} items`)
    } catch (e) {
      addToLog(`Error reading localStorage: ${e}`)
    }
  }

  // Fetch cart items
  useEffect(() => {
    const fetchCart = async () => {
      try {
        setLoading(true)
        addToLog("Fetching cart data from API...")

        // Get the token
        const token = localStorage.getItem("clientImpersonationToken")

        if (!token) {
          addToLog("No authentication token found")
          throw new Error("No authentication token found. Please refresh the page and try again.")
        }

        addToLog(`Using token: ${token.substring(0, 10)}...`)
        const response = await fetch("https://evershinebackend-2.onrender.com/api/getUserCart", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        addToLog(`API response status: ${response.status}`)

        // Check for errors
        if (!response.ok) {
          if (response.status === 401) {
            addToLog("Authentication failed (401)")
            throw new Error("Authentication failed. Please refresh the token and try again.")
          } else {
            addToLog(`API error: ${response.status} ${response.statusText}`)
            throw new Error(`API error: ${response.status} ${response.statusText}`)
          }
        }

        const data = await response.json()
        addToLog(`API response received: ${JSON.stringify(data).substring(0, 100)}...`)

        // Store the full API response for debugging
        setApiResponse(data)

        if (data.data) {
          // Filter out any items with null or undefined postId
          const validItems = (data.data.items || []).filter(
            (item: CartItem) => item.postId && typeof item.postId === "string",
          )

          addToLog(`Valid items from API: ${validItems.length}`)

          if (validItems.length < (data.data.items || []).length) {
            addToLog(`WARNING: Filtered out ${(data.data.items || []).length - validItems.length} invalid items`)
          }

          // Apply quantities from localStorage
          const itemsWithQuantities = validItems.map((item: CartItem) => {
            // Get quantity from localStorage or use the one from API
            const storedQuantity = getCartItemQuantity(item.postId)
            addToLog(`Item ${item.postId}: API quantity=${item.quantity}, localStorage quantity=${storedQuantity}`)
            return {
              ...item,
              quantity: storedQuantity || item.quantity,
            }
          })

          setCartItems(itemsWithQuantities)

          // Update localStorage cart to match server
          const cartIds = validItems.map((item: CartItem) => item.postId)
          localStorage.setItem("cart", JSON.stringify(cartIds))
          addToLog(`Updated localStorage cart with ${cartIds.length} items`)

          // Update debug info
          updateLocalStorageDebug()
        } else {
          addToLog("No cart data in API response, setting empty cart")
          setCartItems([])
          // Clear localStorage cart
          localStorage.removeItem("cart")
          localStorage.removeItem("cartQuantities")
          addToLog("Cleared localStorage cart data")
          updateLocalStorageDebug()
        }
      } catch (error: any) {
        console.error("Error fetching cart:", error)
        addToLog(`Error: ${error.message}`)
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

    fetchCart()
    updateLocalStorageDebug()
  }, [toast])

  // Update item quantity
  const updateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return

    try {
      setUpdating((prev) => ({ ...prev, [productId]: true }))
      addToLog(`Updating quantity for ${productId} to ${newQuantity}`)

      // Get the token
      const token = localStorage.getItem("clientImpersonationToken")

      if (!token) {
        throw new Error("No authentication token found. Please refresh the page and try again.")
      }

      // First remove the item
      addToLog(`Removing item ${productId} before updating quantity`)
      const removeResponse = await fetch("https://evershinebackend-2.onrender.com/api/deleteUserCartItem", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId }),
      })

      if (!removeResponse.ok) {
        addToLog(`Failed to remove item: ${removeResponse.status}`)
        throw new Error(`Failed to update quantity: ${removeResponse.status}`)
      }

      // Then add it back with the new quantity
      addToLog(`Adding item ${productId} back with quantity ${newQuantity}`)
      const addResponse = await fetch("https://evershinebackend-2.onrender.com/api/addToCart", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          quantity: newQuantity, // Add quantity parameter
        }),
      })

      if (!addResponse.ok) {
        addToLog(`Failed to add item back: ${addResponse.status}`)
        throw new Error(`Failed to update quantity: ${addResponse.status}`)
      }

      // Update local storage quantity
      try {
        const savedCartQuantities = localStorage.getItem("cartQuantities")
        const cartQuantities = savedCartQuantities ? JSON.parse(savedCartQuantities) : {}
        cartQuantities[productId] = newQuantity
        localStorage.setItem("cartQuantities", JSON.stringify(cartQuantities))
        addToLog(`Updated localStorage quantity for ${productId} to ${newQuantity}`)
      } catch (e) {
        console.error("Error updating cart quantities:", e)
        addToLog(`Error updating localStorage quantities: ${e}`)
      }

      // Update local state
      setCartItems((prev) =>
        prev.map((item) => (item.postId === productId ? { ...item, quantity: newQuantity } : item)),
      )

      updateLocalStorageDebug()

      toast({
        title: "Quantity Updated",
        description: "Item quantity has been updated",
        variant: "default",
      })
    } catch (error: any) {
      console.error("Error updating quantity:", error)
      addToLog(`Error updating quantity: ${error.message}`)
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
      addToLog(`Removing item ${productId} from cart`)

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

      // Check for errors
      if (!response.ok) {
        addToLog(`API error removing item: ${response.status}`)
        if (response.status === 401) {
          throw new Error("Authentication failed. Please refresh the token and try again.")
        } else {
          throw new Error(`API error: ${response.status} ${response.statusText}`)
        }
      }

      const data = await response.json()
      addToLog(`Remove API response: ${JSON.stringify(data).substring(0, 100)}...`)

      if (data.success) {
        setCartItems((prev) => prev.filter((item) => item.postId !== productId))

        // Update localStorage cart
        if (typeof window !== "undefined") {
          const savedCart = localStorage.getItem("cart")
          if (savedCart) {
            const cartArray = JSON.parse(savedCart)
            localStorage.setItem("cart", JSON.stringify(cartArray.filter((id: string) => id !== productId)))
            addToLog(`Updated localStorage cart after removal`)
          }

          // Also remove from cartQuantities
          const savedCartQuantities = localStorage.getItem("cartQuantities")
          if (savedCartQuantities) {
            const cartQuantities = JSON.parse(savedCartQuantities)
            delete cartQuantities[productId]
            localStorage.setItem("cartQuantities", JSON.stringify(cartQuantities))
            addToLog(`Removed item from localStorage quantities`)
          }
        }

        updateLocalStorageDebug()

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
      addToLog(`Error removing item: ${error.message}`)
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
      addToLog("Starting checkout process")

      // Validate cart has items
      if (cartItems.length === 0) {
        throw new Error("Your cart is empty. Please add items before checking out.")
      }

      // Check for any items with null or undefined postId
      const invalidItems = cartItems.filter((item) => !item.postId || typeof item.postId !== "string")
      if (invalidItems.length > 0) {
        addToLog(`Found ${invalidItems.length} invalid items in cart`)
        throw new Error("Some items in your cart are invalid. Please remove them and try again.")
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

      addToLog(`Sending checkout request with payload: ${JSON.stringify(payload)}`)

      // Make API request to create order
      const response = await fetch("https://evershinebackend-2.onrender.com/api/createOrder", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      addToLog(`Checkout API response status: ${response.status}`)

      // Get response text first to handle both JSON and non-JSON responses
      const responseText = await response.text()
      addToLog(`Checkout API response text: ${responseText.substring(0, 100)}...`)

      let data
      try {
        // Try to parse as JSON
        data = JSON.parse(responseText)
        addToLog(`Parsed checkout response as JSON: ${JSON.stringify(data).substring(0, 100)}...`)
      } catch (e) {
        // Not JSON, handle as text
        addToLog(`Failed to parse checkout response as JSON: ${e}`)
      }

      // Special case: If we get a 500 error but the order might have been created
      if (response.status === 500) {
        addToLog("Got 500 error, checking if order was created anyway")
        try {
          // Wait a moment to ensure any database operations complete
          await new Promise((resolve) => setTimeout(resolve, 1500))

          // Fetch the cart again to see if it was cleared by the server
          addToLog("Checking cart status after 500 error")
          const cartCheckResponse = await fetch("https://evershinebackend-2.onrender.com/api/getUserCart", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          })

          if (cartCheckResponse.ok) {
            const cartData = await cartCheckResponse.json()
            addToLog(`Cart check response: ${JSON.stringify(cartData).substring(0, 100)}...`)

            // If the cart is now empty, the order probably succeeded despite the error
            if (cartData.data && (!cartData.data.items || cartData.data.items.length === 0)) {
              addToLog("Cart is empty after 500 error, assuming order succeeded")
              // Clear local cart state
              setCartItems([])

              // Clear localStorage cart
              localStorage.removeItem("cart")
              localStorage.removeItem("cartQuantities")
              addToLog("Cleared localStorage cart data")
              updateLocalStorageDebug()

              // Redirect directly to orders page
              router.push(`/client-dashboard/${clientId}/orders`)
              return
            }
          }
        } catch (cartCheckError: any) {
          // Handle error silently
          addToLog(`Error checking cart after 500: ${cartCheckError}`)
        }

        // If we get here, the cart check didn't confirm success
        throw new Error("Server error occurred. The order may or may not have been placed. Please check your orders.")
      }

      // Normal error handling for non-500 errors
      if (!response.ok) {
        try {
          if (data && data.message) {
            throw new Error(data.message)
          } else {
            throw new Error(`API error: ${response.status} ${response.statusText}`)
          }
        } catch (e) {
          throw new Error(`API error: ${response.status} ${response.statusText}`)
        }
      }

      // If we have data and it indicates success
      if (data && data.success) {
        addToLog("Checkout successful, clearing cart")
        // Clear cart items from state
        setCartItems([])

        // Clear localStorage cart
        localStorage.removeItem("cart")
        localStorage.removeItem("cartQuantities")
        addToLog("Cleared localStorage cart data")
        updateLocalStorageDebug()

        // Redirect directly to orders page
        router.push(`/client-dashboard/${clientId}/orders`)
      } else if (data) {
        // We have data but success is false
        addToLog(`Checkout failed with message: ${data.message}`)
        throw new Error(data.message || "Failed to place order")
      } else {
        // No parseable data
        addToLog("Received invalid response from server")
        throw new Error("Received an invalid response from the server")
      }
    } catch (error: any) {
      console.error("Error during checkout:", error)
      addToLog(`Checkout error: ${error.message}`)
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

  // Add a new function to manually clear the cart
  const handleClearCart = async () => {
    try {
      // Show loading state
      setLoading(true)
      addToLog("Manually clearing cart")

      // Clear cart on server
      const token = localStorage.getItem("clientImpersonationToken")
      if (token) {
        // Try to clear each item individually if there's no clear cart endpoint
        addToLog(`Removing ${cartItems.length} items from server cart`)
        for (const item of cartItems) {
          try {
            const response = await fetch("https://evershinebackend-2.onrender.com/api/deleteUserCartItem", {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ productId: item.postId }),
            })

            if (response.ok) {
              addToLog(`Successfully removed item ${item.postId} from server`)
            } else {
              addToLog(`Failed to remove item ${item.postId}: ${response.status}`)
            }
          } catch (e) {
            console.error("Error removing item:", e)
            addToLog(`Error removing item ${item.postId}: ${e}`)
          }
        }
      }

      // Clear local cart data
      localStorage.removeItem("cart")
      localStorage.removeItem("cartQuantities")
      addToLog("Cleared localStorage cart data")
      updateLocalStorageDebug()

      // Update UI
      setCartItems([])

      toast({
        title: "Cart Cleared",
        description: "All items have been removed from your cart",
        variant: "default",
      })
    } catch (error: any) {
      console.error("Error clearing cart:", error)
      addToLog(`Error clearing cart: ${error.message}`)
      toast({
        title: "Error",
        description: error.message || "Failed to clear cart. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Add a function to refresh the cart
  const handleRefreshCart = async () => {
    setLoading(true)
    addToLog("Manually refreshing cart")

    try {
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

      addToLog(`Refresh API response status: ${response.status}`)

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      addToLog(`Refresh API response: ${JSON.stringify(data).substring(0, 100)}...`)

      // Store the full API response for debugging
      setApiResponse(data)

      if (data.data) {
        // Filter out any items with null or undefined postId
        const validItems = (data.data.items || []).filter(
          (item: CartItem) => item.postId && typeof item.postId === "string",
        )

        addToLog(`Valid items from refresh: ${validItems.length}`)

        // Apply quantities from localStorage
        const itemsWithQuantities = validItems.map((item: CartItem) => {
          // Get quantity from localStorage or use the one from API
          const storedQuantity = getCartItemQuantity(item.postId)
          return {
            ...item,
            quantity: storedQuantity || item.quantity,
          }
        })

        setCartItems(itemsWithQuantities)

        // Update localStorage cart to match server
        const cartIds = validItems.map((item: CartItem) => item.postId)
        localStorage.setItem("cart", JSON.stringify(cartIds))
        addToLog(`Updated localStorage cart with ${cartIds.length} items`)

        // Update debug info
        updateLocalStorageDebug()
      } else {
        addToLog("No cart data in refresh response, setting empty cart")
        setCartItems([])
        // Clear localStorage cart
        localStorage.removeItem("cart")
        localStorage.removeItem("cartQuantities")
        addToLog("Cleared localStorage cart data")
        updateLocalStorageDebug()
      }

      toast({
        title: "Cart Refreshed",
        description: "Your cart has been refreshed",
        variant: "default",
      })
    } catch (error: any) {
      console.error("Error refreshing cart:", error)
      addToLog(`Error refreshing cart: ${error.message}`)
      toast({
        title: "Error",
        description: error.message || "Failed to refresh cart. Please try again.",
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

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefreshCart} className="flex items-center gap-1" disabled={loading}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>

          <Button variant="outline" onClick={() => setShowDebug(!showDebug)} className="flex items-center gap-1">
            <Bug className="h-4 w-4" />
            {showDebug ? "Hide Debug" : "Show Debug"}
          </Button>

          {cartItems.length > 0 && (
            <Button
              variant="outline"
              onClick={handleClearCart}
              className="text-red-500 border-red-200 hover:bg-red-50"
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Clear Cart
            </Button>
          )}
        </div>
      </div>

      {showDebug && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm">Debug Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div>
              <h3 className="font-bold mb-1">API Response:</h3>
              <Textarea
                readOnly
                value={apiResponse ? JSON.stringify(apiResponse, null, 2) : "No data"}
                className="h-32 font-mono"
              />
            </div>

            <div>
              <h3 className="font-bold mb-1">LocalStorage Data:</h3>
              <Textarea
                readOnly
                value={localStorageData ? JSON.stringify(localStorageData, null, 2) : "No data"}
                className="h-32 font-mono"
              />
            </div>

            <div>
              <h3 className="font-bold mb-1">Debug Log:</h3>
              <Textarea readOnly value={debugLog.join("\n")} className="h-32 font-mono" />
            </div>
          </CardContent>
        </Card>
      )}

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
                            {removing[item.postId] || updating[item.postId] ? (
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
