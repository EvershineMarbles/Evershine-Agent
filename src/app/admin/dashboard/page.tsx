"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle, Clock, Truck, XCircle, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"

// Define types for our stats
interface DashboardStats {
  agentCount: number
  clientCount: number
  productCount: number
  orderCount: number
  revenue: number
  pendingOrders: number
  ordersByStatus: {
    pending: number
    processing: number
    shipped: number
    delivered: number
    cancelled: number
  }
  recentOrders: any[]
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    agentCount: 0,
    clientCount: 0,
    productCount: 0,
    orderCount: 0,
    revenue: 0,
    pendingOrders: 0,
    ordersByStatus: {
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    },
    recentOrders: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true)
        setError(null)

        // In a real app, you would fetch these stats from your API
        // For now, we'll use dummy data
        // const response = await fetchWithAdminAuth('/api/admin/dashboard');
        // const data = await response.json();

        // Simulate API response with dummy data
        setTimeout(() => {
          setStats({
            agentCount: 12,
            clientCount: 248,
            productCount: 456,
            orderCount: 132,
            revenue: 245000,
            pendingOrders: 24,
            ordersByStatus: {
              pending: 24,
              processing: 18,
              shipped: 32,
              delivered: 48,
              cancelled: 10,
            },
            recentOrders: [
              { id: "ORD-001", customer: "John Doe", amount: 12500, status: "delivered", date: "2023-06-15" },
              { id: "ORD-002", customer: "Jane Smith", amount: 8700, status: "shipped", date: "2023-06-14" },
              { id: "ORD-003", customer: "Robert Johnson", amount: 15200, status: "processing", date: "2023-06-14" },
              { id: "ORD-004", customer: "Emily Davis", amount: 6300, status: "pending", date: "2023-06-13" },
              { id: "ORD-005", customer: "Michael Brown", amount: 9800, status: "delivered", date: "2023-06-12" },
            ],
          })
          setLoading(false)
        }, 1000)
      } catch (err: any) {
        console.error("Error fetching dashboard stats:", err)
        setError(err.message || "Failed to load dashboard statistics")
        setLoading(false)
      }
    }

    fetchDashboardStats()
  }, [])

  // Helper function to get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800"
      case "shipped":
        return "bg-blue-100 text-blue-800"
      case "processing":
        return "bg-yellow-100 text-yellow-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Helper function to get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="h-4 w-4" />
      case "shipped":
        return <Truck className="h-4 w-4" />
      case "processing":
        return <Clock className="h-4 w-4" />
      case "cancelled":
        return <XCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  // Calculate total orders for percentage
  const totalOrders = Object.values(stats.ordersByStatus).reduce((sum, count) => sum + count, 0)

  return (
    <div className="flex-1 bg-white">
      <header className="p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Welcome, Mr. Ankit</h1>
          <div className="relative w-[450px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by client name, product, sales agent..."
              className="pl-10 py-2 border rounded-full"
            />
          </div>
        </div>
      </header>

      <main className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="border-2 rounded-3xl overflow-hidden">
            <CardContent className="p-6 flex flex-col items-center justify-center min-h-[120px]">
              <h2 className="text-2xl font-semibold text-center">Total Clients</h2>
              <p className="text-4xl font-bold mt-2">250</p>
            </CardContent>
          </Card>

          <Card className="border-2 rounded-3xl overflow-hidden">
            <CardContent className="p-6 flex flex-col items-center justify-center min-h-[120px]">
              <h2 className="text-2xl font-semibold text-center">Active Sales Agents</h2>
              <p className="text-4xl font-bold mt-2">10</p>
            </CardContent>
          </Card>

          <Card className="border-2 rounded-3xl overflow-hidden">
            <CardContent className="p-6 flex flex-col items-center justify-center min-h-[120px]">
              <h2 className="text-2xl font-semibold text-center">Products Available</h2>
              <p className="text-4xl font-bold mt-2">400</p>
            </CardContent>
          </Card>

          <Card className="border-2 rounded-3xl overflow-hidden">
            <CardContent className="p-6 flex flex-col items-center justify-center min-h-[120px]">
              <h2 className="text-2xl font-semibold text-center">Pending Follow-ups</h2>
              <p className="text-4xl font-bold mt-2">250</p>
            </CardContent>
          </Card>
        </div>
 {/* Action Buttons - First Row */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Link href="./register-client" className="w-full">
                <Button className="bg-[#1e4b9a] hover:bg-[#1e4b9a]/90 text-white h-12 text-lg font-normal w-full rounded-md">
                  Register New Client
                </Button>
              </Link>

              <Link href="./scan-qr" className="w-full">
                <Button className="bg-[#1e4b9a] hover:bg-[#1e4b9a]/90 text-white h-12 text-lg font-normal w-full rounded-md">
                  Scan QR Code
                </Button>
              </Link>

              <Link href="/admin/dashboard/followups" className="w-full">
                <Button className="bg-[#1e4b9a] hover:bg-[#1e4b9a]/90 text-white h-12 text-lg font-normal w-full rounded-md">
                  Follow-up Reminders
                </Button>
              </Link>
            </div>

            {/* Action Buttons - Second Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Link href="/admin/dashboard/agents" className="w-full">
                <Button className="bg-[#1e4b9a] hover:bg-[#1e4b9a]/90 text-white h-12 text-lg font-normal w-full rounded-md">
                  Advisors
                </Button>
              </Link>

              <Link href="/admin/dashboard/all-clients" className="w-full">
                <Button className="bg-[#1e4b9a] hover:bg-[#1e4b9a]/90 text-white h-12 text-lg font-normal w-full rounded-md">
                  Client List
                </Button>
              </Link>

              <Link href="/admin/products/pricing" className="w-full">
                <Button className="bg-[#1e4b9a] hover:bg-[#1e4b9a]/90 text-white h-12 text-lg font-normal w-full rounded-md">
                  Change Standard Price
                </Button>
              </Link>
            </div>

        {/* Erase All Data Button */}
        <div className="flex justify-center">
          <Button className="bg-red-600 hover:bg-red-700 text-white h-12 w-full max-w-md text-lg font-normal rounded-md">
            Erase All Data
          </Button>
        </div>
      </main>
    </div>
  )
}
