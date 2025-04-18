"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Plus, RefreshCw, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface Client {
  _id: string
  name: string
  mobile: string
  clientId: string
  email?: string
  city?: string
  profession?: string
  agentAffiliated?: string
  createdAt: string
}

// Function to fetch all clients
const getAllClients = async () => {
  try {
    // Get the token
    const token = localStorage.getItem("admin_token")

    if (!token) {
      return { success: false, message: "No authentication token found" }
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/admin/clients`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    if (data.success && data.data) {
      return {
        success: true,
        clients: data.data.clients || [],
      }
    } else {
      throw new Error(data.message || "Failed to fetch clients")
    }
  } catch (error: any) {
    console.error("Error fetching clients:", error)
    return {
      success: false,
      message: error.message || "An error occurred while fetching clients",
      clients: [],
    }
  }
}

export default function ClientTable() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const fetchClients = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await getAllClients()

      if (response.success) {
        setClients(response.clients)
      } else {
        setError(response.message || "Failed to fetch clients")
      }
    } catch (err: any) {
      console.error("Error fetching clients:", err)
      setError(err.message || "An error occurred while fetching clients")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [])

  // Filter clients based on search query
  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.mobile.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client.email && client.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (client.city && client.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
      client.clientId.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Clients</CardTitle>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              className="w-[250px] pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" onClick={fetchClients} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Client
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={fetchClients}>Retry</Button>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No clients found</p>
            <Button>Register Your First Client</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Profession</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client._id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.mobile}</TableCell>
                    <TableCell>{client.email || "-"}</TableCell>
                    <TableCell>{client.city || "-"}</TableCell>
                    <TableCell>{client.profession || "-"}</TableCell>
                    <TableCell>
                      {client.agentAffiliated ? (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {client.agentAffiliated}
                        </Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>{formatDate(client.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" className="mr-2">
                        View
                      </Button>
                      <Button variant="outline" size="sm" className="mr-2">
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-500 border-red-200 hover:bg-red-50">
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
