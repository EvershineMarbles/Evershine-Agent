"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Package, Loader2, Calendar } from "lucide-react"
import { agentAPI } from "@/lib/api-utils"
import { isAgentAuthenticated } from "@/lib/auth-utils"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

// Define order interface
interface OrderItem {
  postId: string
  name: string
  price: number
  quantity: number
}

interface Order {
  _id: string
  orderId: string
  clientId: string
  agentId: string
  items: OrderItem[]
  totalAmount: number
  shippingAddress: {
    street: string
    city: string
    state: string
    pincode: string
  }
  paymentMethod: string
  status: string
  paymentStatus: string
  createdAt: string
  updatedAt: string
  clientName?: string // Added after fetching client details
}

interface Client {
  _id: string
  name: string
  clientId: string
}

export default function AgentOrders() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])
  const [clients, setClients] = useState<Client[]>([])

  // Fetch orders and clients
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      // Fetch orders
      console.log("Fetching agent orders...")
      const ordersResponse = await agentAPI.getAgentOrders()
      console.log("Orders response:", ordersResponse)

      if (ordersResponse.success && Array.isArray(ordersResponse.data)) {
        console.log("Successfully fetched orders:", ordersResponse.data)

        // Fetch clients to get names
        const clientsResponse = await agentAPI.getClients()
        console.log("Clients response:", clientsResponse)

        if (clientsResponse.success && Array.isArray(clientsResponse.data)) {
          setClients(clientsResponse.data)

          // Map client names to orders
          const ordersWithClientNames = ordersResponse.data.map((order: Order) => {
            const client = clientsResponse.data.find((c: Client) => c.clientId === order.clientId)
            return {
              ...order,
              clientName: client ? client.name : "Unknown Client",
            }
          })

          console.log("Orders with client names:", ordersWithClientNames)
          setOrders(ordersWithClientNames)
        } else {
          console.log("Setting orders without client names")
          setOrders(ordersResponse.data)
        }
      } else {
        console.error("Failed to fetch orders:", ordersResponse.message)
        toast({
          title: "Error",
          description: ordersResponse.message || "Failed to fetch orders",
          variant: "destructive",
        })
        setOrders([])
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to fetch orders. Please try again.",
        variant: "destructive",
      })
      setOrders([])
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    // Check if agent is logged in
    if (!isAgentAuthenticated()) {
      router.push("/agent-login")
      return
    }

    // Fetch orders
    fetchData()
  }, [router, fetchData])

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy")
    } catch (error) {
      return "Invalid Date"
    }
  }

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Pending
          </Badge>
        )
      case "processing":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Processing
          </Badge>
        )
      case "shipped":
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            Shipped
          </Badge>
        )
      case "delivered":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Delivered
          </Badge>
        )
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Cancelled
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Get payment status badge color
  const getPaymentBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Pending
          </Badge>
        )
      case "paid":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Paid
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Failed
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Handle view order details
  const handleViewOrder = (orderId: string) => {
    router.push(`/order-details/${orderId}`)
  }

  // Filter to only show active orders (not cancelled or delivered)
  const activeOrders = orders.filter(
    (order) => order.status.toLowerCase() !== "cancelled" && order.status.toLowerCase() !== "delivered",
  )

  // Log active orders to console
  useEffect(() => {
    if (activeOrders.length > 0) {
      console.log("Active orders:", activeOrders)
    }
  }, [activeOrders])

  if (isLoading && orders.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <p>Loading orders...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto py-6 px-4">
        {/* Back button and page title */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <button onClick={() => router.push("/dashboard")} className="p-2 rounded-full hover:bg-gray-100">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-3xl font-bold">Agent Orders</h1>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => fetchData()}
              className="flex items-center gap-2 bg-[#194a95] text-white hover:bg-[#194a95]/90 hover:text-white px-4 py-2 rounded-md"
            >
              <Calendar className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Orders List Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Active Orders
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{activeOrders.length} active orders</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : activeOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Order ID</th>
                      <th className="text-left py-3 px-4">Client</th>
                      <th className="text-left py-3 px-4">Date</th>
                      <th className="text-left py-3 px-4">Amount</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Payment</th>
                      <th className="text-center py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeOrders.map((order) => (
                      <tr key={order._id || order.orderId} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{order.orderId}</td>
                        <td className="py-3 px-4">{order.clientName || "Unknown"}</td>
                        <td className="py-3 px-4">{formatDate(order.createdAt)}</td>
                        <td className="py-3 px-4">₹{order.totalAmount.toFixed(2)}</td>
                        <td className="py-3 px-4">{getStatusBadge(order.status)}</td>
                        <td className="py-3 px-4">{getPaymentBadge(order.paymentStatus)}</td>
                        <td className="py-3 px-4 flex justify-center gap-2">
                          <button
                            onClick={() => handleViewOrder(order.orderId)}
                            className="bg-[#194a95] hover:bg-[#194a95]/90 text-white hover:text-white px-3 py-1.5 rounded-md text-sm flex items-center gap-2"
                          >
                            <span>View Details</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No active orders found</p>
                <p className="text-gray-500">Active orders will appear here when your clients place them</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* All Orders Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                All Orders
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{orders.length} total orders</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : orders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Order ID</th>
                      <th className="text-left py-3 px-4">Client</th>
                      <th className="text-left py-3 px-4">Date</th>
                      <th className="text-left py-3 px-4">Amount</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Payment</th>
                      <th className="text-center py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order._id || order.orderId} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{order.orderId}</td>
                        <td className="py-3 px-4">{order.clientName || "Unknown"}</td>
                        <td className="py-3 px-4">{formatDate(order.createdAt)}</td>
                        <td className="py-3 px-4">₹{order.totalAmount.toFixed(2)}</td>
                        <td className="py-3 px-4">{getStatusBadge(order.status)}</td>
                        <td className="py-3 px-4">{getPaymentBadge(order.paymentStatus)}</td>
                        <td className="py-3 px-4 flex justify-center gap-2">
                          <button
                            onClick={() => handleViewOrder(order.orderId)}
                            className="bg-[#194a95] hover:bg-[#194a95]/90 text-white hover:text-white px-3 py-1.5 rounded-md text-sm flex items-center gap-2"
                          >
                            <span>View Details</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No orders found</p>
                <p className="text-gray-500">Orders will appear here when your clients place them</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
