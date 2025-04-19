"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Package, Bell, LogOut, UserPlus, Loader2, QrCode, List } from "lucide-react"
import { agentAPI } from "@/lib/api-utils"
import { isAgentAuthenticated, clearAllTokens } from "@/lib/auth-utils"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { BackToTop } from "@/components/back-to-top" // Import the BackToTop component

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
  const [accessingClient, setAccessingClient] = useState<string | null>(null)

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

  const handleClientSelect = async (clientId: string) => {
    if (!clientId) {
      toast({
        title: "Error",
        description: "Invalid client ID",
        variant: "destructive",
      })
      return
    }

    setAccessingClient(clientId)

    try {
      // Get the token for client impersonation
      const response = await fetch(
        `https://evershinebackend-2.onrender.com/api/getClientImpersonationToken/${clientId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("agentToken")}`,
          },
        },
      )

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success && data.token) {
        // Store the token in localStorage
        localStorage.setItem("clientImpersonationToken", data.token)

        // Navigate to client dashboard
        router.push(`/client-dashboard/${clientId}`)
      } else {
        throw new Error(data.message || "Failed to get access token")
      }
    } catch (error: any) {
      console.error("Error accessing client dashboard:", error)
      toast({
        title: "Access Error",
        description: error.message || "Could not access client dashboard. Please try again.",
        variant: "destructive",
      })
    } finally {
      setAccessingClient(null)
    }
  }

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
      <div className="w-full bg-[#194a95] text-white py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Image src="/logo2.png" alt="Evershine Logo" width={80} height={40} />
            <h1 className="text-xl font-semibold">Agent Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm md:text-base">Welcome, {agentName || agentEmail}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-white hover:bg-white/20 hover:text-white px-3 py-1.5 rounded-md text-sm"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <button
            className="h-auto py-8 bg-[#194a95] text-white border-none hover:bg-[#194a95]/90 hover:text-white flex flex-col items-center gap-3 rounded-lg"
            onClick={() => router.push("/scan-qr")}
          >
            <QrCode className="h-6 w-6" />
            <span className="text-base font-medium">Scan QR</span>
          </button>

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
        </div>

        {/* Client List Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Client List
              </div>
              <Link href="/client-list">
                <span className="text-sm text-[#194a95] hover:underline">View All</span>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : clients.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Name</th>
                      <th className="text-left py-3 px-4">Mobile</th>
                      <th className="text-left py-3 px-4">Profession</th>
                      <th className="text-left py-3 px-4">City</th>
                      <th className="text-center py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.slice(0, 5).map((client) => (
                      <tr key={client._id || client.clientId} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{client.name}</td>
                        <td className="py-3 px-4">{client.mobile}</td>
                        <td className="py-3 px-4">{client.profession || "-"}</td>
                        <td className="py-3 px-4">{client.city || "-"}</td>
                        <td className="py-3 px-4 flex justify-center gap-2">
                          <button
                            disabled={accessingClient === client.clientId}
                            onClick={() => handleClientSelect(client.clientId)}
                            className="bg-[#194a95] hover:bg-[#194a95]/90 text-white hover:text-white px-3 py-1.5 rounded-md text-sm flex items-center gap-2"
                          >
                            {accessingClient === client.clientId ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin" />
                                <span>Accessing...</span>
                              </>
                            ) : (
                              <span>Access Dashboard</span>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No clients found</p>
                <button
                  onClick={() => router.push("/register-client")}
                  className="bg-[#194a95] hover:bg-[#194a95]/90 text-white hover:text-white px-4 py-2 rounded-md flex items-center gap-2 mx-auto"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Register New Client</span>
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Add the BackToTop component */}
      <BackToTop />
    </div>
  )
}
