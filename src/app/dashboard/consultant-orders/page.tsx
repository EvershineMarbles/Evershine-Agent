"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Users, Loader2, Calendar, Phone } from "lucide-react"
import { agentAPI } from "@/lib/api-utils"
import { isAgentAuthenticated } from "@/lib/auth-utils"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"

// Define client interface
interface Client {
  _id: string
  name: string
  clientId: string
  mobile?: string
  email?: string
  city?: string
  profession?: string
}

export default function AgentOrders() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [clients, setClients] = useState<Client[]>([])

  // Fetch clients
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      // Fetch clients
      console.log("Fetching clients...")
      const clientsResponse = await agentAPI.getClients()
      console.log("Clients response:", clientsResponse)

      if (clientsResponse.success && Array.isArray(clientsResponse.data)) {
        setClients(clientsResponse.data)
      } else {
        console.error("Failed to fetch clients:", clientsResponse.message)
        toast({
          title: "Error",
          description: clientsResponse.message || "Failed to fetch clients",
          variant: "destructive",
        })
        setClients([])
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to fetch data. Please try again.",
        variant: "destructive",
      })
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

    // Fetch data
    fetchData()
  }, [router, fetchData])

  // Handle view client details
  const handleViewClient = (clientId: string) => {
    router.push(`/client-dashboard/${clientId}`)
  }

  if (isLoading) {
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
            <h1 className="text-3xl font-bold">Your Clients</h1>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => fetchData()}
              className="flex items-center gap-2 bg-[#194a95] text-white hover:bg-[#194a95]/90 hover:text-white px-4 py-2 rounded-md"
            >
              <Calendar className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Clients List Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Client List
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {clients.length} Clients
                </Badge>
              </div>
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
                      <th className="text-left py-3 px-4">City</th>
                      <th className="text-left py-3 px-4">Profession</th>
                      <th className="text-center py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((client) => (
                      <tr key={client.clientId} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{client.name}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <Phone className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                            {client.mobile || "-"}
                          </div>
                        </td>
                        <td className="py-3 px-4">{client.city || "-"}</td>
                        <td className="py-3 px-4">{client.profession || "-"}</td>
                        <td className="py-3 px-4 flex justify-center gap-2">
                          <button
                            onClick={() => handleViewClient(client.clientId)}
                            className="bg-[#194a95] hover:bg-[#194a95]/90 text-white hover:text-white px-3 py-1.5 rounded-md text-sm flex items-center gap-2"
                          >
                            <span>Access Dashboard</span>
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
                  className="bg-[#194a95] hover:bg-[#194a95]/90 text-white hover:text-white px-4 py-2 rounded-md"
                >
                  Register New Client
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
