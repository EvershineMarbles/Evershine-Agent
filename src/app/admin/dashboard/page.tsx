"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import {
  Search,
  Users,
  Package,
  UserCheck,
  Clock,
  Loader2,
  Settings,
  QrCode,
  UserPlus,
  List,
  Bell,
  Trash2,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { fetchWithAdminAuth } from "@/lib/admin-auth"

// Function to fetch all clients
const getAllClients = async () => {
  try {
    const response = await fetchWithAdminAuth("/api/admin/clients")

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || `API error: ${response.status}`)
    }

    const data = await response.json()

    if (data.success && data.data) {
      return {
        success: true,
        clients: data.data.clients || [],
      }
    } else {
      throw new Error(data.message || "Failed to fetch clients")
    }
  } catch (error: any) {
    console.error("Error fetching clients:", error)
    return {
      success: false,
      message: error.message || "An error occurred while fetching clients",
      clients: [],
    }
  }
}

// Function to fetch all agents
const getAllAgents = async () => {
  try {
    const response = await fetchWithAdminAuth("/api/admin/agents")

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || `API error: ${response.status}`)
    }

    const data = await response.json()

    if (data.success && data.data) {
      return {
        success: true,
        agents: data.data.agents || [],
      }
    } else {
      throw new Error(data.message || "Failed to fetch agents")
    }
  } catch (error: any) {
    console.error("Error fetching agents:", error)
    return {
      success: false,
      message: error.message || "An error occurred while fetching agents",
      agents: [],
    }
  }
}

