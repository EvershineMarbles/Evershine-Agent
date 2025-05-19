"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Loader2, FileText, Edit, Package } from "lucide-react"
import { fetchWithAdminAuth } from "@/lib/admin-auth"

interface ClientDetails {
  _id: string
  name: string
  mobile: string
  clientId: string
  email?: string
  city?: string
  profession?: string
  purpose?: string
  quantityRequired?: number
  agentAffiliated?: string
  createdAt: string
  updatedAt: string
}

interface Order {
  orderId: string
  clientId: string
  agentId: string
  items: any[]
  totalAmount: number
  status: string
  paymentStatus: string
  createdAt: string
  shippingAddress?: {
    street?: string
    city?: string
    state?: string
    postalCode?: string
    country?: string
  }
}

interface ClientDetailsProps {
  clientId: string
}

export default function ClientDetails({ clientId }: ClientDetailsProps) {
  const router = useRouter()
  const [client, setClient] = useState<ClientDetails | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("details")

  useEffect(() => {
    const fetchClientData = async () => {
      setLoading(true)
      setError(null)

      try {
        // Fetch client details
        const clientResponse = await fetchWithAdminAuth(`/api/admin/clients/${clientId}`)

        if (!clientResponse.ok) {
          throw new Error(`Failed to fetch client details: ${clientResponse.status}`)
        }

        const clientData = await clientResponse.json()

        if (clientData.success && clientData.data) {
          setClient(clientData.data)

          // Fetch client orders
          const ordersResponse = await fetchWithAdminAuth(`/api/admin/clients/${clientId}/orders`)

          if (ordersResponse.ok) {
            const ordersData = await ordersResponse.json()
            if (ordersData.success && ordersData.data) {
              setOrders(ordersData.data)
            }
          }
        } else {
          throw new Error(clientData.message || "Failed to fetch client details")
        }
      } catch (err: any) {
        console.error("Error fetching client data:", err)
        setError(err.message || "Failed to fetch client data")
      } finally {
        setLoading(false)
      }
    }

    fetchClientData()
  }, [clientId])

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Get status badge color
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

  // Get payment status badge color
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground mb-4">Client not found</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">{client.name}</h1>
        </div>
        <Button onClick={() => router.push(`/admin/dashboard/clients/${clientId}/edit`)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Client
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="details">Client Details</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Full Name</h3>
                    <p className="text-lg font-medium">{client.name}</p>
                  </div>
                  <Separator />

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Mobile Number</h3>
                    <p className="text-lg font-medium">{client.mobile}</p>
                  </div>
                  <Separator />

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Email Address</h3>
                    <p className="text-lg font-medium">{client.email || "-"}</p>
                  </div>
                  <Separator />

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">City</h3>
                    <p className="text-lg font-medium">{client.city || "-"}</p>
                  </div>
                  <Separator />
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Profession</h3>
                    <p className="text-lg font-medium">{client.profession || "-"}</p>
                  </div>
                  <Separator />

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Purpose</h3>
                    <p className="text-lg font-medium">{client.purpose || "-"}</p>
                  </div>
                  <Separator />

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Quantity Required</h3>
                    <p className="text-lg font-medium">{client.quantityRequired || "-"}</p>
                  </div>
                  <Separator />

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Affiliated Consultant</h3>
                    <p className="text-lg font-medium">{client.agentAffiliated || "-"}</p>
                  </div>
                  <Separator />
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-medium text-muted-foreground">Registration Date</h3>
                <p className="text-lg font-medium">{formatDate(client.createdAt)}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Client Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">No Orders Found</p>
                  <p className="text-muted-foreground mb-6">This client hasn't placed any orders yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Total Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.orderId}>
                          <TableCell className="font-medium">{order.orderId}</TableCell>
                          <TableCell>{formatDate(order.createdAt)}</TableCell>
                          <TableCell>{order.items.length}</TableCell>
                          <TableCell>₹{order.totalAmount.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(order.status)}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                              {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/admin/dashboard/orders/${order.orderId}`)}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
