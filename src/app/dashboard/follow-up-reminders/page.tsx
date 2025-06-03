"use client"

import { useState, useEffect } from "react"
import { CalendarIcon, MessageSquare, Plus, Loader2, CheckCircle, User, IndianRupee, Package, Send } from "lucide-react"
import { format, differenceInDays } from "date-fns"
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
    messageDetails?: {
      messageSent: boolean
      sentAt?: string
      deliveryStatus: string
    }
  }
}

export default function AgentOrdersPage() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [followUpPeriod, setFollowUpPeriod] = useState("")
  const [customDays, setCustomDays] = useState("")
  const [customDate, setCustomDate] = useState<Date | undefined>(undefined)
  const [comment, setComment] = useState("")
  const [creating, setCreating] = useState(false)
  const [sendingReminder, setSendingReminder] = useState<string | null>(null)

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

    if (followUpPeriod === "custom" && (!customDate || differenceInDays(customDate, new Date()) < 1)) {
      toast({
        title: "Error",
        description: "Please select a valid future date",
        variant: "destructive",
      })
      return
    }

    try {
      setCreating(true)
      const token = localStorage.getItem("token") || localStorage.getItem("agentToken")

      const requestBody = {
        period: followUpPeriod,
        customDays: followUpPeriod === "custom" ? differenceInDays(customDate!, new Date()) : undefined,
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
        toast({
          title: "Success",
          description: "Follow-up reminder created successfully",
        })
        await fetchOrders()
        setSelectedOrder(null)
        setFollowUpPeriod("")
        setCustomDays("")
        setCustomDate(undefined)
        setComment("")
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to create follow-up")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create follow-up reminder",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  const sendWhatsAppReminder = async (followUpId: string) => {
    try {
      setSendingReminder(followUpId)
      const token = localStorage.getItem("token") || localStorage.getItem("agentToken")

      const response = await fetch(
        `https://evershinebackend-2.onrender.com/api/agent/followup/${followUpId}/send-whatsapp`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      )

      if (response.ok) {
        toast({
          title: "Success",
          description: "WhatsApp reminder sent successfully with invoice PDF!",
        })
        await fetchOrders()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to send WhatsApp reminder")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send WhatsApp reminder",
        variant: "destructive",
      })
    } finally {
      setSendingReminder(null)
    }
  }

  const markFollowUpComplete = async (followUpId: string) => {
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("agentToken")

      const response = await fetch(`https://evershinebackend-2.onrender.com/api/agent/followup/${followUpId}/status`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "completed",
          completionNotes: "Marked as complete by agent",
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Follow-up marked as complete",
        })
        await fetchOrders()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to mark follow-up as complete")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to mark follow-up as complete",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", label: "Pending" },
      processing: { color: "bg-blue-100 text-blue-800 border-blue-200", label: "Processing" },
      shipped: { color: "bg-purple-100 text-purple-800 border-purple-200", label: "Shipped" },
      delivered: { color: "bg-green-100 text-green-800 border-green-200", label: "Delivered" },
      cancelled: { color: "bg-red-100 text-red-800 border-red-200", label: "Cancelled" },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || {
      color: "bg-gray-100 text-gray-800 border-gray-200",
      label: status,
    }

    return <Badge className={`${config.color} border font-medium`}>{config.label}</Badge>
  }

  const getFollowUpStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "bg-blue-100 text-blue-800 border-blue-200", label: "Pending" },
      completed: { color: "bg-green-100 text-green-800 border-green-200", label: "Completed" },
      cancelled: { color: "bg-gray-100 text-gray-800 border-gray-200", label: "Cancelled" },
      overdue: { color: "bg-red-100 text-red-800 border-red-200", label: "Overdue" },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || {
      color: "bg-gray-100 text-gray-800 border-gray-200",
      label: status,
    }

    return <Badge className={`${config.color} border font-medium`}>{config.label}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading orders...</span>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">All Client Orders</h1>
        <p className="text-gray-600 mt-2">Manage follow-up reminders for all your client orders</p>
      </div>

      <div className="space-y-6">
        {orders.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-500">No orders from your clients yet.</p>
          </div>
        ) : (
          orders.map((order) => (
            <Card key={order._id} className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">{order.clientName}</h2>
                        <p className="text-sm text-gray-500">Client</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-500" />
                        <span className="font-medium text-gray-900">#{order.orderId}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <IndianRupee className="h-4 w-4 text-gray-500" />
                        <span className="font-semibold text-lg text-gray-900">
                          ₹{order.totalAmount?.toLocaleString() || "0"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Status:</span>
                        {getStatusBadge(order.status)}
                      </div>
                    </div>
                  </div>

                  <div className="text-left lg:text-right space-y-2">
                    <div className="flex items-center gap-2 lg:justify-end">
                      <CalendarIcon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        Order Date: {format(new Date(order.createdAt), "dd MMM yyyy")}
                      </span>
                    </div>
                    {order.followUpReminder && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 lg:justify-end">
                          <MessageSquare className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            Follow-up: {format(new Date(order.followUpReminder.followUpDate), "dd MMM yyyy")}
                          </span>
                        </div>
                        <div className="flex lg:justify-end">
                          {getFollowUpStatusBadge(order.followUpReminder.status)}
                        </div>
                        {order.followUpReminder.messageDetails?.messageSent && (
                          <div className="flex items-center gap-2 lg:justify-end">
                            <Send className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-green-600">
                              WhatsApp sent:{" "}
                              {format(new Date(order.followUpReminder.messageDetails.sentAt!), "dd MMM yyyy")}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {order.followUpReminder ? (
                  <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                    <h4 className="font-semibold text-gray-900 mb-3">Follow-up Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Status:</span>
                        <p className="mt-1">{getFollowUpStatusBadge(order.followUpReminder.status)}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Period:</span>
                        <p className="mt-1 text-sm text-gray-900">
                          {order.followUpReminder.period === "custom"
                            ? `${order.followUpReminder.customDays} days`
                            : order.followUpReminder.period === "7days"
                              ? "7 days"
                              : order.followUpReminder.period === "10days"
                                ? "10 days"
                                : "1 month"}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Comment:</span>
                        <p className="mt-1 text-sm text-gray-900">{order.followUpReminder.comment || "No comment"}</p>
                      </div>
                    </div>
                    {order.followUpReminder.messageDetails?.messageSent && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <Send className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">WhatsApp Reminder Sent</span>
                        </div>
                        <p className="text-sm text-green-700 mt-1">
                          Invoice PDF sent on{" "}
                          {format(new Date(order.followUpReminder.messageDetails.sentAt!), "dd MMM yyyy 'at' HH:mm")}
                        </p>
                        <p className="text-sm text-green-600">
                          Status: {order.followUpReminder.messageDetails.deliveryStatus}
                        </p>
                      </div>
                    )}
                    <div className="flex gap-3 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={() => sendWhatsAppReminder(order.followUpReminder!._id)}
                        disabled={sendingReminder === order.followUpReminder!._id}
                      >
                        {sendingReminder === order.followUpReminder!._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <MessageSquare className="h-4 w-4" />
                        )}
                        Send WhatsApp Reminder
                      </Button>
                      <Button
                        size="sm"
                        className="flex items-center gap-2"
                        onClick={() => markFollowUpComplete(order.followUpReminder!._id)}
                        disabled={order.followUpReminder.status === "completed"}
                      >
                        <CheckCircle className="h-4 w-4" />
                        Mark Complete
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-gray-600 mb-3">No follow-up reminder set for this order</p>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="default"
                          className="flex items-center gap-2"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <Plus className="h-4 w-4" />
                          Create Follow-up Reminder
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>Create Follow-up Reminder</DialogTitle>
                          <DialogDescription>
                            Set up a follow-up reminder for <strong>{selectedOrder?.clientName}</strong> - Order #
                            {selectedOrder?.orderId}
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
                              <Label>Enter Follow-up Date</Label>
                              <input
                                type="date"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                min={new Date(Date.now() + 86400000).toISOString().split("T")[0]} // Tomorrow
                                value={customDate ? customDate.toISOString().split("T")[0] : ""}
                                onChange={(e) => {
                                  const date = e.target.value ? new Date(e.target.value) : undefined
                                  setCustomDate(date)
                                }}
                              />
                              {customDate && (
                                <p className="text-sm text-gray-600">
                                  Follow-up in {differenceInDays(customDate, new Date())} days
                                </p>
                              )}
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
