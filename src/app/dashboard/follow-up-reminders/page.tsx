"use client"

import { useState, useEffect } from "react"
import {
  Calendar,
  Clock,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  MessageSquare,
  Phone,
  RefreshCw,
  Loader2,
} from "lucide-react"
import { format, isBefore } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"

interface FollowUpReminder {
  _id: string
  orderId: {
    _id: string
    orderId: string
    totalAmount: number
    status: string
    createdAt: string
    clientName?: string
  }
  clientId: {
    _id: string
    name: string
    mobile: string
    email: string
  }
  agentId: string
  enabled: boolean
  period: string
  customDays?: number
  comment: string
  status: "pending" | "completed" | "cancelled" | "overdue"
  followUpDate: string
  createdAt: string
  updatedAt: string
  completedBy?: string
  completedAt?: string
  completionNotes?: string
  messageDetails?: {
    messageSent: boolean
    sentAt?: string
    messageId?: string
    deliveryStatus?: string
  }
}

export default function FollowUpRemindersPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("all")
  const [followUps, setFollowUps] = useState<FollowUpReminder[]>([])
  const [filteredFollowUps, setFilteredFollowUps] = useState<FollowUpReminder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDateRange, setSelectedDateRange] = useState("all")
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})

  const getApiUrl = () => {
    return process.env.NEXT_PUBLIC_API_URL || "https://evershinebackend-2.onrender.com"
  }

  const getToken = () => {
    try {
      return localStorage.getItem("token") || localStorage.getItem("agentToken") || localStorage.getItem("adminToken")
    } catch (e) {
      return null
    }
  }

  const fetchFollowUps = async () => {
    try {
      setLoading(true)
      const token = getToken()

      if (!token) {
        console.log("No token found, using sample data")
        setFollowUps([])
        setFilteredFollowUps([])
        setLoading(false)
        return
      }

      const apiUrl = getApiUrl()
      const response = await fetch(`${apiUrl}/api/agent/followups`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch follow-ups")
      }

      const data = await response.json()
      if (data.success) {
        setFollowUps(data.data || [])
        setFilteredFollowUps(data.data || [])
      } else {
        throw new Error(data.message || "Failed to fetch follow-ups")
      }
    } catch (error: any) {
      console.error("Error fetching follow-ups:", error)
      toast({
        title: "Error",
        description: "Failed to load follow-up reminders. Showing empty list.",
        variant: "destructive",
      })
      setFollowUps([])
      setFilteredFollowUps([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFollowUps()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [activeTab, searchQuery, selectedDateRange, followUps])

  const applyFilters = () => {
    let filtered = [...followUps]

    // Filter by tab (status)
    if (activeTab === "pending") {
      filtered = filtered.filter((item) => item.status === "pending")
    }
    // "all" tab shows everything, no filtering needed

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (item) =>
          (item.orderId?.orderId && item.orderId.orderId.toLowerCase().includes(query)) ||
          (item.clientId?.name && item.clientId.name.toLowerCase().includes(query)) ||
          (item.comment && item.comment.toLowerCase().includes(query)),
      )
    }

    // Filter by date range
    if (selectedDateRange !== "all") {
      const today = new Date()
      if (selectedDateRange === "today") {
        filtered = filtered.filter((item) => {
          const followUpDate = new Date(item.followUpDate)
          return (
            followUpDate.getDate() === today.getDate() &&
            followUpDate.getMonth() === today.getMonth() &&
            followUpDate.getFullYear() === today.getFullYear()
          )
        })
      } else if (selectedDateRange === "thisWeek") {
        const startOfWeek = new Date(today)
        startOfWeek.setDate(today.getDate() - today.getDay())
        const endOfWeek = new Date(today)
        endOfWeek.setDate(startOfWeek.getDate() + 6)

        filtered = filtered.filter((item) => {
          const followUpDate = new Date(item.followUpDate)
          return followUpDate >= startOfWeek && followUpDate <= endOfWeek
        })
      } else if (selectedDateRange === "thisMonth") {
        filtered = filtered.filter((item) => {
          const followUpDate = new Date(item.followUpDate)
          return followUpDate.getMonth() === today.getMonth() && followUpDate.getFullYear() === today.getFullYear()
        })
      }
    }

    // Sort by follow-up date (ascending)
    filtered.sort((a, b) => {
      return new Date(a.followUpDate).getTime() - new Date(b.followUpDate).getTime()
    })

    setFilteredFollowUps(filtered)
  }

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const getStatusBadge = (status: string, followUpDate: string) => {
    const isPastDue = isBefore(new Date(followUpDate), new Date()) && status === "pending"

    if (isPastDue) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Overdue
        </Badge>
      )
    }

    switch (status) {
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Completed
          </Badge>
        )
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Cancelled
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800">
            {status}
          </Badge>
        )
    }
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Follow-up Reminders</h1>
          <p className="text-muted-foreground">Manage and track all your client follow-up reminders</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button variant="outline" className="flex items-center gap-2" onClick={fetchFollowUps}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by order ID, client name or comment..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <SelectValue placeholder="Date Range" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="thisWeek">This Week</SelectItem>
              <SelectItem value="thisMonth">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs - Only All and Pending */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid grid-cols-2 md:w-fit">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Follow-up List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading follow-up reminders...</p>
          </div>
        ) : filteredFollowUps.length === 0 ? (
          <div className="text-center py-12 bg-muted/20 rounded-lg">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No follow-up reminders found</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {activeTab === "pending"
                ? "No pending follow-up reminders match your filters."
                : "No follow-up reminders match your search criteria."}
            </p>
          </div>
        ) : (
          filteredFollowUps.map((followUp) => {
            const isExpanded = expandedItems[followUp._id] || false
            const isPastDue = followUp.status === "pending" && isBefore(new Date(followUp.followUpDate), new Date())
            const isToday =
              followUp.status === "pending" &&
              new Date(followUp.followUpDate).toDateString() === new Date().toDateString()

            return (
              <Card
                key={followUp._id}
                className={`border ${
                  isPastDue ? "border-red-300 bg-red-50" : isToday ? "border-yellow-300 bg-yellow-50" : ""
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">Order #{followUp.orderId?.orderId || "N/A"}</h3>
                      {getStatusBadge(followUp.status, followUp.followUpDate)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Follow-up:{" "}
                        {followUp.followUpDate ? format(new Date(followUp.followUpDate), "dd MMM yyyy") : "Not set"}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Client:</span>
                        <span>{followUp.clientId?.name || "Unknown"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Amount:</span>
                        <span>₹{followUp.orderId?.totalAmount?.toLocaleString() || "0"}</span>
                      </div>
                    </div>

                    {followUp.comment && (
                      <div className="bg-muted/30 p-2 rounded-md mt-2">
                        <p className="text-sm">
                          <span className="font-medium">Comment:</span> {followUp.comment}
                        </p>
                      </div>
                    )}

                    {isExpanded && (
                      <div className="mt-4 space-y-3 pt-3 border-t">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium mb-1">Client Details</h4>
                            <div className="space-y-1">
                              <p className="text-sm flex items-center gap-2">
                                <Phone className="h-3 w-3" />
                                {followUp.clientId?.mobile || "No phone"}
                              </p>
                              <p className="text-sm flex items-center gap-2">
                                <MessageSquare className="h-3 w-3" />
                                {followUp.clientId?.email || "No email"}
                              </p>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium mb-1">Follow-up Details</h4>
                            <div className="space-y-1">
                              <p className="text-sm">
                                <span className="font-medium">Period:</span>{" "}
                                {followUp.period === "custom"
                                  ? `${followUp.customDays} days`
                                  : followUp.period === "7days"
                                    ? "7 days"
                                    : followUp.period === "10days"
                                      ? "10 days"
                                      : "1 month"}
                              </p>
                              <p className="text-sm">
                                <span className="font-medium">Created:</span>{" "}
                                {format(new Date(followUp.createdAt), "dd MMM yyyy")}
                              </p>
                              {followUp.status === "completed" && followUp.completedAt && (
                                <p className="text-sm">
                                  <span className="font-medium">Completed:</span>{" "}
                                  {format(new Date(followUp.completedAt), "dd MMM yyyy")}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {followUp.completionNotes && (
                          <div className="bg-muted/30 p-2 rounded-md">
                            <p className="text-sm">
                              <span className="font-medium">Completion Notes:</span> {followUp.completionNotes}
                            </p>
                          </div>
                        )}

                        {followUp.messageDetails?.messageSent && (
                          <div className="bg-blue-50 p-2 rounded-md">
                            <p className="text-sm flex items-center gap-1">
                              <MessageSquare className="h-3 w-3 text-blue-600" />
                              <span className="font-medium">Message sent:</span>{" "}
                              {followUp.messageDetails.sentAt
                                ? format(new Date(followUp.messageDetails.sentAt), "dd MMM yyyy HH:mm")
                                : "Unknown time"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Status: {followUp.messageDetails.deliveryStatus || "Unknown"}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                  <Button variant="ghost" size="sm" onClick={() => toggleExpand(followUp._id)}>
                    {isExpanded ? "Show Less" : "Show More"}
                    <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </Button>
                  <div className="flex gap-2">
                    {followUp.status === "pending" && (
                      <>
                        <Button variant="outline" size="sm">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Send Message
                        </Button>
                        <Button variant="default" size="sm">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Mark Complete
                        </Button>
                      </>
                    )}
                  </div>
                </CardFooter>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
