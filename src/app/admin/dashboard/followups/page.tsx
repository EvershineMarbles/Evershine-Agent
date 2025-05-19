"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Plus, RefreshCw, Search, Calendar, CheckCircle, XCircle, Clock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import type React from "react"

interface Followup {
  _id: string
  clientId: string
  clientName: string
  clientMobile: string
  agentId: string
  agentName: string
  date: string
  notes: string
  status: "pending" | "completed" | "cancelled"
  priority: "low" | "medium" | "high"
}

interface Client {
  _id: string
  name: string
  mobile: string
}

interface Agent {
  _id: string
  name: string
  email: string
}

// Function to fetch all followups
const getFollowups = async () => {
  try {
    const token = localStorage.getItem("admin_token")

    if (!token) {
      return { success: false, message: "No authentication token found" }
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "https://evershinebackend-2.onrender.com"}/api/admin/followups`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    )

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    if (data.success && data.data) {
      return {
        success: true,
        followups: data.data.followups || [],
      }
    } else {
      throw new Error(data.message || "Failed to fetch followups")
    }
  } catch (error: any) {
    console.error("Error fetching followups:", error)
    return {
      success: false,
      message: error.message || "An error occurred while fetching followups",
      followups: [],
    }
  }
}

// Function to update followup status
const updateFollowupStatus = async (followupId: string, status: string) => {
  try {
    const token = localStorage.getItem("admin_token")

    if (!token) {
      return { success: false, message: "No authentication token found" }
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "https://evershinebackend-2.onrender.com"}/api/admin/followups/${followupId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      },
    )

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    if (data.success) {
      return {
        success: true,
        message: "Followup status updated successfully",
      }
    } else {
      throw new Error(data.message || "Failed to update followup status")
    }
  } catch (error: any) {
    console.error("Error updating followup status:", error)
    return {
      success: false,
      message: error.message || "An error occurred while updating followup status",
    }
  }
}

export default function FollowupsPage() {
  const [followups, setFollowups] = useState<Followup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [agentFilter, setAgentFilter] = useState<string>("all")
  const [updateLoading, setUpdateLoading] = useState<string | null>(null)

  const fetchFollowups = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await getFollowups()

      if (response.success) {
        setFollowups(response.followups)
      } else {
        setError(response.message || "Failed to fetch followups")
      }
    } catch (err: any) {
      console.error("Error fetching followups:", err)
      setError(err.message || "An error occurred while fetching followups")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFollowups()
  }, [])

  const handleStatusUpdate = async (followupId: string, newStatus: "completed" | "cancelled" | "pending") => {
    setUpdateLoading(followupId)

    try {
      const response = await updateFollowupStatus(followupId, newStatus)

      if (response.success) {
        // Update the local state
        setFollowups((prevFollowups) =>
          prevFollowups.map((followup) =>
            followup._id === followupId ? { ...followup, status: newStatus } : followup,
          ),
        )
      } else {
        setError(response.message || "Failed to update followup status")
      }
    } catch (err: any) {
      console.error("Error updating followup status:", err)
      setError(err.message || "An error occurred while updating followup status")
    } finally {
      setUpdateLoading(null)
    }
  }

  // Get unique agents for filtering
  const uniqueAgents = Array.from(new Set(followups.map((followup) => followup.agentName)))

  // Filter followups based on search query and filters
  const filteredFollowups = followups.filter((followup) => {
    // Search query filter
    const matchesSearch =
      followup.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      followup.clientMobile.includes(searchQuery) ||
      followup.agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      followup.notes.toLowerCase().includes(searchQuery.toLowerCase())

    // Status filter
    const matchesStatus = statusFilter === "all" || followup.status === statusFilter

    // Priority filter
    const matchesPriority = priorityFilter === "all" || followup.priority === priorityFilter

    // Agent filter
    const matchesAgent = agentFilter === "all" || followup.agentName === agentFilter

    return matchesSearch && matchesStatus && matchesPriority && matchesAgent
  })

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return format(date, "PPP")
    } catch (error) {
      return dateString
    }
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Pending
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Completed
          </Badge>
        )
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Cancelled
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Get priority badge
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge className="bg-red-500">High</Badge>
      case "medium":
        return <Badge className="bg-yellow-500">Medium</Badge>
      case "low":
        return <Badge className="bg-blue-500">Low</Badge>
      default:
        return <Badge>{priority}</Badge>
    }
  }

  // Group followups by date
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const nextWeek = new Date(today)
  nextWeek.setDate(nextWeek.getDate() + 7)

  const todayFollowups = filteredFollowups.filter((followup) => {
    const followupDate = new Date(followup.date)
    followupDate.setHours(0, 0, 0, 0)
    return followupDate.getTime() === today.getTime()
  })

  const tomorrowFollowups = filteredFollowups.filter((followup) => {
    const followupDate = new Date(followup.date)
    followupDate.setHours(0, 0, 0, 0)
    return followupDate.getTime() === tomorrow.getTime()
  })

  const upcomingFollowups = filteredFollowups.filter((followup) => {
    const followupDate = new Date(followup.date)
    followupDate.setHours(0, 0, 0, 0)
    return followupDate > tomorrow && followupDate <= nextWeek
  })

  const laterFollowups = filteredFollowups.filter((followup) => {
    const followupDate = new Date(followup.date)
    followupDate.setHours(0, 0, 0, 0)
    return followupDate > nextWeek
  })

  const overdueFollowups = filteredFollowups.filter((followup) => {
    const followupDate = new Date(followup.date)
    followupDate.setHours(0, 0, 0, 0)
    return followupDate < today && followup.status === "pending"
  })

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Follow-up Management</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{overdueFollowups.length}</div>
            <p className="text-muted-foreground">Overdue Followups</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{todayFollowups.length}</div>
            <p className="text-muted-foreground">Today's Followups</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{tomorrowFollowups.length}</div>
            <p className="text-muted-foreground">Tomorrow's Followups</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Follow-ups</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search followups..."
                className="w-[250px] pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" onClick={fetchFollowups} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Followup
            </Button>
          </div>
        </CardHeader>
       
      </Card>
    </div>
  )
}

// Followup table component to avoid repetition
interface FollowupTableProps {
  followups: Followup[]
  handleStatusUpdate: (id: string, status: "completed" | "cancelled" | "pending") => Promise<void>
  updateLoading: string | null
  formatDate: (date: string) => string
  getStatusBadge: (status: string) => React.ReactElement
  getPriorityBadge: (priority: string) => React.ReactElement
}

function FollowupTable({
  followups,
  handleStatusUpdate,
  updateLoading,
  formatDate,
  getStatusBadge,
  getPriorityBadge,
}: FollowupTableProps) {
  return (
    <div className="overflow-x-auto">
    
    </div>
  )
}
