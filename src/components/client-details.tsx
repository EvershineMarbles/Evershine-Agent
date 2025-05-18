"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Loader2, FileText, Package, Heart, ShoppingCart, ExternalLink } from "lucide-react"
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
  businessName?: string
  gstNumber?: string
  projectType?: string
  dateOfBirth?: string
  address?: string
  consultantLevel?: string
  architectDetails?: {
    name?: string
    contact?: string
    firm?: string
  }
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

interface WishlistItem {
  _id: string
  postId: string
  name: string
  price: number
  image: string
  description?: string
  category?: string
  createdAt: string
}

interface CartItem {
  _id: string
  productId: string
  name: string
  price: number
  image: string
  quantity: number
  description?: string
  category?: string
}

interface ClientDetailsProps {
  clientId: string
}

export default function ClientDetails({ clientId }: ClientDetailsProps) {
  const router = useRouter()
  const [client, setClient] = useState<ClientDetails | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [cartItems, setCartItems] = useState<CartItem[]>([])
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
          const ordersResponse = await fetchWithAdminAuth(`/api/admin/orders?clientId=${clientId}`)

          if (ordersResponse.ok) {
            const ordersData = await ordersResponse.json()
            if (ordersData.success && ordersData.data) {
              setOrders(ordersData.data.orders)
            }
          }

          // Fetch client wishlist
          const wishlistResponse = await fetchWithAdminAuth(`/api/admin/clients/${clientId}/wishlist`)

          if (wishlistResponse.ok) {
            const wishlistData = await wishlistResponse.json()
            if (wishlistData.success && wishlistData.data) {
              setWishlistItems(wishlistData.data.items || [])
            }
          }

          // Fetch client cart
          const cartResponse = await fetchWithAdminAuth(`/api/admin/clients/${clientId}/cart`)

          if (cartResponse.ok) {
            const cartData = await cartResponse.json()
            if (cartData.success && cartData.data) {
              setCartItems(cartData.data.items || [])
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

  // Get consultant level color
  const getConsultantLevelColor = (level?: string) => {
    switch (level) {
      case "red":
        return "bg-red-500"
      case "yellow":
        return "bg-yellow-500"
      case "purple":
        return "bg-purple-600"
      default:
        return "bg-gray-300"
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
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="details">Client Details</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="wishlist">Wishlist</TabsTrigger>
          <TabsTrigger value="cart">Cart</TabsTrigger>
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

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Date of Birth</h3>
                    <p className="text-lg font-medium">{client.dateOfBirth ? formatDate(client.dateOfBirth) : "-"}</p>
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
                    <h3 className="text-sm font-medium text-muted-foreground">Affiliated Agent</h3>
                    <p className="text-lg font-medium">{client.agentAffiliated || "-"}</p>
                  </div>
                  <Separator />

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Business Name</h3>
                    <p className="text-lg font-medium">{client.businessName || "-"}</p>
                  </div>
                  <Separator />

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">GST Number</h3>
                    <p className="text-lg font-medium">{client.gstNumber || "-"}</p>
                  </div>
                  <Separator />
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Project Type</h3>
                  <p className="text-lg font-medium">{client.projectType || "-"}</p>
                </div>
                <Separator />

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Consultant Level</h3>
                  <div className="flex items-center mt-2">
                    <div
                      className={`w-6 h-6 rounded-full ${getConsultantLevelColor(client.consultantLevel)} mr-2`}
                    ></div>
                    <p className="text-lg font-medium capitalize">
                      {client.consultantLevel || "Not Set"}
                      {client.consultantLevel && (
                        <span className="text-sm text-muted-foreground ml-2">
                          (
                          {client.consultantLevel === "red"
                            ? "+5%"
                            : client.consultantLevel === "yellow"
                              ? "+10%"
                              : "+15%"}
                          )
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <Separator />

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Registration Date</h3>
                  <p className="text-lg font-medium">{formatDate(client.createdAt)}</p>
                </div>
                <Separator />

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Last Updated</h3>
                  <p className="text-lg font-medium">{formatDate(client.updatedAt)}</p>
                </div>
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

        <TabsContent value="wishlist" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Client Wishlist</CardTitle>
            </CardHeader>
            <CardContent>
              {wishlistItems.length === 0 ? (
                <div className="text-center py-8">
                  <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">No Wishlist Items Found</p>
                  <p className="text-muted-foreground mb-6">
                    This client hasn't added any products to their wishlist yet.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Added On</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {wishlistItems.map((item) => (
                        <TableRow key={item._id}>
                          <TableCell>
                            <div className="w-16 h-16 relative rounded overflow-hidden">
                              {item.image ? (
                                <div className="w-full h-full">
                                  <img
                                    src={item.image || "/placeholder.svg"}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.onerror = null
                                      e.currentTarget.src = "/placeholder.svg"
                                    }}
                                  />
                                </div>
                              ) : (
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                  <Package className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>₹{item.price.toLocaleString()}</TableCell>
                          <TableCell>{item.category || "-"}</TableCell>
                          <TableCell>{formatDate(item.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/admin/dashboard/product/${item.postId}`)}
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
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

        <TabsContent value="cart" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Client Cart</CardTitle>
            </CardHeader>
            <CardContent>
              {cartItems.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">No Cart Items Found</p>
                  <p className="text-muted-foreground mb-6">This client's shopping cart is empty.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cartItems.map((item) => (
                        <TableRow key={item._id}>
                          <TableCell>
                            <div className="w-16 h-16 relative rounded overflow-hidden">
                              {item.image ? (
                                <div className="w-full h-full">
                                  <img
                                    src={item.image || "/placeholder.svg"}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.onerror = null
                                      e.currentTarget.src = "/placeholder.svg"
                                    }}
                                  />
                                </div>
                              ) : (
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                  <Package className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>₹{item.price.toLocaleString()}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>₹{(item.price * item.quantity).toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/admin/dashboard/product/${item.productId}`)}
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="mt-6 flex justify-end">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between text-base font-medium">
                        <span>Total:</span>
                        <span>
                          ₹{cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
