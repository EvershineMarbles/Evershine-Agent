"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useRouter } from "next/navigation"

// Define types for our stats
interface DashboardStats {
  agentCount: number
  clientCount: number
  productCount: number
  followupCount: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    agentCount: 0,
    clientCount: 0,
    productCount: 0,
    followupCount: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch agents count
        const agentsResponse = await fetch("https://evershinebackend-2.onrender.com/api/agents")
        const agentsData = await agentsResponse.json()

        // Fetch clients count
        const clientsResponse = await fetch("https://evershinebackend-2.onrender.com/api/clients")
        const clientsData = await clientsResponse.json()

        // Fetch products count
        const productsResponse = await fetch("https://evershinebackend-2.onrender.com/api/products")
        const productsData = await productsResponse.json()

        // Fetch followups count
        const followupsResponse = await fetch("https://evershinebackend-2.onrender.com/api/followups")
        const followupsData = await followupsResponse.json()

        setStats({
          agentCount: agentsData.length || 0,
          clientCount: clientsData.length || 0,
          productCount: productsData.length || 0,
          followupCount: followupsData.filter((f: any) => f.status === "pending").length || 0,
        })

        setLoading(false)
      } catch (err: any) {
        console.error("Error fetching dashboard stats:", err)
        setError(err.message || "Failed to load dashboard statistics")
        setLoading(false)
      }
    }

    fetchDashboardStats()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/admin/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  const handleEraseAllData = async () => {
    if (window.confirm("Are you sure you want to erase ALL data? This action cannot be undone!")) {
      try {
        const response = await fetch("https://evershinebackend-2.onrender.com/api/admin/reset-data", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Add authentication headers if needed
          },
        })

        if (response.ok) {
          alert("All data has been erased successfully")
          // Refresh stats
          window.location.reload()
        } else {
          const errorData = await response.json()
          alert(`Failed to erase data: ${errorData.message || "Unknown error"}`)
        }
      } catch (err) {
        console.error("Error erasing data:", err)
        alert("An error occurred while trying to erase data")
      }
    }
  }

  return (
    <div className="flex-1 bg-white">
      <header className="p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Welcome, Mr. Ankit</h1>
          <form onSubmit={handleSearch} className="relative w-[450px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by client name, product, sales agent..."
              className="pl-10 py-2 border rounded-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>
      </header>

      <main className="p-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-xl">Loading dashboard data...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-lg text-red-800 mb-6">
            <p>Error: {error}</p>
            <Button onClick={() => window.location.reload()} className="mt-2 bg-red-600 hover:bg-red-700 text-white">
              Retry
            </Button>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card className="border-2 rounded-3xl overflow-hidden">
                <CardContent className="p-6 flex flex-col items-center justify-center min-h-[120px]">
                  <h2 className="text-2xl font-semibold text-center">Total Clients</h2>
                  <p className="text-4xl font-bold mt-2">{stats.clientCount}</p>
                </CardContent>
              </Card>

              <Card className="border-2 rounded-3xl overflow-hidden">
                <CardContent className="p-6 flex flex-col items-center justify-center min-h-[120px]">
                  <h2 className="text-2xl font-semibold text-center">Active Sales Agents</h2>
                  <p className="text-4xl font-bold mt-2">{stats.agentCount}</p>
                </CardContent>
              </Card>

              <Card className="border-2 rounded-3xl overflow-hidden">
                <CardContent className="p-6 flex flex-col items-center justify-center min-h-[120px]">
                  <h2 className="text-2xl font-semibold text-center">Products Available</h2>
                  <p className="text-4xl font-bold mt-2">{stats.productCount}</p>
                </CardContent>
              </Card>

              <Card className="border-2 rounded-3xl overflow-hidden">
                <CardContent className="p-6 flex flex-col items-center justify-center min-h-[120px]">
                  <h2 className="text-2xl font-semibold text-center">Pending Follow-ups</h2>
                  <p className="text-4xl font-bold mt-2">{stats.followupCount}</p>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons - First Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Link href="/admin/clients/register" className="w-full">
                <Button className="bg-[#1e4b9a] hover:bg-[#1e4b9a]/90 text-white h-12 text-lg font-normal w-full rounded-md">
                  Register New Client
                </Button>
              </Link>

              <Link href="/admin/qr-scanner" className="w-full">
                <Button className="bg-[#1e4b9a] hover:bg-[#1e4b9a]/90 text-white h-12 text-lg font-normal w-full rounded-md">
                  Scan QR Code
                </Button>
              </Link>

              <Link href="/admin/followups" className="w-full">
                <Button className="bg-[#1e4b9a] hover:bg-[#1e4b9a]/90 text-white h-12 text-lg font-normal w-full rounded-md">
                  Follow-up Reminders
                </Button>
              </Link>
            </div>

            {/* Action Buttons - Second Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Link href="/admin/agents" className="w-full">
                <Button className="bg-[#1e4b9a] hover:bg-[#1e4b9a]/90 text-white h-12 text-lg font-normal w-full rounded-md">
                  Advisors
                </Button>
              </Link>

              <Link href="/admin/clients" className="w-full">
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
              <Button
                onClick={handleEraseAllData}
                className="bg-red-600 hover:bg-red-700 text-white h-12 w-full max-w-md text-lg font-normal rounded-md"
              >
                Erase All Data
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
