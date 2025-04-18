"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Loader2, Plus, RefreshCw, Search, Eye, Edit, Trash2, Users } from "lucide-react"
import { Input } from "@/components/ui/input"
import { getAllAgents, fetchWithAdminAuth } from "@/lib/admin-auth"
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

interface Agent {
  _id: string
  name: string
  email: string
  agentId: string
  createdAt: string
}

export default function AgentTable() {
  const router = useRouter()
  const { toast } = useToast()
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // State for edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null)
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // State for delete confirmation
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deletingAgent, setDeletingAgent] = useState<Agent | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // State for create modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [createFormData, setCreateFormData] = useState({
    name: "",
    email: "",
    password: "",
  })
  const [isCreating, setIsCreating] = useState(false)

  const fetchAgents = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await getAllAgents()

      if (response.success) {
        setAgents(response.agents)
      } else {
        setError(response.message || "Failed to fetch agents")
      }
    } catch (err: any) {
      console.error("Error fetching agents:", err)
      setError(err.message || "An error occurred while fetching agents")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAgents()
  }, [])

  // Filter agents based on search query
  const filteredAgents = agents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.agentId.toLowerCase().includes(searchQuery.toLowerCase()),
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

  // Handle agent click to view their clients
  const handleAgentClick = (agentId: string, agentEmail: string) => {
    router.push(`/admin/dashboard/agents/${agentId}?email=${encodeURIComponent(agentEmail)}`)
  }

  // Handle opening edit modal
  const handleEditClick = (e: React.MouseEvent, agent: Agent) => {
    e.stopPropagation()
    setEditingAgent(agent)
    setEditFormData({
      name: agent.name,
      email: agent.email,
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
    if (!editingAgent) return

    setIsSubmitting(true)

    try {
      const response = await fetchWithAdminAuth(`/api/admin/agents/${editingAgent.agentId}`, {
        method: "PUT",
        body: JSON.stringify(editFormData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to update agent")
      }

      const data = await response.json()

      // Update the agent in the local state
      setAgents((prev) =>
        prev.map((agent) =>
          agent.agentId === editingAgent.agentId
            ? { ...agent, name: editFormData.name, email: editFormData.email }
            : agent,
        ),
      )

      toast({
        title: "Agent updated",
        description: "The agent has been updated successfully",
      })

      setIsEditModalOpen(false)
    } catch (err: any) {
      console.error("Error updating agent:", err)
      toast({
        title: "Update failed",
        description: err.message || "Failed to update agent",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle opening delete confirmation
  const handleDeleteClick = (e: React.MouseEvent, agent: Agent) => {
    console.log("handleDeleteClick called for agent:", agent) // ADD THIS LINE
    e.stopPropagation()
    setDeletingAgent(agent)
    setIsDeleteModalOpen(true)
  }

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!deletingAgent) return

    setIsDeleting(true)

    try {
      const response = await fetchWithAdminAuth(`/api/admin/agents/${deletingAgent.agentId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to delete agent")
      }

      // Remove the agent from the local state
      setAgents((prev) => prev.filter((agent) => agent.agentId !== deletingAgent.agentId))

      toast({
        title: "Advisor deleted",
        description: `${deletingAgent.name} has been successfully removed from the system.`,
        variant: "default",
      })

      setIsDeleteModalOpen(false)
    } catch (err: any) {
      console.error("Error deleting agent:", err)
      toast({
        title: "Delete failed",
        description: err.message || "Failed to delete advisor. Please try again.",
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
      email: "",
      password: "",
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
      const response = await fetchWithAdminAuth("/api/admin/agents", {
        method: "POST",
        body: JSON.stringify(createFormData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to create agent")
      }

      const data = await response.json()

      // Refresh the agent list
      fetchAgents()

      toast({
        title: "Agent created",
        description: "The agent has been created successfully",
      })

      setIsCreateModalOpen(false)
    } catch (err: any) {
      console.error("Error creating agent:", err)
      toast({
        title: "Creation failed",
        description: err.message || "Failed to create agent",
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
            <h2 className="text-xl font-bold">Advisors</h2>
            <Badge variant="outline" className="ml-2 bg-primary/10 text-primary">
              {agents.length}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search advisors..."
                className="w-[250px] pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" onClick={fetchAgents} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Button className="bg-primary hover:bg-primary/90 text-white" onClick={handleCreateClick}>
              <Plus className="mr-2 h-4 w-4" /> Add Advisor
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
              <Button onClick={fetchAgents}>Retry</Button>
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No advisors found</p>
              <Button className="bg-primary hover:bg-primary/90 text-white" onClick={handleCreateClick}>
                Add Your First Advisor
              </Button>
            </div>
          ) : (
            <div className="space-y-4 p-6">
              {filteredAgents.map((agent) => (
                <div
                  key={agent._id}
                  className="p-4 border rounded-lg hover:shadow-md transition-shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer"
                  onClick={() => handleAgentClick(agent.agentId, agent.email)}
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-primary text-white rounded-full h-12 w-12 flex items-center justify-center text-xl font-bold">
                      {agent.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-medium text-lg">{agent.name}</h3>
                      <div className="text-sm text-gray-500">Joined on {formatDate(agent.createdAt)}</div>
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Users size={16} />
                      <span>0 Clients</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-primary text-primary hover:bg-primary/10"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAgentClick(agent.agentId, agent.email)
                        }}
                      >
                        <Eye size={16} className="mr-1" /> View
                      </Button>
                      <Button variant="outline" size="sm" onClick={(e) => handleEditClick(e, agent)}>
                        <Edit size={16} className="mr-1" /> Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                        onClick={(e) => handleDeleteClick(e, agent)}
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

      {/* Edit Agent Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Agent</DialogTitle>
            <DialogDescription>Make changes to the agent's information.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" value={editFormData.name} onChange={handleEditInputChange} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={editFormData.email}
                  onChange={handleEditInputChange}
                  required
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
              Are you sure you want to delete advisor <span className="font-semibold">{deletingAgent?.name}</span>?
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
                "Delete Advisor"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Agent Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Agent</DialogTitle>
            <DialogDescription>Add a new agent to the system.</DialogDescription>
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
                <Label htmlFor="create-email">Email</Label>
                <Input
                  id="create-email"
                  name="email"
                  type="email"
                  value={createFormData.email}
                  onChange={handleCreateInputChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="create-password">Password</Label>
                <Input
                  id="create-password"
                  name="password"
                  type="password"
                  value={createFormData.password}
                  onChange={handleCreateInputChange}
                  required
                  minLength={8}
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
                  "Create Agent"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
