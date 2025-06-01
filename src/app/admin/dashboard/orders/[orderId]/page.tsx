"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2 } from "lucide-react"
import { fetchWithAdminAuth } from "@/lib/admin-auth"

interface AdditionalCharges {
  loadingFee: number
  woodPackaging: number
  insurance: number
  transportAdvance: number
  gstRate: number
  gstAmount: number
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
  additionalCharges?: AdditionalCharges
}

export default function OrderDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.orderId as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [orderData, setOrderData] = useState<Order | null>(null)

  useEffect(() => {
    const fetchOrderDetails = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetchWithAdminAuth(`/api/admin/orders/${orderId}`)

        if (!response.ok) {
          throw new Error(`Failed to fetch order details: ${response.status}`)
        }

        const data = await response.json()

        if (data.success && data.data) {
          setOrderData(data.data.order)
        } else {
          throw new Error(data.message || "Failed to fetch order details")
        }
      } catch (err: any) {
        console.error("Error fetching order details:", err)
        setError(err.message || "Failed to fetch order details")
      } finally {
        setLoading(false)
      }
    }

    fetchOrderDetails()
  }, [orderId])

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

  if (!orderData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground mb-4">Order not found</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mr-4">
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Order Details</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order #{orderId}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Order Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p>
                    <strong>Order Date:</strong> {formatDate(orderData.createdAt)}
                  </p>
                  <p>
                    <strong>Status:</strong> {orderData.status}
                  </p>
                  <p>
                    <strong>Payment Status:</strong> {orderData.paymentStatus}
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Client ID:</strong> {orderData.clientId}
                  </p>
                  <p>
                    <strong>Agent ID:</strong> {orderData.agentId}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3">Order Items</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium">Item</th>
                      <th className="border border-gray-200 px-3 py-2 text-right text-xs font-medium">Price</th>
                      <th className="border border-gray-200 px-3 py-2 text-right text-xs font-medium">Qty</th>
                      <th className="border border-gray-200 px-3 py-2 text-right text-xs font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderData.items.map((item: any, index: number) => (
                      <tr key={index}>
                        <td className="border border-gray-200 px-3 py-2 text-sm">{item.name}</td>
                        <td className="border border-gray-200 px-3 py-2 text-right text-sm">
                          ₹{item.price.toLocaleString()}
                        </td>
                        <td className="border border-gray-200 px-3 py-2 text-right text-sm">{item.quantity}</td>
                        <td className="border border-gray-200 px-3 py-2 text-right text-sm">
                          ₹{(item.price * item.quantity).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Additional Charges Section */}
            {orderData.additionalCharges && (
              <div>
                <h3 className="text-lg font-medium mb-3">Additional Charges</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium">Charge Type</th>
                        <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium">Description</th>
                        <th className="border border-gray-200 px-3 py-2 text-right text-xs font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderData.additionalCharges.loadingFee > 0 && (
                        <tr>
                          <td className="border border-gray-200 px-3 py-2 text-sm font-medium">Loading Fee</td>
                          <td className="border border-gray-200 px-3 py-2 text-sm text-gray-600">
                            Material loading charges
                          </td>
                          <td className="border border-gray-200 px-3 py-2 text-right text-sm">
                            ₹{orderData.additionalCharges.loadingFee.toLocaleString()}
                          </td>
                        </tr>
                      )}
                      {orderData.additionalCharges.woodPackaging > 0 && (
                        <tr>
                          <td className="border border-gray-200 px-3 py-2 text-sm font-medium">Wood Packaging</td>
                          <td className="border border-gray-200 px-3 py-2 text-sm text-gray-600">
                            {orderData.additionalCharges.woodPackaging === 1500 && "Basic packaging"}
                            {orderData.additionalCharges.woodPackaging === 2500 && "Standard packaging"}
                            {orderData.additionalCharges.woodPackaging === 3500 && "Premium packaging"}
                            {orderData.additionalCharges.woodPackaging === 4500 && "Deluxe packaging"}
                            {![1500, 2500, 3500, 4500].includes(orderData.additionalCharges.woodPackaging) &&
                              "Custom packaging"}
                          </td>
                          <td className="border border-gray-200 px-3 py-2 text-right text-sm">
                            ₹{orderData.additionalCharges.woodPackaging.toLocaleString()}
                          </td>
                        </tr>
                      )}
                      {orderData.additionalCharges.insurance > 0 && (
                        <tr>
                          <td className="border border-gray-200 px-3 py-2 text-sm font-medium">Insurance</td>
                          <td className="border border-gray-200 px-3 py-2 text-sm text-gray-600">
                            ₹345 per lakh of billing amount
                          </td>
                          <td className="border border-gray-200 px-3 py-2 text-right text-sm">
                            ₹{orderData.additionalCharges.insurance.toLocaleString()}
                          </td>
                        </tr>
                      )}
                      {orderData.additionalCharges.transportAdvance > 0 && (
                        <tr>
                          <td className="border border-gray-200 px-3 py-2 text-sm font-medium">Transport Advance</td>
                          <td className="border border-gray-200 px-3 py-2 text-sm text-gray-600">
                            Transportation advance payment
                          </td>
                          <td className="border border-gray-200 px-3 py-2 text-right text-sm">
                            ₹{orderData.additionalCharges.transportAdvance.toLocaleString()}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Updated Total Calculation */}
            <div>
              <h3 className="text-lg font-medium mb-3">Order Summary</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Items Subtotal:</span>
                    <span>
                      ₹
                      {orderData.items
                        .reduce((total: number, item: any) => total + item.price * item.quantity, 0)
                        .toLocaleString()}
                    </span>
                  </div>

                  {orderData.additionalCharges && (
                    <>
                      {orderData.additionalCharges.loadingFee > 0 && (
                        <div className="flex justify-between">
                          <span>Loading Fee:</span>
                          <span>₹{orderData.additionalCharges.loadingFee.toLocaleString()}</span>
                        </div>
                      )}
                      {orderData.additionalCharges.woodPackaging > 0 && (
                        <div className="flex justify-between">
                          <span>Wood Packaging:</span>
                          <span>₹{orderData.additionalCharges.woodPackaging.toLocaleString()}</span>
                        </div>
                      )}
                      {orderData.additionalCharges.insurance > 0 && (
                        <div className="flex justify-between">
                          <span>Insurance:</span>
                          <span>₹{orderData.additionalCharges.insurance.toLocaleString()}</span>
                        </div>
                      )}
                      {orderData.additionalCharges.transportAdvance > 0 && (
                        <div className="flex justify-between">
                          <span>Transport Advance:</span>
                          <span>₹{orderData.additionalCharges.transportAdvance.toLocaleString()}</span>
                        </div>
                      )}
                      <hr className="my-2" />
                      <div className="flex justify-between">
                        <span>Subtotal before GST:</span>
                        <span>
                          ₹{(orderData.totalAmount - (orderData.additionalCharges.gstAmount || 0)).toLocaleString()}
                        </span>
                      </div>
                      {orderData.additionalCharges.gstAmount > 0 && (
                        <div className="flex justify-between">
                          <span>GST ({orderData.additionalCharges.gstRate}%):</span>
                          <span>₹{orderData.additionalCharges.gstAmount.toLocaleString()}</span>
                        </div>
                      )}
                    </>
                  )}

                  <hr className="my-2" />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total Amount:</span>
                    <span className="text-primary">₹{orderData.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            {orderData.shippingAddress && (
              <div>
                <h3 className="text-lg font-medium mb-2">Shipping Address</h3>
                <div className="text-sm text-gray-600">
                  <p>{orderData.shippingAddress.street}</p>
                  <p>
                    {orderData.shippingAddress.city}, {orderData.shippingAddress.state}{" "}
                    {orderData.shippingAddress.postalCode}
                  </p>
                  <p>{orderData.shippingAddress.country}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
