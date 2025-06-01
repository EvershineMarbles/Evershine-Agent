"use client"

import { useState, useEffect } from "react"
import { Calendar, MessageSquare, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"

interface Order {
  _id: string
  orderId: string
  totalAmount: number
  status: string
  createdAt: string
  clientId: {
    name: string
    mobile: string
    email: string
  }
  followUpReminder?: {
    _id: string
    followUpDate: string
    status: string
    comment: string
  }
}

export default function FollowUpRemindersPage() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token") || localStorage.getItem("agentToken")

      if (!token) {
        toast({
          title: "Error",
          description: "Please log in to view orders",
          variant: "destructive",
        })
        return
      }

      const response = await fetch("https://evershinebackend-2.onrender.com/api/agent/followups", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log("API Response:", data)
        setOrders(data.data || [])
      } else {
        throw new Error("Failed to fetch orders")
      }
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading orders...</span>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Follow-up Reminders</h1>
        <p className="text-muted-foreground">Orders with follow-up reminders</p>
      </div>

      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No orders found</h3>
            <p className="text-muted-foreground">No orders with follow-up reminders yet.</p>
          </div>
        ) : (
          orders.map((order) => (
            <Card key={order._id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">Order #{order.orderId}</h3>
                    <p className="text-sm text-muted-foreground">Client: {order.clientId?.name || "Unknown"}</p>
                    <p className="text-sm text-muted-foreground">
                      Amount: ₹{order.totalAmount?.toLocaleString() || "0"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      Order Date: {format(new Date(order.createdAt), "dd MMM yyyy")}
                    </p>
                    {order.followUpReminder && (
                      <p className="text-sm text-muted-foreground">
                        Follow-up: {format(new Date(order.followUpReminder.followUpDate), "dd MMM yyyy")}
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {order.followUpReminder ? (
                  <div className="space-y-2">
                    <p className="text-sm">
                      <strong>Status:</strong> {order.followUpReminder.status}
                    </p>
                    {order.followUpReminder.comment && (
                      <p className="text-sm">
                        <strong>Comment:</strong> {order.followUpReminder.comment}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Send Reminder
                      </Button>
                      <Button size="sm">Mark Complete</Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">No follow-up reminder set</p>
                    <Button size="sm" variant="outline">
                      Create Follow-up
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
