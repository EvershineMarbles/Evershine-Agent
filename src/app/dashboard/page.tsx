"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Users, Package, Bell, UserPlus, Loader2, QrCode, List } from "lucide-react"
import { agentAPI } from "@/lib/api-utils"
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
  }, [toast])

  useEffect(() => {
    // Fetch clients
    fetchClients()
  }, [fetchClients])

  if (isLoading && clients.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <p>Loading dashboard...</p>
      </div>
    )
  }

  return (
    <>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {/* Stats Cards - All made clickable with hover effects and centered headings and numbers */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card
          className="border rounded-lg overflow-hidden cursor-pointer transition-all hover:shadow-md hover:border-[#194a95]"
          onClick={() => router.push("/dashboard/client-list")}
        >
          <CardContent className="p-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <Users className="h-6 w-6 text-[#194a95]" />
              <span className="text-gray-600 font-medium">Total Clients</span>
            </div>
            <p className="text-3xl font-bold mt-2">{clients.length}</p>
          </CardContent>
        </Card>

        <Card
          className="border rounded-lg overflow-hidden cursor-pointer transition-all hover:shadow-md hover:border-[#194a95]"
          onClick={() => router.push("/dashboard/consultant-orders")}
        >
          <CardContent className="p-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <Package className="h-6 w-6 text-[#194a95]" />
              <span className="text-gray-600 font-medium">Active Orders</span>
            </div>
            <p className="text-3xl font-bold mt-2">12</p>
          </CardContent>
        </Card>

        <Card
          className="border rounded-lg overflow-hidden cursor-pointer transition-all hover:shadow-md hover:border-[#194a95]"
          onClick={() => router.push("/dashboard/follow-up-reminders")}
        >
          <CardContent className="p-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <Bell className="h-6 w-6 text-[#194a95]" />
              <span className="text-gray-600 font-medium">Pending Reminders</span>
            </div>
            <p className="text-3xl font-bold mt-2">8</p>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          className="h-auto py-8 bg-[#194a95] text-white border-none hover:bg-[#194a95]/90 hover:text-white flex flex-col items-center gap-3 rounded-lg transition-colors"
          onClick={() => router.push("/register-client")}
        >
          <UserPlus className="h-6 w-6" />
          <span className="text-base font-medium">Register a New Client</span>
        </button>

        <button
          className="h-auto py-8 bg-[#194a95] text-white border-none hover:bg-[#194a95]/90 hover:text-white flex flex-col items-center gap-3 rounded-lg transition-colors"
          onClick={() => router.push("/dashboard/client-list")}
        >
          <List className="h-6 w-6" />
          <span className="text-base font-medium">Client List</span>
        </button>

        <button
          className="h-auto py-8 bg-[#194a95] text-white border-none hover:bg-[#194a95]/90 hover:text-white flex flex-col items-center gap-3 rounded-lg transition-colors"
          onClick={() => router.push("/dashboard/scan-qr")}
        >
          <QrCode className="h-6 w-6" />
          <span className="text-base font-medium">Scan QR</span>
        </button>
      </div>
    </>
  )
}
