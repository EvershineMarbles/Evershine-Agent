"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Loader2, Package, FileText, RefreshCw, Calendar, User, TrendingUp } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface OrderItem {
  name: string
  category: string
  price: number
  basePrice?: number
  updatedPrice?: number
  quantity: number
  customQuantity?: number
  customFinish?: string
  customThickness?: string
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
  // Direct properties from backend
  agentName?: string
  clientName?: string
  consultantLevel?: string
}

export default function PastOrdersPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const clientId = params.clientId as string

  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [sortBy, setSortBy] = useState<string>("newest")

  const getApiUrl = () => {
    return process.env.NEXT_PUBLIC_API_URL || "https://evershinebackend-2.onrender.com"
  }

  const getToken = () => {
    try {
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
      console.log("PAST ORDERS - Fetching orders with token:", token.substring(0, 15) + "...")

      const response = await fetch(`${apiUrl}/api/clients/${clientId}/orders`, {
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
      console.log("PAST ORDERS - Full API response:", data)

      if (data && Array.isArray(data.data)) {
        console.log("PAST ORDERS - Orders data:", data.data)
        setOrders(data.data)
        setFilteredOrders(data.data)
      } else if (Array.isArray(data)) {
        console.log("PAST ORDERS - Orders data (direct array):", data)
        setOrders(data)
        setFilteredOrders(data)
      } else {
        console.warn("PAST ORDERS - Unexpected response format:", data)
        setOrders([])
        setFilteredOrders([])
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

  useEffect(() => {
    fetchOrders()
  }, [clientId, toast])

  useEffect(() => {
    const filtered = [...orders]

    // Sort orders
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()

      if (sortBy === "newest") {
        return dateB - dateA
      } else if (sortBy === "oldest") {
        return dateA - dateB
      } else if (sortBy === "amount-high") {
        return calculateOrderTotal(b) - calculateOrderTotal(a)
      } else if (sortBy === "amount-low") {
        return calculateOrderTotal(a) - calculateOrderTotal(b)
      }
      return 0
    })

    setFilteredOrders(filtered)
  }, [orders, sortBy])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const calculateOrderTotal = (order: Order) => {
    if (order.totalAmount) {
      return order.totalAmount
    }
    return order.items.reduce((total, item) => {
      const displayPrice = item.updatedPrice || item.price
      return total + displayPrice * item.quantity
    }, 0)
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchOrders()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800"
      case "shipped":
        return "bg-blue-100 text-blue-800"
      case "processing":
        return "bg-yellow-100 text-yellow-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-yellow-100 text-yellow-800"
    }
  }

  // Updated function to include percentage
  const getConsultantLevelColor = (level: string) => {
    switch (level) {
      case "green":
        return "bg-green-100 text-green-800"
      case "yellow":
        return "bg-yellow-100 text-yellow-800"
      case "purple":
        return "bg-purple-100 text-purple-800"
      case "red": // Keep for backward compatibility
        return "bg-green-100 text-green-800" // Show as green
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // New function to get consultant level display text with percentage
  const getConsultantLevelDisplay = (level: string) => {
    switch (level) {
      case "green":
        return "Green Level (5%)"
      case "yellow":
        return "Yellow Level (10%)"
      case "purple":
        return "Purple Level (15%)"
      case "red": // Keep for backward compatibility
        return "Green Level (5%)" // Show as green
      default:
        return `${level.charAt(0).toUpperCase() + level.slice(1)} Level`
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading past orders...</p>
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
          <h1 className="text-3xl font-bold">Past Orders</h1>
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="amount-high">Amount: High to Low</SelectItem>
              <SelectItem value="amount-low">Amount: Low to High</SelectItem>
            </SelectContent>
          </Select>
        </div>
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

      {filteredOrders.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="pt-6">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-medium mb-4">No orders found</h2>
            <p className="text-muted-foreground mb-6">You haven't placed any orders yet</p>
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
          <div className="text-sm text-muted-foreground mb-4">
            Showing {filteredOrders.length} of {orders.length} orders
          </div>

          {filteredOrders.map((order) => (
            <Card key={order.orderId} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="bg-muted/20 pb-3">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                  <CardTitle className="text-lg">Order #{order.orderId}</CardTitle>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <span className="text-muted-foreground">Placed on {formatDate(order.createdAt)}</span>
                  </div>
                </div>

                {/* Agent and Consultant Information - Clean & Concise */}
                <div className="mt-3 pt-3 border-t border-muted-foreground/20">
                  <div className="flex items-center justify-between">
                    {/* Agent Name - Compact */}
                    {order.agentName && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-blue-600" />
                        <div>
                          <span className="text-xs text-muted-foreground">Consultant Name:</span>
                          <span className="ml-1 font-semibold text-blue-700">{order.agentName}</span>
                        </div>
                      </div>
                    )}

                    {/* Consultant Level - Compact with Percentage */}
                    {order.consultantLevel && (
                      <Badge className={`${getConsultantLevelColor(order.consultantLevel)} font-medium px-3 py-1`}>
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {getConsultantLevelDisplay(order.consultantLevel)}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <h3 className="font-medium mb-2">Items ({order.items.length})</h3>
                    <div className="space-y-2">
                      {order.items.slice(0, 3).map((item, index) => {
                        const displayPrice = item.updatedPrice || item.price
                        const hasCommission = item.updatedPrice && item.updatedPrice !== item.price

                        return (
                          <div key={index} className="flex justify-between border-b pb-2">
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm text-muted-foreground">{item.category}</p>
                              {(item.customQuantity || item.customFinish || item.customThickness) && (
                                <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                                  {item.customQuantity && <div>Qty: {item.customQuantity} sqft</div>}
                                  {item.customFinish && <div>Finish: {item.customFinish}</div>}
                                  {item.customThickness && <div>Thickness: {item.customThickness} mm</div>}
                                </div>
                              )}
                              {hasCommission && <div className="text-xs text-green-600 mt-1">Commission Applied ✓</div>}
                            </div>
                            <div className="text-right">
                              {hasCommission ? (
                                <div className="space-y-1">
                                  <p className="text-green-600 font-medium">
                                    ₹{displayPrice.toLocaleString()} × {item.quantity}
                                  </p>
                                  <p className="font-medium text-green-600">
                                    ₹{(displayPrice * item.quantity).toLocaleString()}
                                  </p>
                                  {item.basePrice && (
                                    <p className="text-xs text-muted-foreground line-through">
                                      Base: ₹{item.basePrice.toLocaleString()}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <div>
                                  <p>
                                    ₹{displayPrice.toLocaleString()} × {item.quantity}
                                  </p>
                                  <p className="font-medium">₹{(displayPrice * item.quantity).toLocaleString()}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                      {order.items.length > 3 && (
                        <p className="text-sm text-muted-foreground">+{order.items.length - 3} more items</p>
                      )}
                    </div>
                    <div className="flex justify-between mt-4 pt-2 font-bold">
                      <span>Total</span>
                      <span>₹{calculateOrderTotal(order).toLocaleString()}</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Order Details</h3>
                    <div className="space-y-2 text-sm">
                      {order.shippingAddress && (
                        <div>
                          <span className="text-muted-foreground">Shipped to:</span>
                          <div className="mt-1">
                            <p>
                              {order.shippingAddress.city}, {order.shippingAddress.state}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 space-y-2">
                      <Button
                        variant="outline"
                        className="w-full"
                        size="sm"
                        onClick={() => router.push(`/client-dashboard/${clientId}/orders/${order.orderId}`)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        View Invoice
                      </Button>
                      {order.status === "delivered" && (
                        <Button
                          variant="default"
                          className="w-full"
                          size="sm"
                          onClick={() => router.push(`/client-dashboard/${clientId}/products`)}
                        >
                          Reorder Items
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
