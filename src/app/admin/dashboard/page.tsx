"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Search, Users, Package, UserCheck, Clock, Loader2 } from "lucide-react"
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

export default function AdminDashboard() {
  // State for stats with loading indicators
  const [stats, setStats] = useState({
    clients: { value: 0, loading: true },
    agents: { value: 0, loading: true },
    products: 172,
    followups: 200,
  })

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
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        // Set loading to false even if there's an error
        setStats((prev) => ({
          ...prev,
          clients: { value: 0, loading: false },
          agents: { value: 0, loading: false },
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
                <h2 className="text-sm font-semibold text-center">Active Agents</h2>
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
                <p className="text-xl font-bold text-[#1e4b9a]">{stats.products}</p>
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

        {/* Action Buttons - Now in a 2x3 grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
          <Link href="/admin/dashboard/agents" className="w-full">
            <Button className="bg-[#1e4b9a] hover:bg-[#1e4b9a]/90 text-white h-9 text-sm font-normal w-full rounded-md">
              Consultants
            </Button>
          </Link>

          <Link href="/admin/dashboard/all-clients" className="w-full">
            <Button className="bg-[#1e4b9a] hover:bg-[#1e4b9a]/90 text-white h-9 text-sm font-normal w-full rounded-md">
              Client List
            </Button>
          </Link>

          <Link href="/scan-qr" className="w-full">
            <Button className="bg-[#1e4b9a] hover:bg-[#1e4b9a]/90 text-white h-9 text-sm font-normal w-full rounded-md">
              Scan QR Code
            </Button>
          </Link>

          <Link href="/admin/dashboard/followups" className="w-full">
            <Button className="bg-[#1e4b9a] hover:bg-[#1e4b9a]/90 text-white h-9 text-sm font-normal w-full rounded-md">
              Follow-ups
            </Button>
          </Link>

          <Link href="/admin/dashboard/global-commission" className="w-full">
            <Button className="bg-[#1e4b9a] hover:bg-[#1e4b9a]/90 text-white h-9 text-sm font-normal w-full rounded-md">
              Change Standard Pricing
            </Button>
          </Link>

          <Link href="../register-client" className="w-full">
            <Button className="bg-[#1e4b9a] hover:bg-[#1e4b9a]/90 text-white h-9 text-sm font-normal w-full rounded-md">
              New Client
            </Button>
          </Link>
        </div>

        {/* Erase All Data Button */}
        <div className="flex justify-center">
          <Button className="bg-red-600 hover:bg-red-700 text-white h-9 w-full max-w-md text-sm font-normal rounded-md">
            Erase All Data
          </Button>
        </div>
      </main>
    </div>
  )
}
