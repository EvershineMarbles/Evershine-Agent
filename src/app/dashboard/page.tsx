"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Users, Package, Bell, LogOut, UserPlus, Loader2, QrCode, List } from "lucide-react"
import { agentAPI } from "@/lib/api-utils"
import { isAgentAuthenticated, clearAllTokens } from "@/lib/auth-utils"
import { useToast } from "@/components/ui/use-toast"
import { AdvisorSidebar } from "@/components/advisor-sidebar"

// Define client interface
interface Client {
  _id: string
  name: string
  mobile: string
  clientId: string
  profession?: string
  city?: string
  email?: string
}

export default function Dashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const [agentEmail, setAgentEmail] = useState<string | null>(null)
  const [agentName, setAgentName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [clients, setClients] = useState<Client[]>([])

  // Wrap fetchClients in useCallback to prevent it from being recreated on every render
  const fetchClients = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await agentAPI.getClients()

      if (response.success && Array.isArray(response.data)) {
        setClients(response.data)
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to fetch clients",
          variant: "destructive",
        })
        setClients([])
      }
    } catch (error) {
      console.error("Error fetching clients:", error)
      toast({
        title: "Error",
        description: "Failed to fetch clients. Please try again.",
        variant: "destructive",
      })
      setClients([])
    } finally {
      setIsLoading(false)
    }
  }, [toast]) // Add toast as a dependency

  useEffect(() => {
    // Check if agent is logged in
    if (!isAgentAuthenticated()) {
      router.push("/agent-login")
      return
    }

    // Fetch agent email from localStorage
    const email = localStorage.getItem("agentEmail")
    setAgentEmail(email)

    // Extract name from email (for demo purposes)
    if (email) {
      const name = email.split("@")[0]
      // Capitalize first letter and format name
      const formattedName = name.charAt(0).toUpperCase() + name.slice(1)
      setAgentName(formattedName)
    }

    // Fetch clients
    fetchClients()
  }, [router, fetchClients]) // Add fetchClients to the dependency array

  const handleLogout = () => {
    clearAllTokens()
    router.push("/agent-login")
  }

  if (isLoading && clients.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <p>Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Add the sidebar */}
      <AdvisorSidebar />

      {/* Adjust the main content to make room for the sidebar */}
      <div className="ml-16">
        {" "}
        {/* This margin matches the sidebar width */}
        {/* Blue strip at the top */}
        <div className="w-full bg-[#194a95] text-white py-4 px-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Image src="/logo2.png" alt="Evershine Logo" width={80} height={40} />
              <h1 className="text-xl font-semibold">Agent Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm md:text-base">Welcome, {agentName || agentEmail}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-white hover:bg-white/20 hover:text-white"
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
        <main className="container mx-auto py-6 px-4 flex-1">
          <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card className="border rounded-lg overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-[#194a95]" />
                  <span className="text-gray-600 font-medium">Total Clients</span>
                </div>
                <p className="text-3xl font-bold mt-2">{clients.length}</p>
              </CardContent>
            </Card>

            <Card className="border rounded-lg overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-[#194a95]" />
                  <span className="text-gray-600 font-medium">Active Orders</span>
                </div>
                <p className="text-3xl font-bold mt-2">12</p>
              </CardContent>
            </Card>

            <Card className="border rounded-lg overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-[#194a95]" />
                  <span className="text-gray-600 font-medium">Pending Reminders</span>
                </div>
                <p className="text-3xl font-bold mt-2">8</p>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              className="h-auto py-8 bg-[#194a95] text-white border-none hover:bg-[#194a95]/90 hover:text-white flex flex-col items-center gap-3 rounded-lg"
              onClick={() => router.push("/register-client")}
            >
              <UserPlus className="h-6 w-6" />
              <span className="text-base font-medium">Register a New Client</span>
            </button>

            <button
              className="h-auto py-8 bg-[#194a95] text-white border-none hover:bg-[#194a95]/90 hover:text-white flex flex-col items-center gap-3 rounded-lg"
              onClick={() => router.push("/client-list")}
            >
              <List className="h-6 w-6" />
              <span className="text-base font-medium">Client List</span>
            </button>

            <button
              className="h-auto py-8 bg-[#194a95] text-white border-none hover:bg-[#194a95]/90 hover:text-white flex flex-col items-center gap-3 rounded-lg"
              onClick={() => router.push("/scan-qr")}
            >
              <QrCode className="h-6 w-6" />
              <span className="text-base font-medium">Scan QR</span>
            </button>
          </div>
        </main>
      </div>
    </div>
  )
}
