"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Users, Search, UserPlus, Loader2, Filter } from "lucide-react"
import { agentAPI } from "@/lib/api-utils"
import { isAgentAuthenticated, storeClientImpersonationToken, clearAllTokens } from "@/lib/auth-utils"
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"

// Define client interface
interface Client {
  _id: string
  name: string
  mobile: string
  clientId: string
  profession?: string
  city?: string
  email?: string
  createdAt?: string // Adding createdAt field to the interface
}

export default function ClientList() {
  const router = useRouter()
  const { toast } = useToast()
  const [agentEmail, setAgentEmail] = useState<string | null>(null)
  const [agentName, setAgentName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [clients, setClients] = useState<Client[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [accessingClient, setAccessingClient] = useState<string | null>(null)

  // Wrap fetchClients in useCallback to prevent it from being recreated on every render
  const fetchClients = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await agentAPI.getClients()

      if (response.success && Array.isArray(response.data)) {
        // Sort clients by createdAt date (newest first) or by clientId if createdAt is not available
        const sortedClients = [...response.data].sort((a, b) => {
          // If both have createdAt, compare dates
          if (a.createdAt && b.createdAt) {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          }
          // If only one has createdAt, prioritize the one with createdAt
          if (a.createdAt) return -1
          if (b.createdAt) return 1

          // Fall back to comparing clientIds (assuming higher ID = newer client)
          return b.clientId.localeCompare(a.clientId)
        })

        setClients(sortedClients)
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
  }, [toast])

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
  }, [router, fetchClients])

  const handleClientSelect = async (clientId: string) => {
    try {
      setAccessingClient(clientId)
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
    } finally {
      setAccessingClient(null)
    }
  }

  const handleLogout = () => {
    clearAllTokens()
    router.push("/")
  }

  // Filter clients based on search query
  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.mobile.includes(searchQuery) ||
      (client.profession && client.profession.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (client.city && client.city.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  if (isLoading && clients.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <p>Loading clients...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto py-6 px-4">
        {/* Back button and page title */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <button onClick={() => router.push("/dashboard")} className="p-2 rounded-full hover:bg-gray-100">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-3xl font-bold">Client List</h1>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-grow md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <button
              onClick={() => router.push("/register-client")}
              className="flex items-center gap-2 bg-[#194a95] text-white hover:bg-[#194a95]/90 hover:text-white px-4 py-2 rounded-md"
            >
              <UserPlus className="h-4 w-4" />
              <span>New Client</span>
            </button>
          </div>
        </div>

        {/* Client List Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Client List
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  {filteredClients.length} of {clients.length} clients
                </span>
                <button className="p-1.5 rounded-md hover:bg-gray-100">
                  <Filter className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : filteredClients.length > 0 ? (
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
                    {filteredClients.map((client) => (
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
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? "No clients match your search" : "No clients found"}
                </p>
                {searchQuery ? (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md"
                  >
                    Clear Search
                  </button>
                ) : (
                  <button
                    onClick={() => router.push("/register-client")}
                    className="bg-[#194a95] hover:bg-[#194a95]/90 text-white hover:text-white px-4 py-2 rounded-md flex items-center gap-2 mx-auto"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Register New Client</span>
                  </button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination (if needed in the future) */}
        {filteredClients.length > 10 && (
          <div className="flex justify-end gap-4 mt-8">
            <button className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
              Previous
            </button>
            <button className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