// Function to fetch all products
const getAllProducts = async () => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "https://evershinebackend-2.onrender.com"}/api/getAllProducts`,
    )

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()

    if (data.success) {
      return {
        success: true,
        products: data.data || [],
      }
    } else {
      throw new Error(data.message || "Failed to fetch products")
    }
  } catch (error: any) {
    console.error("Error fetching products:", error)
    return {
      success: false,
      message: error.message || "An error occurred while fetching products",
      products: [],
    }
  }
}

export default function AdminDashboard() {
  // State for stats with loading indicators
  const [stats, setStats] = useState({
    clients: { value: 0, loading: true },
    agents: { value: 0, loading: true },
    products: { value: 0, loading: true },
    followups: 200,
  })

  const [products, setProducts] = useState<any[]>([])

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch clients
        const clientsResponse = await getAllClients()
        if (clientsResponse.success) {
          setStats((prev) => ({
            ...prev,
            clients: {
              value: clientsResponse.clients.length,
              loading: false,
            },
          }))
        } else {
          setStats((prev) => ({
            ...prev,
            clients: { value: 0, loading: false },
          }))
        }

        // Fetch agents
        const agentsResponse = await getAllAgents()
        if (agentsResponse.success) {
          setStats((prev) => ({
            ...prev,
            agents: {
              value: agentsResponse.agents.length,
              loading: false,
            },
          }))
        } else {
          setStats((prev) => ({
            ...prev,
            agents: { value: 0, loading: false },
          }))
        }

        // Fetch products
        const productsResponse = await getAllProducts()
        if (productsResponse.success) {
          setProducts(productsResponse.products)
        }

        // Fetch products count
        const productsCountResponse = await getAllProducts()
        if (productsCountResponse.success) {
          setStats((prev) => ({
            ...prev,
            products: {
              value: productsCountResponse.products.length,
              loading: false,
            },
          }))
        } else {
          setStats((prev) => ({
            ...prev,
            products: { value: 0, loading: false },
          }))
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        // Set loading to false even if there's an error
        setStats((prev) => ({
          ...prev,
          clients: { value: 0, loading: false },
          agents: { value: 0, loading: false },
          products: { value: 0, loading: false },
        }))
      }
    }

    fetchData()
  }, [])

  return (
    <div className="flex-1 bg-white">
      <header className="p-3 border-b">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">Welcome, Mr. Ankit</h1>
          <div className="relative w-[300px]">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input type="text" placeholder="Search..." className="pl-8 py-1 h-8 text-sm border rounded-full" />
          </div>
        </div>
      </header>

      <main className="p-3">
        {/* Stats Cards - Now in a 2x2 grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Link href="/admin/dashboard/all-clients">
            <Card className="border rounded-xl overflow-hidden cursor-pointer hover:shadow-md hover:border-[#1e4b9a] transition-all h-full">
              <CardContent className="p-3 flex flex-col items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-1">
                  <Users className="h-5 w-5 text-[#1e4b9a]" />
                </div>
                <h2 className="text-sm font-semibold text-center">Total Clients</h2>
                {stats.clients.loading ? (
                  <div className="flex items-center justify-center h-[28px]">
                    <Loader2 className="h-5 w-5 animate-spin text-[#1e4b9a]" />
                  </div>
                ) : (
                  <p className="text-xl font-bold text-[#1e4b9a]">{stats.clients.value}</p>
                )}
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/dashboard/agents">
            <Card className="border rounded-xl overflow-hidden cursor-pointer hover:shadow-md hover:border-[#1e4b9a] transition-all h-full">
              <CardContent className="p-3 flex flex-col items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-1">
                  <UserCheck className="h-5 w-5 text-[#1e4b9a]" />
                </div>
                <h2 className="text-sm font-semibold text-center">Active Consultants</h2>
                {stats.agents.loading ? (
                  <div className="flex items-center justify-center h-[28px]">
                    <Loader2 className="h-5 w-5 animate-spin text-[#1e4b9a]" />
                  </div>
                ) : (
                  <p className="text-xl font-bold text-[#1e4b9a]">{stats.agents.value}</p>
                )}
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/dashboard/products">
            <Card className="border rounded-xl overflow-hidden cursor-pointer hover:shadow-md hover:border-[#1e4b9a] transition-all h-full">
              <CardContent className="p-3 flex flex-col items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mb-1">
                  <Package className="h-5 w-5 text-[#1e4b9a]" />
                </div>
                <h2 className="text-sm font-semibold text-center">Products</h2>
                {stats.products.loading ? (
                  <div className="flex items-center justify-center h-[28px]">
                    <Loader2 className="h-5 w-5 animate-spin text-[#1e4b9a]" />
                  </div>
                ) : (
                  <p className="text-xl font-bold text-[#1e4b9a]">{stats.products.value}</p>
                )}
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/dashboard/followups">
            <Card className="border rounded-xl overflow-hidden cursor-pointer hover:shadow-md hover:border-[#1e4b9a] transition-all h-full">
              <CardContent className="p-3 flex flex-col items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mb-1">
                  <Clock className="h-5 w-5 text-[#1e4b9a]" />
                </div>
                <h2 className="text-sm font-semibold text-center">Follow-ups</h2>
                <p className="text-xl font-bold text-[#1e4b9a]">{stats.followups}</p>
              </CardContent>
            </Card>
          </Link>
        </div>

     {/* Action Buttons - Made bigger */}
     <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          <Link href="/admin/dashboard/agents" className="w-full">
            <div className="h-auto py-8 bg-[#1e4b9a] text-white border-none hover:bg-[#1e4b9a]/90 hover:text-white flex flex-col items-center gap-3 rounded-lg transition-colors">
              <UserCheck className="h-8 w-8" />
              <span className="text-lg font-medium">Consultants</span>
            </div>
          </Link>

          <Link href="/admin/dashboard/all-clients" className="w-full">
            <div className="h-auto py-8 bg-[#1e4b9a] text-white border-none hover:bg-[#1e4b9a]/90 hover:text-white flex flex-col items-center gap-3 rounded-lg transition-colors">
              <List className="h-8 w-8" />
              <span className="text-lg font-medium">Client List</span>
            </div>
          </Link>

          <Link href="/admin/dashboard/scan-qr" className="w-full">
            <div className="h-auto py-8 bg-[#1e4b9a] text-white border-none hover:bg-[#1e4b9a]/90 hover:text-white flex flex-col items-center gap-3 rounded-lg transition-colors">
              <QrCode className="h-8 w-8" />
              <span className="text-lg font-medium">Scan QR Code</span>
            </div>
          </Link>

        

          <Link href="/admin/dashboard/global-commission" className="w-full">
            <div className="h-auto py-8 bg-[#1e4b9a] text-white border-none hover:bg-[#1e4b9a]/90 hover:text-white flex flex-col items-center gap-3 rounded-lg transition-colors">
              <Settings className="h-8 w-8" />
              <span className="text-lg font-medium">Standard Pricing</span>
            </div>
          </Link>

          <Link href="/admin/dashboard/followups" className="w-full">
            <div className="h-auto py-8 bg-[#1e4b9a] text-white border-none hover:bg-[#1e4b9a]/90 hover:text-white flex flex-col items-center gap-3 rounded-lg transition-colors">
              <Bell className="h-8 w-8" />
              <span className="text-lg font-medium">Follow-ups</span>
            </div>
          </Link>

          <Link href="/admin/dashboard" className="w-full">
            <div className="h-auto py-8 bg-red-700 text-white border-none hover:bg-[#1e4b9a]/90 hover:text-white flex flex-col items-center gap-3 rounded-lg transition-colors">
              <Trash2 className="h-8 w-8" />
              <span className="text-lg font-medium">Erase All Data</span>
            </div>
          </Link>
        </div>

        {/* Erase All Data Button - Made bigger  <div className="flex justify-center mt-4">
          <div className="bg-red-600 hover:bg-red-700 text-white py-8 w-full max-w-md rounded-lg flex flex-col items-center gap-3 cursor-pointer transition-colors">
            <Trash2 className="h-8 w-8" />
            <span className="text-lg font-medium">Erase All Data</span>
          </div>
        </div> */}
      
      </main>
    </div>
  )
}
