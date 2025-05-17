"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Loader2, RefreshCw, Search, Eye, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { fetchWithAdminAuth } from "@/lib/admin-auth"
import { ArrowLeft } from "lucide-react"


interface Client {
  _id: string
  name: string
  mobile: string
  clientId: string
  agentAffiliated?: string
  city?: string
  profession?: string
  createdAt: string
  consultantLevel?: string
}

interface Agent {
  _id: string
  email: string
  name: string
}

// Function to fetch all clients
const getAllClients = async () => {
  try {
    const response = await fetchWithAdminAuth("/api/admin/clients")

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || `API error: ${response.status}`)
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

// Function to fetch all agents
const getAllAgents = async () => {
  try {
    const response = await fetchWithAdminAuth("/api/admin/agents")

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || `API error: ${response.status}`)
    }

    const data = await response.json()

    if (data.success && data.data) {
      return {
        success: true,
        agents: data.data.agents || [],
      }
    } else {
      throw new Error(data.message || "Failed to fetch agents")
    }
  } catch (error: any) {
    console.error("Error fetching agents:", error)
    return {
      success: false,
      message: error.message || "An error occurred while fetching agents",
      agents: [],
    }
  }
}

// Function to delete a client
const deleteClient = async (clientId: string) => {
  try {
    const response = await fetchWithAdminAuth(`/api/admin/clients/${clientId}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || `API error: ${response.status}`)
    }

    const data = await response.json()

    if (data.success) {
      return {
        success: true,
        message: data.message || "Client deleted successfully",
      }
    } else {
      throw new Error(data.message || "Failed to delete client")
    }
  } catch (error: any) {
    console.error("Error deleting client:", error)
    throw new Error(error.message || "An error occurred while deleting client")
  }
}

// Function to update a client
const updateClient = async (clientId: string, updateData: any) => {
  try {
    const response = await fetchWithAdminAuth(`/api/admin/clients/${clientId}`, {
      method: "PUT",
      body: JSON.stringify(updateData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || `API error: ${response.status}`)
    }

    const data = await response.json()

    if (data.success) {
      return {
        success: true,
        message: data.message || "Client updated successfully",
        client: data.data,
      }
    } else {
      throw new Error(data.message || "Failed to update client")
    }
  } catch (error: any) {
    console.error("Error updating client:", error)
    throw new Error(error.message || "An error occurred while updating client")
  }
}

export default function ClientTable() {
  const { toast } = useToast()
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // State for edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [editFormData, setEditFormData] = useState({
    name: "",
    mobile: "",
    city: "",
    profession: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // State for delete confirmation
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deletingClient, setDeletingClient] = useState<Client | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // State for create modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [createFormData, setCreateFormData] = useState({
    name: "",
    mobile: "",
    city: "",
    profession: "",
    agentAffiliated: "",
  })
  const [isCreating, setIsCreating] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch clients and agents in parallel
      const [clientsResponse, agentsResponse] = await Promise.all([getAllClients(), getAllAgents()])

      if (clientsResponse.success && agentsResponse.success) {
        setClients(clientsResponse.clients)
        setAgents(agentsResponse.agents)
      } else {
        setError(clientsResponse.message || agentsResponse.message || "Failed to fetch data")
      }
    } catch (err: any) {
      console.error("Error fetching data:", err)
      setError(err.message || "An error occurred while fetching data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Get agent name from email
  const getAgentName = (agentEmail?: string) => {
    if (!agentEmail) return "-"

    const agent = agents.find((a) => a.email === agentEmail)
    return agent ? agent.name : agentEmail
  }

  // Filter clients based on search query
  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.mobile.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.clientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client.city && client.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (client.profession && client.profession.toLowerCase().includes(searchQuery.toLowerCase())),
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

  // Handle client click to view details
  const handleClientClick = (clientId: string) => {
    // Navigate to client details page
    router.push(`/admin/dashboard/clients/${clientId}`)
  }

  // Handle opening edit modal
  const handleEditClick = (e: React.MouseEvent, client: Client) => {
    e.stopPropagation()
    setEditingClient(client)
    setEditFormData({
      name: client.name,
      mobile: client.mobile,
      city: client.city || "",
      profession: client.profession || "",
    })
    setIsEditModalOpen(true)
  }

  // Handle edit form input change
  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Handle edit form submission
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingClient) return

    setIsSubmitting(true)

    try {
      // Make API call to update the client
      const updateData = {
        city: editFormData.city,
        profession: editFormData.profession,
      }

      const result = await updateClient(editingClient.clientId, updateData)

      toast({
        title: "Client updated",
        description: "The client has been updated successfully",
      })

      // Update the client in the local state
      setClients((prev) =>
        prev.map((client) =>
          client.clientId === editingClient.clientId
            ? {
                ...client,
                city: editFormData.city,
                profession: editFormData.profession,
              }
            : client,
        ),
      )

      setIsEditModalOpen(false)
    } catch (err: any) {
      console.error("Error updating client:", err)
      toast({
        title: "Update failed",
        description: err.message || "Failed to update client",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle opening delete confirmation
  const handleDeleteClick = (e: React.MouseEvent, client: Client) => {
    e.stopPropagation()
    setDeletingClient(client)
    setIsDeleteModalOpen(true)
  }

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!deletingClient) return

    setIsDeleting(true)

    try {
      // Make API call to delete the client
      await deleteClient(deletingClient.clientId)

      toast({
        title: "Client deleted",
        description: `${deletingClient.name} has been successfully removed from the system.`,
        variant: "default",
      })

      // Remove the client from the local state
      setClients((prev) => prev.filter((client) => client.clientId !== deletingClient.clientId))

      setIsDeleteModalOpen(false)
    } catch (err: any) {
      console.error("Error deleting client:", err)
      toast({
        title: "Delete failed",
        description: err.message || "Failed to delete client. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle opening create modal
  const handleCreateClick = () => {
    setCreateFormData({
      name: "",
      mobile: "",
      city: "",
      profession: "",
      agentAffiliated: "",
    })
    setIsCreateModalOpen(true)
  }

  // Handle create form input change
  const handleCreateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCreateFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Handle create form submission
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setIsCreating(true)

    try {
      // In a real app, you would make an API call to create the client
      // For now, we'll just show a success message and refresh the data
      toast({
        title: "Client created",
        description: "The client has been created successfully",
      })

      // Refresh the client list
      fetchData()

      setIsCreateModalOpen(false)
    } catch (err: any) {
      console.error("Error creating client:", err)
      toast({
        title: "Creation failed",
        description: err.message || "Failed to create client",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <>
      <Card className="shadow-sm border-0">
        <CardHeader className="flex flex-row items-center justify-between p-6">
          <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/admin/dashboard")}
            className="mr-2 hover:bg-gray-100"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
            <h2 className="text-xl font-bold">Clients</h2>
            <Badge variant="outline" className="ml-2 bg-primary/10 text-primary">
              {clients.length}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                className="w-[250px] pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={fetchData}>Retry</Button>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No clients found</p>
              <Button className="bg-primary hover:bg-primary/90 text-white" onClick={handleCreateClick}>
                Add Your First Client
              </Button>
            </div>
          ) : (
            <div className="space-y-4 p-6">
              {filteredClients.map((client) => (
                <div
                  key={client._id}
                  className="p-4 border rounded-lg hover:shadow-md transition-shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer"
                  onClick={() => handleClientClick(client.clientId)}
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-primary text-white rounded-full h-12 w-12 flex items-center justify-center text-xl font-bold">
                      {client.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-medium text-lg">{client.name}</h3>
                      <div className="text-sm text-gray-500">
                        <span className="mr-3">{client.mobile}</span>
                        {client.city && <span className="mr-3">• {client.city}</span>}
                        {client.profession && <span>• {client.profession}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
                    {client.agentAffiliated && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {getAgentName(client.agentAffiliated)}
                      </Badge>
                    )}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-primary text-primary hover:bg-primary/10"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleClientClick(client.clientId)
                        }}
                      >
                        <Eye size={16} className="mr-1" /> View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                        onClick={(e) => handleDeleteClick(e, client)}
                      >
                        <Trash2 size={16} className="mr-1" /> Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Client Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>Make changes to the client's information.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" value={editFormData.name} onChange={handleEditInputChange} disabled />
                <p className="text-xs text-muted-foreground">Name cannot be changed</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="mobile">Mobile</Label>
                <Input
                  id="mobile"
                  name="mobile"
                  value={editFormData.mobile}
                  onChange={handleEditInputChange}
                  disabled
                />
                <p className="text-xs text-muted-foreground">Mobile number cannot be changed</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" name="city" value={editFormData.city} onChange={handleEditInputChange} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="profession">Profession</Label>
                <Input
                  id="profession"
                  name="profession"
                  value={editFormData.profession}
                  onChange={handleEditInputChange}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Confirm Deletion</DialogTitle>
            <DialogDescription className="py-3">
              Are you sure you want to delete client <span className="font-semibold">{deletingClient?.name}</span>?
              <p className="mt-2 text-red-500">This action cannot be undone.</p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Client"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Client Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Client</DialogTitle>
            <DialogDescription>Add a new client to the system.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="create-name">Name</Label>
                <Input
                  id="create-name"
                  name="name"
                  value={createFormData.name}
                  onChange={handleCreateInputChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="create-mobile">Mobile</Label>
                <Input
                  id="create-mobile"
                  name="mobile"
                  value={createFormData.mobile}
                  onChange={handleCreateInputChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="create-city">City</Label>
                <Input id="create-city" name="city" value={createFormData.city} onChange={handleCreateInputChange} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="create-profession">Profession</Label>
                <Input
                  id="create-profession"
                  name="profession"
                  value={createFormData.profession}
                  onChange={handleCreateInputChange}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)} disabled={isCreating}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Client"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
