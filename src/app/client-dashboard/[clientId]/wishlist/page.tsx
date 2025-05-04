"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function ClientDashboard() {
  const params = useParams()
  const { toast } = useToast()
  const clientId = params.clientId as string
  const [clientData, setClientData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchClientData = async () => {
      setLoading(true)
      try {
        // Get the token
        const token = localStorage.getItem("clientImpersonationToken")

        if (!token) {
          throw new Error("No authentication token found. Please refresh the page and try again.")
        }

        // Use the correct API endpoint
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "https://evershinebackend-2.onrender.com"}/api/getClientDetails/${clientId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        )

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Client not found. Please check the client ID.")
          } else if (response.status === 401) {
            throw new Error("Authentication failed. Please refresh the token and try again.")
          } else {
            throw new Error(`API error: ${response.status} ${response.statusText}`)
          }
        }

        const data = await response.json()

        if (data.data) {
          setClientData(data.data)
        } else {
          throw new Error("Invalid response format from server")
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
        console.error("Error fetching client data:", error)
        setError(errorMessage)
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchClientData()
  }, [clientId, toast])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading client data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 md:p-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 flex flex-col items-center">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Client Data</h2>
            <p className="text-red-700 mb-4 text-center">{error}</p>
            <Button onClick={() => window.location.reload()} className="bg-red-600 hover:bg-red-700 text-white">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-3xl font-bold mb-8">Welcome to {clientData?.name || "Client"}&apos;s Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Client Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm text-muted-foreground">Name</dt>
                <dd className="font-medium">{clientData?.name || "N/A"}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Mobile</dt>
                <dd className="font-medium">{clientData?.mobile || "N/A"}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Email</dt>
                <dd className="font-medium">{clientData?.email || "N/A"}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">City</dt>
                <dd className="font-medium">{clientData?.city || "N/A"}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Profession</dt>
                <dd className="font-medium">{clientData?.profession || "N/A"}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Additional dashboard cards can be added here */}
      </div>
    </div>
  )
}
