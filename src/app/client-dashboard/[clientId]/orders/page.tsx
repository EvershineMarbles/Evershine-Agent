"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Loader2, Package, FileText, RefreshCw } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

// Define interfaces for type safety
interface OrderItem {
  name: string
  category: string
  price: number
  basePrice?: number
  updatedPrice?: number // Backend calculated price
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

interface ShippingAddress {
  street?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
}

interface Order {
  orderId: string
  items: OrderItem[]
  totalAmount: number
  status: string
  paymentStatus: string
  createdAt: string
  shippingAddress?: ShippingAddress
}

export default function OrdersPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const clientId = params.clientId as string

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

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
        setError("No authentication token found. Please log in again.")
        return null
      }
      return token
    } catch (e) {
      setError("Error accessing authentication. Please refresh the page.")
      return null
    }
  }

  // Fetch orders
  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = getToken()
      if (!token) {
        setLoading(false)
        return
      }

      const apiUrl = getApiUrl()
      console.log("Fetching orders with token:", token.substring(0, 15) + "...")

      // Keep the same API endpoint as requested
      const response = await fetch(`${apiUrl}/api/clients/${clientId}/orders`, {
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
      console.log("ORDERS - Full API response:", data)

      // Your backend returns { message, data } format
      if (data && Array.isArray(data.data)) {
        console.log("ORDERS - Orders data:", data.data)
        setOrders(data.data)
      } else {
        // If data.data is not an array, check if the response itself is an array
        if (Array.isArray(data)) {
          console.log("ORDERS - Orders data (direct array):", data)
          setOrders(data)
        } else {
          console.warn("ORDERS - Unexpected response format:", data)
          setOrders([])
        }
      }
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load orders. Please try again."
      console.error("Error fetching orders:", error)
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Initialize data on component mount
  useEffect(() => {
    fetchOrders()
  }, [clientId, toast])

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Calculate order total using backend prices
  const calculateOrderTotal = (order: Order) => {
    // If backend provides totalAmount, use it
    if (order.totalAmount) {
      return order.totalAmount
    }

    // Otherwise calculate from backend prices (updatedPrice or price)
    return order.items.reduce((total, item) => {
      const displayPrice = item.updatedPrice || item.price
      return total + displayPrice * item.quantity
    }, 0)
  }

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true)
    fetchOrders()
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading orders...</p>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Go back</span>
          </Button>
          <h1 className="text-3xl font-bold">Your Current Order</h1>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          disabled={refreshing}
          className="relative"
          aria-label="Refresh orders"
        >
          <RefreshCw className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4 text-red-800">
            <p>{error}</p>
            <Button
              variant="outline"
              className="mt-2 border-red-300 text-red-800 hover:bg-red-100"
              onClick={() => fetchOrders()}
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {orders.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="pt-6">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-medium mb-4">No orders found</h2>
            <p className="text-muted-foreground mb-6">You haven&apos;t placed any orders yet</p>
            <Button
              onClick={() => router.push(`/client-dashboard/${clientId}/products`)}
              className="bg-primary hover:bg-primary/90"
            >
              Browse Products
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Display only the most recent order */}
          {(() => {
            // Sort orders by date (newest first) and take the first one
            const sortedOrders = [...orders].sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
            )
            const currentOrder = sortedOrders[0]

            return (
              <Card key={currentOrder.orderId} className="overflow-hidden">
                <CardHeader className="bg-muted/20 pb-3">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                    <CardTitle className="text-lg">Order #{currentOrder.orderId}</CardTitle>
                    <div className="flex flex-wrap gap-2 text-sm">
                      <span className="text-muted-foreground">Placed on {formatDate(currentOrder.createdAt)}</span>
                      <span className="mx-2 text-muted-foreground hidden md:inline">•</span>
                      <Badge
                        variant={
                          currentOrder.status === "delivered"
                            ? "success"
                            : currentOrder.status === "shipped"
                              ? "info"
                              : currentOrder.status === "processing"
                                ? "warning"
                                : currentOrder.status === "cancelled"
                                  ? "destructive"
                                  : "outline"
                        }
                      >
                        {currentOrder.status.charAt(0).toUpperCase() + currentOrder.status.slice(1)}
                      </Badge>
                      <Badge
                        variant={
                          currentOrder.paymentStatus === "paid"
                            ? "success"
                            : currentOrder.paymentStatus === "failed"
                              ? "destructive"
                              : "warning"
                        }
                      >
                        Payment:{" "}
                        {currentOrder.paymentStatus.charAt(0).toUpperCase() + currentOrder.paymentStatus.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <h3 className="font-medium mb-2">Items</h3>
                      <div className="space-y-2">
                        {currentOrder.items.map((item, index) => {
                          // Use backend calculated price (updatedPrice) or fallback to price
                          const displayPrice = item.updatedPrice || item.price
                          const hasCommission = item.updatedPrice && item.updatedPrice !== item.price
                          const originalPrice = item.basePrice || item.price

                          return (
                            <div key={index} className="flex justify-between border-b pb-2">
                              <div>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-sm text-muted-foreground">{item.category}</p>
                                {/* Custom specifications - same as cart page */}
                                {(item.customQuantity || item.customFinish || item.customThickness) && (
                                  <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                                    {item.customQuantity && <div>Qty: {item.customQuantity} sqft</div>}
                                    {item.customFinish && <div>Finish: {item.customFinish}</div>}
                                    {item.customThickness && <div>Thickness: {item.customThickness} mm</div>}
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                {hasCommission ? (
                                  <div className="space-y-1">
                                    <p className="text-green-600 font-medium">
                                      ₹
                                      {displayPrice.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}{" "}
                                      × {item.quantity}
                                    </p>
                                    <p className="text-xs text-gray-500 line-through">
                                      Base: ₹{originalPrice.toLocaleString()}
                                    </p>
                                    <p className="font-medium text-green-600">
                                      ₹
                                      {(displayPrice * item.quantity).toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}
                                    </p>
                                    {item.commissionInfo && (
                                      <p className="text-xs text-gray-600">
                                        +{item.commissionInfo.totalCommission}% commission
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <div>
                                    <p>
                                      ₹
                                      {displayPrice.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}{" "}
                                      × {item.quantity}
                                    </p>
                                    <p className="font-medium">
                                      ₹
                                      {(displayPrice * item.quantity).toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      <div className="flex justify-between mt-4 pt-2 font-bold">
                        <span>Total</span>
                        <span>
                          ₹
                          {calculateOrderTotal(currentOrder).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium mb-2">Shipping Address</h3>
                      {currentOrder.shippingAddress ? (
                        <div className="text-sm">
                          <p>{currentOrder.shippingAddress.street}</p>
                          <p>
                            {currentOrder.shippingAddress.city}, {currentOrder.shippingAddress.state}{" "}
                            {currentOrder.shippingAddress.postalCode}
                          </p>
                          <p>{currentOrder.shippingAddress.country}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No shipping address provided</p>
                      )}

                      <div className="mt-4">
                        <Button
                          variant="outline"
                          className="w-full mt-2"
                          size="sm"
                          onClick={() => router.push(`/client-dashboard/${clientId}/orders/${currentOrder.orderId}`)}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          View Invoice
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })()}
        </div>
      )}
    </div>
  )
}
