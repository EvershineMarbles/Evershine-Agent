"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Package, Search, Filter, Loader2, Calendar } from 'lucide-react'
import { agentAPI } from "@/lib/api-utils"
import { isAgentAuthenticated } from "@/lib/auth-utils"
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [paymentFilter, setPaymentFilter] = useState<string>("all")

  // Fetch orders and clients
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      // Fetch orders
      const ordersResponse = await agentAPI.getAgentOrders()

      if (ordersResponse.success && Array.isArray(ordersResponse.data)) {
        // Fetch clients to get names
        const clientsResponse = await agentAPI.getClients()

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

          setOrders(ordersWithClientNames)
        } else {
          setOrders(ordersResponse.data)
        }
      } else {
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

  // Filter orders based on search query and filters
  const filteredOrders = orders.filter((order) => {
    // Search filter
    const searchMatch =
      (order.orderId && order.orderId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (order.clientName && order.clientName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (order.totalAmount && order.totalAmount.toString().includes(searchQuery))

    // Status filter
    const statusMatch = statusFilter === "all" || order.status.toLowerCase() === statusFilter.toLowerCase()

    // Payment filter
    const paymentMatch = paymentFilter === "all" || order.paymentStatus.toLowerCase() === paymentFilter.toLowerCase()

    return searchMatch && statusMatch && paymentMatch
  })

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

          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-grow md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <button
              onClick={() => fetchData()}
              className="flex items-center gap-2 bg-[#194a95] text-white hover:bg-[#194a95]/90 hover:text-white px-4 py-2 rounded-md"
            >
              <Calendar className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="w-full md:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-auto">
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Orders List Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Orders List
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  {filteredOrders.length} of {orders.length} orders
                </span>
                <button className="p-1.5 rounded-md hover:bg-gray-100">
                  <Filter className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : filteredOrders.length > 0 ? (
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
                    {filteredOrders.map((order) => (
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
                <p className="text-muted-foreground mb-4">
                  {searchQuery || statusFilter !== "all" || paymentFilter !== "all"
                    ? "No orders match your filters"
                    : "No orders found"}
                </p>
                {searchQuery || statusFilter !== "all" || paymentFilter !== "all" ? (
                  <button
                    onClick={() => {
                      setSearchQuery("")
                      setStatusFilter("all")
                      setPaymentFilter("all")
                    }}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md"
                  >
                    Clear Filters
                  </button>
                ) : (
                  <p className="text-gray-500">Orders will appear here when your clients place them</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination (if needed in the future) */}
        {filteredOrders.length > 10 && (
          <div className="flex justify-end gap-4 mt-8">
            <button className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
              Previous
            </button>
            <button className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
