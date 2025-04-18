"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2 } from "lucide-react"
import { fetchWithAdminAuth } from "@/lib/admin-auth"

export default function OrderDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.orderId as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [orderData, setOrderData] = useState<any>(null)

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
          setOrderData(data.data)
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
          <p className="text-muted-foreground">
            This is a placeholder for the order details page. In a complete implementation, this would show detailed
            information about the order, including items, pricing, shipping details, and order status.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
