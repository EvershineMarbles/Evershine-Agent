"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Loader2, Package, FileText, RefreshCw } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"

// Define interfaces for type safety
interface OrderItem {
  name: string
  category: string
  price: number
  basePrice?: number
  quantity: number
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

// Add the CommissionData interface from wishlist page
interface CommissionData {
  agentId: string
  name: string
  email: string
  commissionRate: number
  categoryCommissions?: Record<string, number>
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

  // Add commission-related state from wishlist page
  const [commissionData, setCommissionData] = useState<CommissionData | null>(null)
  const [overrideCommissionRate, setOverrideCommissionRate] = useState<number | null>(null)

  // Add a state to store calculated prices for each order
  const [orderPrices, setOrderPrices] = useState<Record<string, Record<string, number>>>({})

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

  // Add fetchCommissionData function from wishlist page
  const fetchCommissionData = async () => {
    try {
      const token = getToken()
      if (!token) return null

      const apiUrl = getApiUrl()
      const response = await fetch(`${apiUrl}/api/client/agent-commission`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        console.error("Failed to fetch commission data:", response.status)
        return null
      }

      const data = await response.json()
      if (data.success && data.data) {
        setCommissionData(data.data)
        return data.data
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

      // Load saved order prices from localStorage
      const savedPrices = localStorage.getItem(`order-prices-${clientId}`)
      if (savedPrices) {
        try {
          setOrderPrices(JSON.parse(savedPrices))
        } catch (e) {
          console.error("Error parsing saved order prices:", e)
        }
      }
    }
  }, [clientId])

