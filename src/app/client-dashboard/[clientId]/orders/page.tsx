"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2, Package, FileText } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"

interface Order {
  orderId: string
  items: {
    name: string
    category: string
    price: number
    basePrice?: number
    quantity: number
  }[]
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

interface CommissionData {
  [category: string]: {
    baseCommissionRate: number
    overrideRate?: number
  }
}

export default function OrdersPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const clientId = params.clientId as string

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [commissionData, setCommissionData] = useState<CommissionData>({})
  const [consultantLevel, setConsultantLevel] = useState<number>(0)

  // Fetch commission data
  useEffect(() => {
    const fetchCommissionData = async () => {
      try {
        const token = localStorage.getItem("clientImpersonationToken")
        if (!token) return

        // Fetch commission rates
        const response = await fetch("https://evershinebackend-2.onrender.com/api/commission-rates", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch commission rates")
        }

        const data = await response.json()
        console.log("ORDERS - Commission data:", data)

        if (data && data.data) {
          setCommissionData(data.data)
        }

        // Fetch consultant level
        const consultantResponse = await fetch(`https://evershinebackend-2.onrender.com/api/clients/${clientId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!consultantResponse.ok) {
          throw new Error("Failed to fetch consultant level")
        }

        const consultantData = await consultantResponse.json()
        console.log("ORDERS - Consultant data:", consultantData)

        if (consultantData && consultantData.data && consultantData.data.consultantLevel) {
          setConsultantLevel(consultantData.data.consultantLevel)
        }
      } catch (error) {
        console.error("Error fetching commission data:", error)
      }
    }

    fetchCommissionData()
  }, [clientId])

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get the token
        const token = localStorage.getItem("clientImpersonationToken")

        if (!token) {
          throw new Error("No authentication token found. Please refresh the page and try again.")
        }

        console.log("Fetching orders with token:", token.substring(0, 15) + "...")

        const response = await fetch(`https://evershinebackend-2.onrender.com/api/clients/${clientId}/orders`, {
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
      }
    }

    fetchOrders()
  }, [clientId, toast])

  // Calculate adjusted price with commission
  const calculateAdjustedPrice = (item: any) => {
    // Use basePrice if available, otherwise use price
    const basePrice = item.basePrice || item.price

    // Get commission rate for the item's category
    const categoryCommission = commissionData[item.category] || { baseCommissionRate: 20 }
    const baseCommissionRate = categoryCommission.baseCommissionRate

    // Get consultant level commission rate (default to 15% if not available)
    const consultantCommissionRate = consultantLevel === 2 ? 15 : 0

    // Calculate total commission rate
    const totalCommissionRate = baseCommissionRate + consultantCommissionRate

    console.log(`ORDERS - Calculating price for ${item.name}:`)
    console.log(`ORDERS - Base price: ${basePrice}`)
    console.log(`ORDERS - Base commission rate: ${baseCommissionRate}`)
    console.log(`ORDERS - Consultant commission rate: ${consultantCommissionRate}`)
    console.log(`ORDERS - Total commission rate: ${totalCommissionRate}`)

    // Calculate adjusted price
    const adjustedPrice = basePrice * (1 + totalCommissionRate / 100)
    console.log(`ORDERS - Adjusted price: ${adjustedPrice.toFixed(2)}`)

    return adjustedPrice
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
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

  // Calculate order total with adjusted prices
  const calculateAdjustedTotal = (order: Order) => {
    return order.items.reduce((total, item) => {
      const adjustedPrice = calculateAdjustedPrice(item)
      return total + adjustedPrice * item.quantity
    }, 0)
  }

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
      <div className="flex items-center mb-8">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-4">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">Your Orders</h1>
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4 text-red-800">
            <p>{error}</p>
            <Button
              variant="outline"
              className="mt-2 border-red-300 text-red-800 hover:bg-red-100"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {orders.length === 0 ? (
        <div className="text-center py-12 bg-muted/20 rounded-lg">
          <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-xl font-medium mb-4">No orders found</p>
          <p className="text-muted-foreground mb-6">You haven&apos;t placed any orders yet</p>
          <Button
            onClick={() => router.push(`/client-dashboard/${clientId}/products`)}
            className="bg-primary hover:bg-primary/90"
          >
            Browse Products
          </Button>
        </div>
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
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${getPaymentStatusColor(order.paymentStatus)}`}>
                      Payment: {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <h3 className="font-medium mb-2">Items</h3>
                    <div className="space-y-2">
                      {order.items.map((item, index) => {
                        const adjustedPrice = calculateAdjustedPrice(item)
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
