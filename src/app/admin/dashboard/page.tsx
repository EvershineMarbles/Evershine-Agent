"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle, Clock, Truck, XCircle, Search, LogIn } from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import axios from "axios"
import { useRouter } from "next/navigation"

// Define types for our stats
interface DashboardStats {
  counts: {
    clients: number
    agents: number
    products: number
    orders: number
  }
  recentOrders: any[]
  orderStats: any[]
  productStats: any[]
  totalRevenue: number
}

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    counts: {
      clients: 0,
      agents: 0,
      products: 0,
      orders: 0,
    },
    recentOrders: [],
    orderStats: [],
    productStats: [],
    totalRevenue: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [useFallbackData, setUseFallbackData] = useState(false)

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get the token from localStorage - try different possible key names
        const token =
          localStorage.getItem("adminToken") ||
          localStorage.getItem("admin_token") ||
          localStorage.getItem("token") ||
          sessionStorage.getItem("adminToken") ||
          sessionStorage.getItem("admin_token") ||
          sessionStorage.getItem("token")

        if (!token) {
          console.log("No authentication token found, using fallback data")
          setUseFallbackData(true)
          setLoading(false)
          return
        }

        // Fetch dashboard stats from the backend API
        try {
          const response = await axios.get("https://evershinebackend-2.onrender.com/api/admin/dashboard", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })

          // Set the stats from the API response
          if (response.data && response.data.data) {
            setStats(response.data.data)
          } else {
            throw new Error("Invalid response format from server")
          }
        } catch (apiError: any) {
          console.error("API error:", apiError)

          // If we get a 401 or 403, the token is invalid or expired
          if (apiError.response && (apiError.response.status === 401 || apiError.response.status === 403)) {
            setUseFallbackData(true)
          } else {
            setError("Failed to fetch dashboard data. Please try again later.")
          }
        }

        setLoading(false)
      } catch (err: any) {
        console.error("Error in dashboard:", err)
        setError(err.message || "An unexpected error occurred")
        setLoading(false)
      }
    }

    fetchDashboardStats()
  }, [])

  // Fallback data to use when authentication fails
  const fallbackStats = {
    counts: {
      clients: 5,
      agents: 4,
      products: 172,
      orders: 0,
    },
  }

  // Use fallback data if authentication failed
  const displayStats = useFallbackData ? fallbackStats : stats

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

  const handleLogin = () => {
    // Redirect to login page
    router.push("/admin/login")
  }

  return (
    <div className="flex-1 bg-white">
      <header className="p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Welcome, Mr. Ankit</h1>
          <div className="relative w-[450px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by client name, product, sales consultant..."
              className="pl-10 py-2 border rounded-full"
            />
          </div>
        </div>
      </header>

      <main className="p-6">
        {useFallbackData && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
              <p className="text-yellow-700">You are viewing demo data. Please log in to see real-time statistics.</p>
            </div>
            <Button onClick={handleLogin} className="bg-[#1e4b9a] hover:bg-[#1e4b9a]/90 text-white">
              <LogIn className="h-4 w-4 mr-2" /> Log In
            </Button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-10">Loading dashboard data...</div>
        ) : error ? (
          <div className="text-center py-10 text-red-500">{error}</div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Link href="/admin/dashboard/all-clients" className="block w-full transition-transform hover:scale-105">
                <Card className="border-2 rounded-3xl overflow-hidden cursor-pointer hover:shadow-lg hover:border-[#1e4b9a]">
                  <CardContent className="p-6 flex flex-col items-center justify-center min-h-[120px]">
                    <h2 className="text-2xl font-semibold text-center">Total Clients</h2>
                    <p className="text-4xl font-bold mt-2">{displayStats.counts.clients}</p>
                    <p className="text-sm text-blue-600 mt-2">Click to view all clients</p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/admin/dashboard/agents" className="block w-full transition-transform hover:scale-105">
                <Card className="border-2 rounded-3xl overflow-hidden cursor-pointer hover:shadow-lg hover:border-[#1e4b9a]">
                  <CardContent className="p-6 flex flex-col items-center justify-center min-h-[120px]">
                    <h2 className="text-2xl font-semibold text-center">Active Sales Agents</h2>
                    <p className="text-4xl font-bold mt-2">{displayStats.counts.agents}</p>
                    <p className="text-sm text-blue-600 mt-2">Click to view all agents</p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/admin/dashboard/products" className="block w-full transition-transform hover:scale-105">
                <Card className="border-2 rounded-3xl overflow-hidden cursor-pointer hover:shadow-lg hover:border-[#1e4b9a]">
                  <CardContent className="p-6 flex flex-col items-center justify-center min-h-[120px]">
                    <h2 className="text-2xl font-semibold text-center">Products Available</h2>
                    <p className="text-4xl font-bold mt-2">{displayStats.counts.products}</p>
                    <p className="text-sm text-blue-600 mt-2">Click to view all products</p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/admin/dashboard/followups" className="block w-full transition-transform hover:scale-105">
                <Card className="border-2 rounded-3xl overflow-hidden cursor-pointer hover:shadow-lg hover:border-[#1e4b9a]">
                  <CardContent className="p-6 flex flex-col items-center justify-center min-h-[120px]">
                    <h2 className="text-2xl font-semibold text-center">Pending Follow-ups</h2>
                    <p className="text-4xl font-bold mt-2">200</p>
                    <p className="text-sm text-blue-600 mt-2">Click to view follow-ups</p>
                  </CardContent>
                </Card>
              </Link>
            </div>

            {/* Action Buttons - First Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Link href="/admin/dashboard/agents" className="w-full">
                <Button className="bg-[#1e4b9a] hover:bg-[#1e4b9a]/90 text-white h-12 text-lg font-normal w-full rounded-md">
                  Consultants
                </Button>
              </Link>

              <Link href="/admin/dashboard/all-clients" className="w-full">
                <Button className="bg-[#1e4b9a] hover:bg-[#1e4b9a]/90 text-white h-12 text-lg font-normal w-full rounded-md">
                  Client List
                </Button>
              </Link>

              <Link href="/scan-qr" className="w-full">
                <Button className="bg-[#1e4b9a] hover:bg-[#1e4b9a]/90 text-white h-12 text-lg font-normal w-full rounded-md">
                  Scan QR Code
                </Button>
              </Link>
            </div>

            {/* Action Buttons - Second Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Link href="/admin/dashboard/followups" className="w-full">
                <Button className="bg-[#1e4b9a] hover:bg-[#1e4b9a]/90 text-white h-12 text-lg font-normal w-full rounded-md">
                  Follow-up Reminders
                </Button>
              </Link>

              <Link href="/admin/products/pricing" className="w-full">
                <Button className="bg-[#1e4b9a] hover:bg-[#1e4b9a]/90 text-white h-12 text-lg font-normal w-full rounded-md">
                  Change Standard Price
                </Button>
              </Link>

              <Link href="../register-client" className="w-full">
                <Button className="bg-[#1e4b9a] hover:bg-[#1e4b9a]/90 text-white h-12 text-lg font-normal w-full rounded-md">
                  Register New Client
                </Button>
              </Link>
            </div>

            {/* Erase All Data Button */}
            <div className="flex justify-center">
              <Button className="bg-red-600 hover:bg-red-700 text-white h-12 w-full max-w-md text-lg font-normal rounded-md">
                Erase All Data
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
