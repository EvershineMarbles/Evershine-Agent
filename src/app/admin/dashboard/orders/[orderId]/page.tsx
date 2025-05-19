"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2, FileText, Package } from 'lucide-react'
import { fetchWithAdminAuth } from "@/lib/admin-auth"

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
         <div className="space-y-4">
           <div>
             <h3 className="text-lg font-medium">Order Information</h3>
             <p className="text-muted-foreground">
               Order Date: {formatDate(orderData.createdAt)}
               <br />
               Status: {orderData.status}
               <br />
               Payment Status: {orderData.paymentStatus}
             </p>
           </div>

           <div>
           
           </div>

           <div>
             <h3 className="text-lg font-medium">Items</h3>
             <ul>
               {orderData.items.map((item: any) => (
                 <li key={item.postId} className="py-2 border-b">
                   {item.name} - Quantity: {item.quantity} - Price: ₹{item.price.toLocaleString()}
                 </li>
               ))}
             </ul>
           </div>

           <div>
             <h3 className="text-lg font-medium">Total Amount</h3>
             <p className="text-2xl font-bold">₹{orderData.totalAmount.toLocaleString()}</p>
           </div>
         </div>
       </CardContent>
     </Card>
   </div>
 )
}

