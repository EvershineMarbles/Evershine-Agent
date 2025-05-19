"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Package, Loader2, Calendar, ShoppingBag } from "lucide-react"
import { agentAPI } from "@/lib/api-utils"
import { isAgentAuthenticated } from "@/lib/auth-utils"
import { useToast } from "@/components/ui/use-toast"

// Define interfaces
interface Client {
  _id: string
  name: string
  clientId: string
  mobile?: string
}

interface Order {
  _id: string
  orderId: string
  clientId: string
}

// Define combined interface for display
interface ClientOrder {
  clientName: string
  clientMobile: string
  orderId: string
  clientId: string
}

export default function AgentOrders() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [clientOrders, setClientOrders] = useState<ClientOrder[]>([])

  // Fetch data
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      // Fetch clients
      console.log("Fetching clients...")
      const clientsResponse = await agentAPI.getClients()
      console.log("Clients response:", clientsResponse)

      if (!clientsResponse.success || !Array.isArray(clientsResponse.data)) {
        console.error("Failed to fetch clients:", clientsResponse.message)
        toast({
          title: "Error",
          description: clientsResponse.message || "Failed to fetch clients",
          variant: "destructive",
        })
        setClientOrders([])
        setIsLoading(false)
        return
      }

      const clients = clientsResponse.data

      // Create a map of clients by clientId for easy lookup
      const clientMap = new Map()
      clients.forEach((client) => {
        clientMap.set(client.clientId, {
          name: client.name || "Unknown",
          mobile: client.mobile || "-",
        })
      })

      // For now, just display clients without orders since orders API isn't working
      const clientOrdersList: ClientOrder[] = []

      // Add each client to the list (even without orders)
      clients.forEach((client) => {
        clientOrdersList.push({
          clientName: client.name || "Unknown",
          clientMobile: client.mobile || "-",
          orderId: "No orders yet",
          clientId: client.clientId,
        })
      })

      // Try to fetch orders if available
      try {
        console.log("Fetching agent orders...")
        const ordersResponse = await agentAPI.getAgentOrders()
        console.log("Orders response:", ordersResponse)

        if (ordersResponse.success && Array.isArray(ordersResponse.data) && ordersResponse.data.length > 0) {
          // Clear the previous list that had placeholder "No orders yet"
          clientOrdersList.length = 0

          // Add actual orders
          ordersResponse.data.forEach((order) => {
            const client = clientMap.get(order.clientId)
            if (client) {
              clientOrdersList.push({
                clientName: client.name,
                clientMobile: client.mobile,
                orderId: order.orderId,
                clientId: order.clientId,
              })
            }
          })
        }
      } catch (orderError) {
        console.error("Error fetching orders:", orderError)
        // Continue with just clients if orders fail
      }

      setClientOrders(clientOrdersList)
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to fetch data. Please try again.",
        variant: "destructive",
      })
      setClientOrders([])
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

  // Handle view client orders
  const handleViewOrders = (clientId: string) => {
    // Navigate to the client orders page instead of the client dashboard
    router.push(`/client-dashboard/${clientId}/orders`)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <p>Loading data...</p>
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
            <h1 className="text-3xl font-bold">Agent Orders</h1>
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

        {/* Client Orders List Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Client Orders
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{clientOrders.length} entries</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {clientOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Client Name</th>
                      <th className="text-left py-3 px-4">Mobile</th>
                      <th className="text-left py-3 px-4">Order ID</th>
                      <th className="text-center py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientOrders.map((item, index) => (
                      <tr key={`${item.clientId}-${item.orderId}-${index}`} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{item.clientName}</td>
                        <td className="py-3 px-4">{item.clientMobile}</td>
                        <td className="py-3 px-4">
                          {item.orderId === "No orders yet" ? (
                            <span className="text-gray-500">No orders yet</span>
                          ) : (
                            item.orderId
                          )}
                        </td>
                        <td className="py-3 px-4 flex justify-center gap-2">
                          <button
                            onClick={() => handleViewOrders(item.clientId)}
                            className="bg-[#194a95] hover:bg-[#194a95]/90 text-white hover:text-white px-3 py-1.5 rounded-md text-sm flex items-center gap-2"
                          >
                            <ShoppingBag className="h-4 w-4 mr-1" />
                            <span>View Orders</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No data found</p>
                <p className="text-gray-500">Client orders will appear here when available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
