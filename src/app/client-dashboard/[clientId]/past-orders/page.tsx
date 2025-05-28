"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, FileText, ChevronRight, Package, User, Award, Percent } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"

interface OrderItem {
  name: string
  category: string
  price: number
  quantity: number
  customQuantity?: number
  customFinish?: string
  customThickness?: string
}

interface Order {
  orderId: string
  items: OrderItem[]
  totalAmount: number
  status: string
  paymentStatus: string
  createdAt: string
  shippingAddress?: {
    city?: string
    state?: string
  }
  agentInfo?: {
    name: string
    consultantLevel: string
    commissionRate: number
  }
}

export default function PastOrdersPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const clientId = params.clientId as string

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<string>("date-desc")

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
      const response = await fetch(`${apiUrl}/api/clients/${clientId}/orders`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed. Please log in again.")
        } else {
          throw new Error(`API error: ${response.status} ${response.statusText}`)
        }
      }

      const data = await response.json()

      // Add mock agent data for demonstration
      const ordersWithAgentInfo = (data.data || []).map((order: Order) => ({
        ...order,
        agentInfo: {
          name: getRandomAgentName(),
          commissionRate: getRandomCommissionRate(),
        },
      }))

      setOrders(ordersWithAgentInfo)
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
    }
  }

  // Mock data generators for demonstration
  const getRandomAgentName = () => {
    const names = ["Rahul Sharma", "Priya Patel", "Amit Singh", "Neha Gupta", "Vikram Mehta"]
    return names[Math.floor(Math.random() * names.length)]
  }

  const getRandomConsultantLevel = () => {
    const levels = ["Platinum", "Gold", "Silver", "Bronze"]
    return levels[Math.floor(Math.random() * levels.length)]
  }

  const getRandomCommissionRate = () => {
    return Math.floor(Math.random() * 10) + 5 // 5-15%
  }

  useEffect(() => {
    fetchOrders()
  }, [clientId, toast])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const sortedOrders = [...orders].sort((a, b) => {
    switch (sortBy) {
      case "date-desc":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case "date-asc":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      case "amount-desc":
        return b.totalAmount - a.totalAmount
      case "amount-asc":
        return a.totalAmount - b.totalAmount
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
  })

  const getConsultantLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case "platinum":
        return "bg-slate-300 text-slate-900"
      case "gold":
        return "bg-amber-200 text-amber-900"
      case "silver":
        return "bg-gray-200 text-gray-900"
      case "bronze":
        return "bg-orange-200 text-orange-900"
      default:
        return "bg-blue-100 text-blue-900"
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading your order history...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 md:p-6">
        <h1 className="text-2xl font-bold mb-6">Past Orders</h1>
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
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold">Past Orders</h1>
        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Date: Newest first</SelectItem>
              <SelectItem value="date-asc">Date: Oldest first</SelectItem>
              <SelectItem value="amount-desc">Amount: High to low</SelectItem>
              <SelectItem value="amount-asc">Amount: Low to high</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {sortedOrders.length === 0 ? (
        <Card className="text-center py-8">
          <CardContent className="pt-6">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-lg font-medium mb-4">No orders found</h2>
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
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Showing {sortedOrders.length} {sortedOrders.length === 1 ? "order" : "orders"}
          </p>

          {sortedOrders.map((order) => (
            <Card key={order.orderId} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
                    <div>
                      <h3 className="font-medium">Order #{order.orderId}</h3>
                      <p className="text-sm text-muted-foreground">Placed on {formatDate(order.createdAt)}</p>
                    </div>
                    <Badge
                      variant={
                        order.status === "delivered"
                          ? "default"
                          : order.status === "shipped"
                            ? "secondary"
                            : order.status === "processing"
                              ? "outline"
                              : order.status === "cancelled"
                                ? "destructive"
                                : "outline"
                      }
                    >
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Items ({order.items.length})</h4>
                      <div className="space-y-2">
                        {order.items.slice(0, 3).map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-xs text-muted-foreground">{item.category}</p>
                            </div>
                            <div className="text-right">
                              <p>
                                ₹{item.price.toFixed(2)} × {item.quantity}
                              </p>
                              <p className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</p>
                            </div>
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <p className="text-xs text-muted-foreground">
                            +{order.items.length - 3} more {order.items.length - 3 === 1 ? "item" : "items"}
                          </p>
                        )}
                      </div>
                      <div className="mt-4">
                        <div className="flex justify-between font-medium">
                          <span>Total</span>
                          <span>₹{order.totalAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">Order Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <span>{order.status}</span>
                        </div>
                        {order.shippingAddress && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Shipped to:</span>
                            <span>
                              {order.shippingAddress.city}, {order.shippingAddress.state}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Agent Information Section */}
                      <div className="mt-4 bg-blue-50 p-3 rounded-md">
                        <h4 className="text-sm font-medium mb-2 flex items-center">
                          <User className="h-4 w-4 mr-1" /> Agent Information
                        </h4>
                        <div className="space-y-2 text-sm">
                          {order.agentInfo && (
                            <>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Agent:</span>
                                <span className="font-medium">{order.agentInfo.name}</span>
                              </div>
                           
                              <div className="flex justify-between">
                                <span className="text-muted-foreground flex items-center">
                                  <Percent className="h-3 w-3 mr-1" /> Commission:
                                </span>
                                <span className="text-green-600 font-medium">{order.agentInfo.commissionRate}%</span>
                              </div>
                            </>
                          )}
                          {!order.agentInfo && (
                            <p className="text-muted-foreground text-xs">Agent information not available</p>
                          )}
                        </div>
                      </div>

                      <div className="mt-4">
                        <Button variant="outline" size="sm" className="w-full" asChild>
                          <Link href={`/client-dashboard/${clientId}/orders/${order.orderId}`}>
                            <FileText className="h-4 w-4 mr-2" /> View Invoice
                          </Link>
                        </Button>
                      </div>
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
