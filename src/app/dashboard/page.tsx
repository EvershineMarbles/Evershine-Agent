"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Package, Bell, LogOut, UserPlus, Loader2, QrCode, List } from "lucide-react"
import { agentAPI } from "@/lib/api-utils"
import { isAgentAuthenticated, clearAllTokens } from "@/lib/auth-utils"
import { useToast } from "@/components/ui/use-toast"

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

    // Fetch clients
    fetchClients()
  }, [router, fetchClients]) // Add fetchClients to the dependency array

  const handleLogout = () => {
    clearAllTokens()
    router.push("/")
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
      {/* Blue strip at the top */}
      <div className="w-full bg-[#194a95] text-white py-4 px-6 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <Image src="/logo.png" alt="Evershine Logo" width={120} height={60} className="mr-4" />
            <h1 className="text-xl font-semibold hidden sm:block">Agent Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm hidden md:inline-block">Welcome, {agentEmail}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white hover:bg-white/20">
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>

      <main className="container mx-auto py-8 px-4 flex-1">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Users className="h-5 w-5 mr-2 text-blue" />
                Total Clients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{clients.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Package className="h-5 w-5 mr-2 text-blue" />
                Active Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">12</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Bell className="h-5 w-5 mr-2 text-blue" />
                Pending Reminders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">8</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Button
            size="lg"
            className="h-auto py-6 bg-[#194a95] hover:bg-[#0f3a7a] flex flex-col items-center gap-2"
            onClick={() => router.push("/scan-qr")}
          >
            <QrCode className="h-8 w-8" />
            <span className="text-lg">Scan QR</span>
          </Button>

          <Button
            size="lg"
            className="h-auto py-6 bg-[#194a95] hover:bg-[#0f3a7a] flex flex-col items-center gap-2"
            onClick={() => router.push("/register-client")}
          >
            <UserPlus className="h-8 w-8" />
            <span className="text-lg">Register a New Client</span>
          </Button>

          <Button
            size="lg"
            className="h-auto py-6 bg-[#194a95] hover:bg-[#0f3a7a] flex flex-col items-center gap-2"
            onClick={() => router.push("/client-list")}
          >
            <List className="h-8 w-8" />
            <span className="text-lg">Client List</span>
          </Button>
        </div>
      </main>
    </div>
  )
}
