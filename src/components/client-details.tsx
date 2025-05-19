"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { fetchWithAuth } from "@/lib/auth"

interface ClientDetails {
  _id: string
  name: string
  mobile: string
  clientId: string
  quantityRequired: number
  profession: string
  purpose: string
  city: string
  email: string
  agentAffiliated: string
  createdAt: string
  updatedAt: string
}

interface Order {
  orderId: string
  items: any[]
  totalAmount: number
  status: string
  paymentStatus: string
  createdAt: string
}

interface ClientDetailsProps {
  clientId: string
}

export default function ClientDetails({ clientId }: ClientDetailsProps) {
  const [client, setClient] = useState<ClientDetails | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [impersonationToken, setImpersonationToken] = useState<string | null>(null)

  useEffect(() => {
    const fetchClientDetails = async () => {
      try {
        setLoading(true)
        const response = await fetchWithAuth(`/api/getClientDetails/${clientId}`)
        const data = await response.json()

        if (data.data) {
          setClient(Array.isArray(data.data) ? data.data[0] : data.data)
        }

        // Fetch client orders
        const ordersResponse = await fetchWithAuth(`/api/clients/${clientId}/orders`)
        const ordersData = await ordersResponse.json()

        if (ordersData.data) {
          setOrders(ordersData.data)
        }
      } catch (err) {
        console.error("Error fetching client details:", err)
        setError("Failed to load client details. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchClientDetails()
  }, [clientId])

  const handleImpersonate = async () => {
    try {
      const response = await fetchWithAuth(`/api/agent/impersonate/${clientId}`, {
        method: "POST",
      })

      const data = await response.json()

      if (data.success && data.data.impersonationToken) {
        setImpersonationToken(data.data.impersonationToken)

        // Store the impersonation token
        sessionStorage.setItem("impersonationToken", data.data.impersonationToken)

        // Redirect to client dashboard
        window.location.href = `/client-dashboard/${clientId}`
      }
    } catch (err) {
      console.error("Error generating impersonation token:", err)
      setError("Failed to impersonate client. Please try again.")
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <p>Loading client details...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[200px]">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <p>Client not found</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Client Details</h1>
        <Button onClick={handleImpersonate}>Impersonate Client</Button>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>{client.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-500">Contact Information</h3>
                  <p className="mt-2">
                    <span className="font-medium">Mobile:</span> {client.mobile}
                  </p>
                  <p>
                    <span className="font-medium">Email:</span> {client.email || "Not provided"}
                  </p>
                  <p>
                    <span className="font-medium">City:</span> {client.city || "Not provided"}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-500">Additional Information</h3>
                  <p className="mt-2">
                    <span className="font-medium">Profession:</span> {client.profession || "Not provided"}
                  </p>
                  <p>
                    <span className="font-medium">Purpose:</span> {client.purpose || "Not provided"}
                  </p>
                  <p>
                    <span className="font-medium">Quantity Required:</span> {client.quantityRequired || "Not specified"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <p className="text-center py-4">No orders found for this client.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4">Order ID</th>
                        <th className="text-left py-2 px-4">Date</th>
                        <th className="text-left py-2 px-4">Items</th>
                        <th className="text-left py-2 px-4">Total</th>
                        <th className="text-left py-2 px-4">Status</th>
                        <th className="text-left py-2 px-4">Payment</th>
                        <th className="text-left py-2 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.orderId} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-4">{order.orderId}</td>
                          <td className="py-2 px-4">{new Date(order.createdAt).toLocaleDateString()}</td>
                          <td className="py-2 px-4">{order.items.length}</td>
                          <td className="py-2 px-4">₹{order.totalAmount.toFixed(2)}</td>
                          <td className="py-2 px-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                order.status === "delivered"
                                  ? "bg-green-100 text-green-800"
                                  : order.status === "shipped"
                                    ? "bg-blue-100 text-blue-800"
                                    : order.status === "processing"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : order.status === "cancelled"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </td>
                          <td className="py-2 px-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                order.paymentStatus === "paid"
                                  ? "bg-green-100 text-green-800"
                                  : order.paymentStatus === "failed"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                            </span>
                          </td>
                          <td className="py-2 px-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => (window.location.href = `/orders/${order.orderId}`)}
                            >
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
