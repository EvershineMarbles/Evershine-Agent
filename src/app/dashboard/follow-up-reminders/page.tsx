"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import {
  Calendar,
  Clock,
  Filter,
  MessageSquare,
  Phone,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Send,
  RefreshCw,
  Loader2,
} from "lucide-react"
import { format, isAfter, isBefore, addDays } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

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
  reminderAttempts?: number
  lastReminderAt?: string
}

interface FollowUpStatistics {
  byStatus: Array<{
    _id: string
    count: number
  }>
  overdue: number
  upcoming: number
}

export default function FollowUpRemindersPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("all")
  const [followUps, setFollowUps] = useState<FollowUpReminder[]>([])
  const [filteredFollowUps, setFilteredFollowUps] = useState<FollowUpReminder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDateRange, setSelectedDateRange] = useState("all")
  const [statistics, setStatistics] = useState<FollowUpStatistics | null>(null)
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUpReminder | null>(null)
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false)
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
  const [messageText, setMessageText] = useState("")
  const [completionNotes, setCompletionNotes] = useState("")
  const [newStatus, setNewStatus] = useState<string>("completed")
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: "ascending" | "descending"
  }>({
    key: "followUpDate",
    direction: "ascending",
  })

  const getApiUrl = () => {
    return process.env.NEXT_PUBLIC_API_URL || "https://evershinebackend-2.onrender.com"
  }

  const getToken = () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        toast({
          title: "Authentication required",
          description: "Please log in to view follow-up reminders",
          variant: "destructive",
        })
        router.push("/login")
        return null
      }
      return token
    } catch (e) {
      toast({
        title: "Error",
        description: "Error accessing authentication. Please refresh the page.",
        variant: "destructive",
      })
      return null
    }
  }

  const fetchFollowUps = async () => {
    try {
      setLoading(true)
      const token = getToken()
      if (!token) return

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
      toast({
        title: "Error",
        description: error.message || "Failed to load follow-up reminders",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStatistics = async () => {
    try {
      const token = getToken()
      if (!token) return

      const apiUrl = getApiUrl()
      const response = await fetch(`${apiUrl}/api/followups/statistics`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch statistics")
      }

      const data = await response.json()
      if (data.success) {
        setStatistics(data.data || null)
      }
    } catch (error: any) {
      console.error("Error fetching statistics:", error)
    }
  }

  useEffect(() => {
    fetchFollowUps()
    fetchStatistics()
  }, [])

  useEffect(() => {
    if (followUps.length > 0) {
      applyFilters()
    }
  }, [activeTab, searchQuery, selectedDateRange, followUps, sortConfig])

  const applyFilters = () => {
    let filtered = [...followUps]

    // Filter by tab (status)
    if (activeTab !== "all") {
      if (activeTab === "overdue") {
        filtered = filtered.filter(
          (item) => item.status === "pending" && isBefore(new Date(item.followUpDate), new Date()),
        )
      } else if (activeTab === "upcoming") {
        const today = new Date()
        const nextWeek = addDays(today, 7)
        filtered = filtered.filter(
          (item) =>
            item.status === "pending" &&
            isAfter(new Date(item.followUpDate), today) &&
            isBefore(new Date(item.followUpDate), nextWeek),
        )
      } else {
        filtered = filtered.filter((item) => item.status === activeTab)
      }
    }

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
        startOfWeek.setDate(today.getDate() - today.getDay()) // Start of week (Sunday)
        const endOfWeek = new Date(today)
        endOfWeek.setDate(startOfWeek.getDate() + 6) // End of week (Saturday)

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

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = getValueByKey(a, sortConfig.key)
      const bValue = getValueByKey(b, sortConfig.key)

      if (aValue < bValue) {
        return sortConfig.direction === "ascending" ? -1 : 1
      }
      if (aValue > bValue) {
        return sortConfig.direction === "ascending" ? 1 : -1
      }
      return 0
    })

    setFilteredFollowUps(filtered)
  }

  const getValueByKey = (obj: any, key: string) => {
    if (key === "clientName") {
      return obj.clientId?.name || ""
    }
    if (key === "orderAmount") {
      return obj.orderId?.totalAmount || 0
    }
    if (key === "orderStatus") {
      return obj.orderId?.status || ""
    }
    if (key === "orderId") {
      return obj.orderId?.orderId || ""
    }
    return obj[key] || ""
  }

  const handleSort = (key: string) => {
    let direction: "ascending" | "descending" = "ascending"
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })
  }

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) {
      return <ChevronDown className="h-4 w-4 opacity-50" />
    }
    return sortConfig.direction === "ascending" ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    )
  }

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const handleSendMessage = async () => {
    if (!selectedFollowUp || !messageText.trim()) return

    try {
      setIsSendingMessage(true)
      const token = getToken()
      if (!token) return

      const apiUrl = getApiUrl()
      const response = await fetch(`${apiUrl}/api/followups/${selectedFollowUp._id}/message`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: messageText,
          clientId: selectedFollowUp.clientId._id,
          orderId: selectedFollowUp.orderId._id,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send message")
      }

      const data = await response.json()
      if (data.success) {
        toast({
          title: "Message Sent",
          description: "Follow-up message has been sent successfully",
        })
        setIsMessageDialogOpen(false)
        setMessageText("")
        // Refresh follow-ups to get updated status
        fetchFollowUps()
      } else {
        throw new Error(data.message || "Failed to send message")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      })
    } finally {
      setIsSendingMessage(false)
    }
  }

  const handleUpdateStatus = async () => {
    if (!selectedFollowUp || !newStatus) return

    try {
      setIsUpdatingStatus(true)
      const token = getToken()
      if (!token) return

      const apiUrl = getApiUrl()
      const response = await fetch(`${apiUrl}/api/followups/${selectedFollowUp._id}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          completionNotes: completionNotes,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update status")
      }

      const data = await response.json()
      if (data.success) {
        toast({
          title: "Status Updated",
          description: `Follow-up has been marked as ${newStatus}`,
        })
        setIsStatusDialogOpen(false)
        setCompletionNotes("")
        // Refresh follow-ups to get updated status
        fetchFollowUps()
        fetchStatistics()
      } else {
        throw new Error(data.message || "Failed to update status")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingStatus(false)
    }
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

  const getStatCount = (status: string) => {
    if (!statistics) return 0
    const found = statistics.byStatus.find((item) => item._id === status)
    return found ? found.count : 0
  }

  const renderSkeletons = () => {
    return Array(5)
      .fill(0)
      .map((_, index) => (
        <Card key={index} className="mb-4">
          <CardHeader className="pb-2">
            <div className="flex justify-between">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-24" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-4 w-full" />
            </div>
          </CardContent>
          <CardFooter>
            <div className="flex justify-end w-full gap-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
            </div>
          </CardFooter>
        </Card>
      ))
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Follow-up Reminders</h1>
          <p className="text-muted-foreground">Manage and track all your client follow-up reminders</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => {
              fetchFollowUps()
              fetchStatistics()
            }}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Follow-ups</p>
                <p className="text-2xl font-bold">
                  {loading ? <Skeleton className="h-8 w-16 inline-block" /> : followUps.length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">
                  {loading ? <Skeleton className="h-8 w-16 inline-block" /> : getStatCount("pending")}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold">
                  {loading ? <Skeleton className="h-8 w-16 inline-block" /> : statistics?.overdue || 0}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">
                  {loading ? <Skeleton className="h-8 w-16 inline-block" /> : getStatCount("completed")}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleSort("followUpDate")}>By Follow-up Date</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort("clientName")}>By Client Name</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort("orderAmount")}>By Order Amount</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort("createdAt")}>By Creation Date</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid grid-cols-5 md:w-fit">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Follow-up List */}
      <div className="space-y-4">
        {loading ? (
          renderSkeletons()
        ) : filteredFollowUps.length === 0 ? (
          <div className="text-center py-12 bg-muted/20 rounded-lg">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No follow-up reminders found</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {activeTab !== "all"
                ? `No ${activeTab} follow-up reminders match your filters.`
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
                <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpand(followUp._id)}
                    className="w-full sm:w-auto"
                  >
                    {isExpanded ? "Show Less" : "Show More"}
                    <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </Button>
                  <div className="flex gap-2 w-full sm:w-auto">
                    {followUp.status === "pending" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 sm:flex-none"
                          onClick={() => {
                            setSelectedFollowUp(followUp)
                            setIsMessageDialogOpen(true)
                          }}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Send Message
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1 sm:flex-none"
                          onClick={() => {
                            setSelectedFollowUp(followUp)
                            setNewStatus("completed")
                            setIsStatusDialogOpen(true)
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Mark Complete
                        </Button>
                      </>
                    )}
                    {followUp.status !== "pending" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 sm:flex-none"
                        onClick={() => {
                          setSelectedFollowUp(followUp)
                          setNewStatus("pending")
                          setIsStatusDialogOpen(true)
                        }}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Reopen
                      </Button>
                    )}
                  </div>
                </CardFooter>
              </Card>
            )
          })
        )}
      </div>

      {/* Send Message Dialog */}
      <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Follow-up Message</DialogTitle>
            <DialogDescription>
              Send a WhatsApp message to <span className="font-medium">{selectedFollowUp?.clientId?.name}</span>{" "}
              regarding order #{selectedFollowUp?.orderId?.orderId}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Client Phone</p>
              <p className="text-sm">{selectedFollowUp?.clientId?.mobile || "No phone number"}</p>
            </div>
            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-medium">
                Message
              </label>
              <Textarea
                id="message"
                placeholder="Type your follow-up message here..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                rows={5}
              />
              <p className="text-xs text-muted-foreground">
                This message will be sent via WhatsApp to the client's registered number.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMessageDialogOpen(false)} disabled={isSendingMessage}>
              Cancel
            </Button>
            <Button onClick={handleSendMessage} disabled={isSendingMessage || !messageText.trim()}>
              {isSendingMessage ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Message
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {newStatus === "completed"
                ? "Mark Follow-up as Complete"
                : newStatus === "cancelled"
                  ? "Cancel Follow-up"
                  : "Update Follow-up Status"}
            </DialogTitle>
            <DialogDescription>
              {newStatus === "completed"
                ? "Mark this follow-up as completed and add any notes about the outcome."
                : newStatus === "cancelled"
                  ? "Cancel this follow-up and provide a reason."
                  : "Update the status of this follow-up reminder."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Order</p>
              <p className="text-sm">#{selectedFollowUp?.orderId?.orderId}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Client</p>
              <p className="text-sm">{selectedFollowUp?.clientId?.name}</p>
            </div>
            {newStatus !== "pending" && (
              <div className="space-y-2">
                <label htmlFor="notes" className="text-sm font-medium">
                  {newStatus === "completed" ? "Completion Notes" : "Reason"}
                </label>
                <Textarea
                  id="notes"
                  placeholder={
                    newStatus === "completed"
                      ? "Add notes about the follow-up outcome..."
                      : "Provide a reason for cancellation..."
                  }
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  rows={3}
                />
              </div>
            )}
            {newStatus === "pending" && (
              <div className="bg-yellow-50 p-3 rounded-md">
                <p className="text-sm text-yellow-800">
                  This will reopen the follow-up and set it back to pending status.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)} disabled={isUpdatingStatus}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateStatus}
              disabled={isUpdatingStatus}
              variant={newStatus === "completed" ? "default" : "secondary"}
            >
              {isUpdatingStatus ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : newStatus === "completed" ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark as Complete
                </>
              ) : newStatus === "cancelled" ? (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel Follow-up
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reopen Follow-up
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