  // Fetch client data to get consultant level
  useEffect(() => {
    const fetchClientData = async () => {
      try {
        const token = getToken()
        if (!token) return

        const apiUrl = getApiUrl()
        const response = await fetch(`${apiUrl}/api/getClientDetails/${clientId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          console.error("Failed to fetch client data:", response.status)
          return
        }

        const data = await response.json()
        if (data.success && data.data) {
          // Set commission rate based on consultant level color
          if (data.data.consultantLevel) {
            const consultantLevel = data.data.consultantLevel
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

  // Calculate adjusted price with commission (from wishlist page)
  const calculateAdjustedPrice = (item: OrderItem, orderId: string) => {
    // Check if we already have a calculated price for this item in this order
    if (orderPrices[orderId] && orderPrices[orderId][item.name]) {
      return orderPrices[orderId][item.name]
    }

    // Always use basePrice (which should be the original price)
    const basePrice = item.basePrice || item.price

    // Get the default commission rate (from agent or category-specific)
    let defaultRate = commissionData?.commissionRate || 0

    // Check for category-specific commission
    if (commissionData?.categoryCommissions && item.category && commissionData.categoryCommissions[item.category]) {
      defaultRate = commissionData.categoryCommissions[item.category]
    }

    // Add the override rate to the default rate if an override is set
    const finalRate = overrideCommissionRate !== null ? defaultRate + overrideCommissionRate : defaultRate

    // Calculate adjusted price based on the original basePrice
    const adjustedPrice = basePrice * (1 + finalRate / 100)

    console.log(`ORDERS - Calculating price for ${item.name} in order ${orderId}:`)
    console.log(`ORDERS - Base price: ${basePrice}`)
    console.log(`ORDERS - Base commission rate: ${defaultRate}`)
    console.log(`ORDERS - Override commission rate: ${overrideCommissionRate}`)
    console.log(`ORDERS - Final commission rate: ${finalRate}`)
    console.log(`ORDERS - Adjusted price: ${adjustedPrice.toFixed(2)}`)

    return Math.round(adjustedPrice * 100) / 100 // Round to 2 decimal places
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

      // First fetch commission data
      await fetchCommissionData()

      const apiUrl = getApiUrl()
      console.log("Fetching orders with token:", token.substring(0, 15) + "...")

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

      // Process orders and calculate prices for new orders
      const processOrders = (ordersData: any[]) => {
        // Create a copy of the current order prices
        const newOrderPrices = { ...orderPrices }

        // Process each order
        const processedOrders = ordersData.map((order) => {
          // Ensure each item has basePrice preserved
          const orderWithBasePrices = {
            ...order,
            items: order.items.map((item: OrderItem) => ({
              ...item,
              basePrice: item.basePrice || item.price,
            })),
          }

          // If this is a new order (not in orderPrices), calculate and store prices
          if (!newOrderPrices[order.orderId]) {
            newOrderPrices[order.orderId] = {}

            // Calculate prices for each item
            orderWithBasePrices.items.forEach((item: OrderItem) => {
              newOrderPrices[order.orderId][item.name] = calculateAdjustedPrice(item, order.orderId)
            })
          }

          return orderWithBasePrices
        })

        // Save the updated prices to state and localStorage
        setOrderPrices(newOrderPrices)
        if (typeof window !== "undefined") {
          localStorage.setItem(`order-prices-${clientId}`, JSON.stringify(newOrderPrices))
        }

        return processedOrders
      }

      // Your backend returns { message, data } format
      if (data && Array.isArray(data.data)) {
        console.log("ORDERS - Orders data:", data.data)
        setOrders(processOrders(data.data))
      } else {
        // If data.data is not an array, check if the response itself is an array
        if (Array.isArray(data)) {
          console.log("ORDERS - Orders data (direct array):", data)
          setOrders(processOrders(data))
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

  // Calculate order total with adjusted prices
  const calculateAdjustedTotal = (order: Order) => {
    return order.items.reduce((total, item) => {
      // Use the stored price if available, otherwise calculate it
      const adjustedPrice =
        orderPrices[order.orderId] && orderPrices[order.orderId][item.name]
          ? orderPrices[order.orderId][item.name]
          : calculateAdjustedPrice(item, order.orderId)
      return total + adjustedPrice * item.quantity
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
          <h1 className="text-3xl font-bold">Your Orders</h1>
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
          {orders.map((order) => (
            <Card key={order.orderId} className="overflow-hidden">
              <CardHeader className="bg-muted/20 pb-3">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                  <CardTitle className="text-lg">Order #{order.orderId}</CardTitle>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <span className="text-muted-foreground">Placed on {formatDate(order.createdAt)}</span>
                    <span className="mx-2 text-muted-foreground hidden md:inline">•</span>
                    <Badge
                      variant={
                        order.status === "delivered"
                          ? "success"
                          : order.status === "shipped"
                            ? "info"
                            : order.status === "processing"
                              ? "warning"
                              : order.status === "cancelled"
                                ? "destructive"
                                : "outline"
                      }
                    >
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                    <Badge
                      variant={
                        order.paymentStatus === "paid"
                          ? "success"
                          : order.paymentStatus === "failed"
                            ? "destructive"
                            : "warning"
                      }
                    >
                      Payment: {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <h3 className="font-medium mb-2">Items</h3>
                    <div className="space-y-2">
                      {order.items.map((item, index) => {
                        // Use the stored price if available, otherwise calculate it
                        const adjustedPrice =
                          orderPrices[order.orderId] && orderPrices[order.orderId][item.name]
                            ? orderPrices[order.orderId][item.name]
                            : calculateAdjustedPrice(item, order.orderId)

                        return (
                          <div key={index} className="flex justify-between border-b pb-2">
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm text-muted-foreground">{item.category}</p>
                            </div>
                            <div className="text-right">
                              <p>
                                ₹
                                {adjustedPrice.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}{" "}
                                × {item.quantity}
                              </p>
                              <p className="font-medium">
                                ₹
                                {(adjustedPrice * item.quantity).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </p>
                              {item.basePrice && item.basePrice !== adjustedPrice && (
                                <p className="text-xs text-muted-foreground">
                                  Base: ₹{item.basePrice.toLocaleString()}
                                </p>
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
                        {calculateAdjustedTotal(order).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Shipping Address</h3>
                    {order.shippingAddress ? (
                      <div className="text-sm">
                        <p>{order.shippingAddress.street}</p>
                        <p>
                          {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                        </p>
                        <p>{order.shippingAddress.country}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No shipping address provided</p>
                    )}

                    <div className="mt-4">
                      <Button variant="outline" className="w-full mt-2" size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        View Invoice
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/10 justify-end py-3">
                <Button variant="outline" size="sm">
                  Track Order
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-8 text-center">
        <Link href={`/client-dashboard/${clientId}`} className="text-primary hover:underline">
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
