"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Plus, RefreshCw, Search, Eye, Edit } from "lucide-react"
import { Input } from "@/components/ui/input"
import { getClientsByAgent } from "@/lib/admin-auth"

interface Client {
  _id: string
  name: string
  mobile: string
  clientId: string
  createdAt: string
}

// Add this interface to define the component props
interface AgentClientsTableProps {
  agentEmail: string
  agentName?: string
}

// Update the component to use the props interface
export default function AgentClientsTable({ agentEmail, agentName }: AgentClientsTableProps) {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // Add a function to handle client click
  const handleClientClick = (clientId: string) => {
    router.push(`/admin/dashboard/clients/${clientId}`)
  }

  const fetchClients = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await getClientsByAgent(agentEmail)

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
    if (agentEmail) {
      fetchClients()
    }
  }, [agentEmail])

  // Filter clients based on search query
  const filteredClients = clients.filter(
    (client) =>
      client.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.mobile?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.clientId?.toLowerCase().includes(searchQuery.toLowerCase()),
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
        <CardTitle>Clients Associated </CardTitle>
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
            <p className="text-muted-foreground mb-4">No clients found for this agent</p>
            <Button>Add Client for this Agent</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow
                    key={client._id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleClientClick(client.clientId)}
                  >
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.mobile}</TableCell>
          
                    <TableCell>{formatDate(client.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="mr-2"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleClientClick(client.clientId)
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" /> View
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
