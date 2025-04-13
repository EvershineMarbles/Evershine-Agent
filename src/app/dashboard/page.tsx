"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Users, Package, Bell, Settings, LogOut, UserPlus, Loader2 } from "lucide-react"
import { agentAPI } from "@/lib/api-utils"
import { isAgentAuthenticated, storeClientImpersonationToken, clearAllTokens } from "@/lib/auth-utils"
import { useToast } from "@/components/ui/use-toast"
import DebugPanel from "@/components/debug-panel"

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
  const [showDebug, setShowDebug] = useState(false)

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
  }, [router])

  const fetchClients = async () => {
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
  }

  const handleClientSelect = async (clientId: string) => {
    try {
      console.log("Attempting to impersonate client:", clientId)
      const response = await agentAPI.impersonateClient(clientId)
      console.log("Impersonation response:", response)

      if (response.success && response.data && response.data.impersonationToken) {
        // Store the impersonation token
        storeClientImpersonationToken(clientId, response.data.impersonationToken)
        console.log("Impersonation token stored, redirecting to client dashboard")

        // Add a small delay to ensure token is stored before navigation
        setTimeout(() => {
          router.push(`/client-dashboard/${clientId}`)
        }, 100)
      } else {
        console.error("Failed to get impersonation token:", response)
        toast({
          title: "Error",
          description: response.message || "Failed to access client dashboard",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error impersonating client:", error)
      toast({
        title: "Error",
        description: "Failed to access client dashboard. Please try again.",
        variant: "destructive",
      })
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/" className="mr-4">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <Image src="/logo.png" alt="Evershine Logo" width={120} height={60} />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Welcome, {agentEmail}</span>
            <Button variant="outline" size="sm" onClick={() => setShowDebug(!showDebug)}>
              {showDebug ? "Hide Debug" : "Show Debug"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {showDebug && (
        <div className="container mx-auto mt-4">
          <DebugPanel />
        </div>
      )}

      <main className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Agent Dashboard</h1>
          <Link href="/register-client">
            <Button className="bg-coral hover:bg-coral/90">
              <UserPlus className="h-4 w-4 mr-2" />
              Create Client
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Settings className="h-5 w-5 mr-2 text-blue" />
                Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" className="w-full">
                Manage Account
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Client List
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
                    {clients.map((client) => (
                      <tr key={client._id || client.clientId} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{client.name}</td>
                        <td className="py-3 px-4">{client.mobile}</td>
                        <td className="py-3 px-4">{client.profession || "-"}</td>
                        <td className="py-3 px-4">{client.city || "-"}</td>
                        <td className="py-3 px-4 flex justify-center gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            className="bg-blue hover:bg-blue/90 text-white"
                            onClick={() => handleClientSelect(client.clientId)}
                          >
                            Access Dashboard
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-coral text-coral hover:bg-coral/10"
                            onClick={() => {
                              handleClientSelect(client.clientId).then(() => {
                                router.push(`/client-dashboard/${client.clientId}/products`)
                              })
                            }}
                          >
                            Place Order
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No clients found</p>
                <Link href="/register-client">
                  <Button className="bg-blue hover:bg-blue/90">Create Your First Client</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
