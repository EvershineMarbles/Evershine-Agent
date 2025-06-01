"use client"

import { useState, useEffect } from "react"
import { Calendar, MessageSquare, Plus, Loader2, CheckCircle } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"

interface Order {
  _id: string
  orderId: string
  totalAmount: number
  status: string
  createdAt: string
  clientName: string
  agentId: string
  followUpReminder?: {
    _id: string
    followUpDate: string
    status: string
    comment: string
    period: string
    customDays?: number
  }
}

export default function AgentOrdersPage() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [followUpPeriod, setFollowUpPeriod] = useState("")
  const [customDays, setCustomDays] = useState("")
  const [comment, setComment] = useState("")
  const [creating, setCreating] = useState(false)

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

      const response = await fetch("https://evershinebackend-2.onrender.com/api/agent/orders-with-followups", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log("Orders Response:", data)
        setOrders(data.data || [])
        toast({
          title: "Success",
          description: `Loaded ${data.data?.length || 0} orders`,
        })
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

  const createFollowUp = async () => {
    if (!selectedOrder || !followUpPeriod) {
      toast({
        title: "Error",
        description: "Please select a period for the follow-up",
        variant: "destructive",
      })
      return
    }

    if (followUpPeriod === "custom" && (!customDays || Number.parseInt(customDays) < 1)) {
      toast({
        title: "Error",
        description: "Please enter valid custom days (1-365)",
        variant: "destructive",
      })
      return
    }

    try {
      setCreating(true)
      const token = localStorage.getItem("token") || localStorage.getItem("agentToken")

      const requestBody = {
        period: followUpPeriod,
        customDays: followUpPeriod === "custom" ? Number.parseInt(customDays) : undefined,
        comment: comment.trim(),
      }

      const response = await fetch(
        `https://evershinebackend-2.onrender.com/api/agent/orders/${selectedOrder.orderId}/followup`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        },
      )

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Success",
          description: "Follow-up reminder created successfully",
        })

        // Refresh orders to show the new follow-up
        await fetchOrders()

        // Reset form
        setSelectedOrder(null)
        setFollowUpPeriod("")
        setCustomDays("")
        setComment("")
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to create follow-up")
      }
    } catch (error: any) {
      console.error("Error creating follow-up:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create follow-up reminder",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const getStatusBadge = (status: string) => {
    const statusColors = {
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      shipped: "bg-purple-100 text-purple-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    }

    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
        {status}
      </Badge>
    )
  }

  const getFollowUpStatusBadge = (status: string) => {
    const statusColors = {
      pending: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-gray-100 text-gray-800",
      overdue: "bg-red-100 text-red-800",
    }

    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
        {status}
      </Badge>
    )
  }

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
        <h1 className="text-2xl font-bold">All Client Orders</h1>
        <p className="text-muted-foreground">Manage follow-up reminders for all your client orders</p>
      </div>

      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No orders found</h3>
            <p className="text-muted-foreground">No orders from your clients yet.</p>
          </div>
        ) : (
          orders.map((order) => (
            <Card key={order._id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">Order #{order.orderId}</h3>
                    <p className="text-sm text-muted-foreground">Client: {order.clientName}</p>
                    <p className="text-sm text-muted-foreground">
                      Amount: ₹{order.totalAmount?.toLocaleString() || "0"}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm">Status:</span>
                      {getStatusBadge(order.status)}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      Order Date: {format(new Date(order.createdAt), "dd MMM yyyy")}
                    </p>
                    {order.followUpReminder && (
                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground">
                          Follow-up: {format(new Date(order.followUpReminder.followUpDate), "dd MMM yyyy")}
                        </p>
                        <div className="flex justify-end mt-1">
                          {getFollowUpStatusBadge(order.followUpReminder.status)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {order.followUpReminder ? (
                  <div className="space-y-2">
                    <p className="text-sm">
                      <strong>Follow-up Status:</strong> {order.followUpReminder.status}
                    </p>
                    <p className="text-sm">
                      <strong>Period:</strong>{" "}
                      {order.followUpReminder.period === "custom"
                        ? `${order.followUpReminder.customDays} days`
                        : order.followUpReminder.period === "7days"
                          ? "7 days"
                          : order.followUpReminder.period === "10days"
                            ? "10 days"
                            : "1 month"}
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
                      <Button size="sm">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Mark Complete
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">No follow-up reminder set</p>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" onClick={() => setSelectedOrder(order)}>
                          <Plus className="h-4 w-4 mr-1" />
                          Create Follow-up
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Create Follow-up Reminder</DialogTitle>
                          <DialogDescription>
                            Set up a follow-up reminder for Order #{selectedOrder?.orderId}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="period">Follow-up Period</Label>
                            <Select value={followUpPeriod} onValueChange={setFollowUpPeriod}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select period" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="7days">7 days</SelectItem>
                                <SelectItem value="10days">10 days</SelectItem>
                                <SelectItem value="1month">1 month</SelectItem>
                                <SelectItem value="custom">Custom</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {followUpPeriod === "custom" && (
                            <div className="grid gap-2">
                              <Label htmlFor="customDays">Custom Days</Label>
                              <Input
                                id="customDays"
                                type="number"
                                placeholder="Enter number of days (1-365)"
                                value={customDays}
                                onChange={(e) => setCustomDays(e.target.value)}
                                min="1"
                                max="365"
                              />
                            </div>
                          )}
                          <div className="grid gap-2">
                            <Label htmlFor="comment">Comment (Optional)</Label>
                            <Textarea
                              id="comment"
                              placeholder="Add any notes for this follow-up..."
                              value={comment}
                              onChange={(e) => setComment(e.target.value)}
                              maxLength={500}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit" onClick={createFollowUp} disabled={creating || !followUpPeriod}>
                            {creating ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Creating...
                              </>
                            ) : (
                              "Create Follow-up"
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
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
