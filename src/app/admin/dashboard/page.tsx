"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Package, UserCog, Activity } from "lucide-react"

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalAgents: 0,
    totalClients: 0,
    totalProducts: 0,
    activeOrders: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch dashboard stats
    const fetchStats = async () => {
      try {
        // In a real app, you would fetch this data from your API
        // For now, we'll use mock data
        setStats({
          totalAgents: 24,
          totalClients: 156,
          totalProducts: 89,
          activeOrders: 37,
        })
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue"></div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <UserCog className="h-5 w-5 mr-2 text-blue" />
              Total Advisors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalAgents}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue" />
              Total Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalClients}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Package className="h-5 w-5 mr-2 text-blue" />
              Total Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalProducts}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Activity className="h-5 w-5 mr-2 text-blue" />
              Active Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.activeOrders}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No recent activity to display.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>API Server</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Online</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Database</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Connected</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Storage</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Available</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
