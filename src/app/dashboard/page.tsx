"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Users, LogOut, UserPlus, Loader2, QrCode, ArrowLeft } from "lucide-react"
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
            <Link href="https://evershine-agent.vercel.app/agent-login" className="mr-4">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <Image src="/logo.png" alt="Evershine Logo" width={120} height={60} />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Welcome, {agentEmail}</span>
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link href="/register-client">
            <Button className="bg-coral hover:bg-coral/90 h-24 text-lg font-medium">
              <UserPlus className="h-4 w-4 mr-2" />
              Register New Client
            </Button>
          </Link>

          <Button className="bg-blue hover:bg-blue/90 h-24 text-lg font-medium">
            <QrCode className="h-4 w-4 mr-2" />
            Scan QR Code
          </Button>

          <Link href="/clients" className="w-full">
            <Button className="bg-green-500 hover:bg-green-700 h-24 text-lg font-medium">
              <Users className="h-4 w-4 mr-2" />
              Client List
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
