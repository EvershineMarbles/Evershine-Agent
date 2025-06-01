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
} from "lucide-react"
import { format, isAfter, isBefore, addDays } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

// Sample data for demonstration
const SAMPLE_FOLLOWUPS: FollowUpReminder[] = [
  {
    _id: "1",
    orderId: {
      _id: "order1",
      orderId: "ORD-001",
      totalAmount: 25000,
      status: "delivered",
      createdAt: "2023-05-15T10:30:00Z",
    },
    clientId: {
      _id: "client1",
      name: "Rajesh Kumar",
      mobile: "+91 98765 43210",
      email: "rajesh@example.com",
    },
    agentId: "agent1",
    enabled: true,
    period: "7days",
    comment: "Follow up about the marble quality and installation feedback",
    status: "pending",
    followUpDate: new Date().toISOString(), // Today
    createdAt: "2023-05-15T10:30:00Z",
    updatedAt: "2023-05-15T10:30:00Z",
  },
  {
    _id: "2",
    orderId: {
      _id: "order2",
      orderId: "ORD-002",
      totalAmount: 45000,
      status: "processing",
      createdAt: "2023-05-10T14:20:00Z",
    },
    clientId: {
      _id: "client2",
      name: "Priya Sharma",
      mobile: "+91 87654 32109",
      email: "priya@example.com",
    },
    agentId: "agent1",
    enabled: true,
    period: "10days",
    comment: "Check if they need additional granite pieces for the kitchen countertop",
    status: "pending",
    followUpDate: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(), // 2 days ago (overdue)
    createdAt: "2023-05-10T14:20:00Z",
    updatedAt: "2023-05-10T14:20:00Z",
  },
  {
    _id: "3",
    orderId: {
      _id: "order3",
      orderId: "ORD-003",
      totalAmount: 18000,
      status: "delivered",
      createdAt: "2023-04-28T09:15:00Z",
    },
    clientId: {
      _id: "client3",
      name: "Amit Patel",
      mobile: "+91 76543 21098",
      email: "amit@example.com",
    },
    agentId: "agent1",
    enabled: true,
    period: "1month",
    comment: "Follow up for potential new order for office renovation",
    status: "completed",
    followUpDate: "2023-05-28T09:15:00Z",
    createdAt: "2023-04-28T09:15:00Z",
    updatedAt: "2023-05-28T10:00:00Z",
    completedBy: "agent1",
    completedAt: "2023-05-28T10:00:00Z",
    completionNotes: "Client is satisfied with the product. Will place new order next month.",
  },
  {
    _id: "4",
    orderId: {
      _id: "order4",
      orderId: "ORD-004",
      totalAmount: 32000,
      status: "delivered",
      createdAt: "2023-05-05T11:45:00Z",
    },
    clientId: {
      _id: "client4",
      name: "Sneha Reddy",
      mobile: "+91 65432 10987",
      email: "sneha@example.com",
    },
    agentId: "agent1",
    enabled: true,
    period: "custom",
    customDays: 14,
    comment: "Check if the marble flooring is holding up well",
    status: "cancelled",
    followUpDate: "2023-05-19T11:45:00Z",
    createdAt: "2023-05-05T11:45:00Z",
    updatedAt: "2023-05-18T16:30:00Z",
    completionNotes: "Client moved to a different city. No follow-up needed.",
  },
  {
    _id: "5",
    orderId: {
      _id: "order5",
      orderId: "ORD-005",
      totalAmount: 55000,
      status: "processing",
      createdAt: "2023-05-12T13:10:00Z",
    },
    clientId: {
      _id: "client5",
      name: "Vikram Singh",
      mobile: "+91 54321 09876",
      email: "vikram@example.com",
    },
    agentId: "agent1",
    enabled: true,
    period: "7days",
    comment: "Follow up about delivery schedule and installation preferences",
    status: "pending",
    followUpDate: new Date(new Date().setDate(new Date().getDate() + 3)).toISOString(), // 3 days from now
    createdAt: "2023-05-12T13:10:00Z",
    updatedAt: "2023-05-12T13:10:00Z",
  },
]

export default function FollowUpRemindersPage() {
  const [activeTab, setActiveTab] = useState("all")
  const [followUps, setFollowUps] = useState<FollowUpReminder[]>(SAMPLE_FOLLOWUPS)
  const [filteredFollowUps, setFilteredFollowUps] = useState<FollowUpReminder[]>(SAMPLE_FOLLOWUPS)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDateRange, setSelectedDateRange] = useState("all")
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})
  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: "ascending" | "descending"
  }>({
    key: "followUpDate",
    direction: "ascending",
  })

  useEffect(() => {
    applyFilters()
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

  const getStatCount = (status: string) => {
    if (status === "overdue") {
      return followUps.filter((item) => item.status === "pending" && isBefore(new Date(item.followUpDate), new Date()))
        .length
    }
    if (status === "upcoming") {
      const today = new Date()
      const nextWeek = addDays(today, 7)
      return followUps.filter(
        (item) =>
          item.status === "pending" &&
          isAfter(new Date(item.followUpDate), today) &&
          isBefore(new Date(item.followUpDate), nextWeek),
      ).length
    }
    return followUps.filter((item) => item.status === status).length
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Follow-up Reminders</h1>
          <p className="text-muted-foreground">Manage and track all your client follow-up reminders</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button variant="outline" className="flex items-center gap-2">
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
                <p className="text-2xl font-bold">{followUps.length}</p>
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
                <p className="text-2xl font-bold">{getStatCount("pending")}</p>
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
                <p className="text-2xl font-bold">{getStatCount("overdue")}</p>
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
                <p className="text-2xl font-bold">{getStatCount("completed")}</p>
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
        {filteredFollowUps.length === 0 ? (
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
