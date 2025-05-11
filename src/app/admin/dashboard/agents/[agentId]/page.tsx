"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trash2, ArrowLeft, Loader2 } from "lucide-react"
import { fetchWithAdminAuth } from "@/lib/admin-auth"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import AgentClientsTable from "@/components/agent-clients-table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Agent {
  _id: string
  name: string
  email: string
  mobile?: string
  agentId: string
  createdAt: string
  commissionRate?: number // Added commissionRate to the interface
}

export default function AgentDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const agentId = params.agentId as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [agentDetails, setAgentDetails] = useState<Agent | null>(null)
  const [clientCount, setClientCount] = useState(0)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    commissionRate: 0,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchAgentDetails = async () => {
      setLoading(true)
      setError(null)

      try {
        // Fetch agent details
        const response = await fetchWithAdminAuth(`/api/admin/agents/${agentId}`)
        if (!response.ok) {
          throw new Error(`Failed to fetch agent details: ${response.status}`)
        }
        const data = await response.json()
        if (data.success && data.data) {
          setAgentDetails(data.data)

          // Initialize edit form data with agent details
          if (data.data) {
            setEditFormData({
              name: data.data.name,
              email: data.data.email,
              commissionRate: data.data.commissionRate || 0,
            })
          }
        } else {
          throw new Error(data.message || "Failed to fetch agent details")
        }

        // Fetch client count
        const clientsResponse = await fetchWithAdminAuth(`/api/admin/clients?agentAffiliated=${data.data.email}`)
        if (clientsResponse.ok) {
          const clientsData = await clientsResponse.json()
          if (clientsData.success && clientsData.data) {
            setClientCount(clientsData.data.clients.length)
          }
        }
      } catch (err: any) {
        console.error("Error fetching agent details:", err)
        setError(err.message || "Failed to fetch agent details")
      } finally {
        setLoading(false)
      }
    }

    fetchAgentDetails()
  }, [agentId])

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    })
  }

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    // Special handling for commission rate to ensure it's a number between 0-100
    if (name === "commissionRate") {
      // If the value is empty or just a minus sign, set it to 0
      if (value === "" || value === "-") {
        setEditFormData((prev) => ({
          ...prev,
          [name]: 0,
        }))
        return
      }

      // If the value starts with '0' and has more than 1 digit, remove the leading zero
      if (value.length > 1 && value.startsWith("0") && value[1] !== ".") {
        const newValue = value.substring(1)
        const numValue = Number.parseFloat(newValue)
        if (!isNaN(numValue)) {
          const clampedValue = Math.min(Math.max(numValue, 0), 100)
          setEditFormData((prev) => ({
            ...prev,
            [name]: clampedValue,
          }))
          return
        }
      }

      const numValue = Number.parseFloat(value)
      if (isNaN(numValue)) return

      const clampedValue = Math.min(Math.max(numValue, 0), 100)
      setEditFormData((prev) => ({
        ...prev,
        [name]: clampedValue,
      }))
    } else {
      setEditFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agentDetails) return

    setIsSubmitting(true)
    setError(null)

    try {
      console.log("Updating agent with data:", {
        name: editFormData.name,
        email: editFormData.email,
        commissionRate: editFormData.commissionRate,
      })

      // Try updating all fields in a single request first
      try {
        const combinedResponse = await fetchWithAdminAuth(`/api/admin/agents/${agentId}`, {
          method: "PUT",
          body: JSON.stringify({
            name: editFormData.name,
            email: editFormData.email,
            commissionRate: editFormData.commissionRate,
          }),
        })

        const responseData = await combinedResponse.json()
        console.log("Combined update response:", responseData)

        if (!combinedResponse.ok) {
          console.warn("Combined update failed, falling back to separate updates")
          throw new Error("Combined update failed")
        } else {
          // If combined update worked, we're done
          console.log("Combined update successful")

          // Update the agent details in the local state
          setAgentDetails({
            ...agentDetails,
            name: editFormData.name,
            email: editFormData.email,
            commissionRate: editFormData.commissionRate,
          })

          setIsEditModalOpen(false)
          return
        }
      } catch (combinedError) {
        console.log("Falling back to separate updates due to:", combinedError)
        // Continue with separate updates below
      }

      // Fallback: Update name and email separately first
      const nameUpdateResponse = await fetchWithAdminAuth(`/api/admin/agents/${agentId}/update-name`, {
        method: "PATCH",
        body: JSON.stringify({
          name: editFormData.name,
        }),
      })

      const nameResponseData = await nameUpdateResponse.json()
      console.log("Name update response:", nameResponseData)

      if (!nameUpdateResponse.ok) {
        throw new Error(nameResponseData.message || "Failed to update agent name")
      }

      // Then update email separately
      const emailUpdateResponse = await fetchWithAdminAuth(`/api/admin/agents/${agentId}/update-email`, {
        method: "PATCH",
        body: JSON.stringify({
          email: editFormData.email,
        }),
      })

      const emailResponseData = await emailUpdateResponse.json()
      console.log("Email update response:", emailResponseData)

      if (!emailUpdateResponse.ok) {
        throw new Error(emailResponseData.message || "Failed to update agent email")
      }

      // Then update the commission rate separately
      const commissionResponse = await fetchWithAdminAuth(`/api/admin/agents/${agentId}/commission`, {
        method: "PATCH",
        body: JSON.stringify({
          commissionRate: editFormData.commissionRate,
        }),
      })

      const commissionResponseData = await commissionResponse.json()
      console.log("Commission update response:", commissionResponseData)

      if (!commissionResponse.ok) {
        throw new Error(commissionResponseData.message || "Failed to update commission rate")
      }

      // Update the agent details in the local state
      setAgentDetails({
        ...agentDetails,
        name: editFormData.name,
        email: editFormData.email,
        commissionRate: editFormData.commissionRate,
      })

      // Refresh the data from the server to ensure we have the latest
      const refreshResponse = await fetchWithAdminAuth(`/api/admin/agents/${agentId}`)
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json()
        if (refreshData.success && refreshData.data) {
          setAgentDetails(refreshData.data)
          console.log("Refreshed agent data:", refreshData.data)
        }
      }

      setIsEditModalOpen(false)
    } catch (err: any) {
      console.error("Error updating agent:", err)
      setError(err.message || "Failed to update agent")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteAgent = async () => {
    setIsDeleting(true)
    try {
      const response = await fetchWithAdminAuth(`/api/admin/agents/${agentId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to delete agent")
      }

      // Redirect to agents list on success
      router.push("/admin/dashboard/agents")
    } catch (err: any) {
      console.error("Error deleting agent:", err)
      setError(err.message || "An unexpected error occurred")
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col">
        <div className="flex flex-col mb-6">
          <div className="flex items-center mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="mr-2 hover:bg-gray-100"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold">Consultant Details</h1>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6">
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </div>
        ) : (
          agentDetails && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-baseline">
                    <span className="text-lg md:text-xl font-medium">Consultant Name - </span>
                    <span className="text-lg md:text-xl font-bold sm:ml-2">{agentDetails.name}</span>
                  </div>
                  <Separator className="mt-2" />
                </div>

                <div></div>

                <div>
                  <div className="flex flex-col sm:flex-row sm:items-baseline">
                    <span className="text-lg md:text-xl font-medium">Date of Joining - </span>
                    <span className="text-lg md:text-xl font-bold sm:ml-2">{formatDate(agentDetails.createdAt)}</span>
                  </div>
                  <Separator className="mt-2" />
                </div>

                <div>
                  <div className="flex flex-col sm:flex-row sm:items-baseline">
                    <span className="text-lg md:text-xl font-medium">Total Clients - </span>
                    <span className="text-lg md:text-xl font-bold sm:ml-2">{clientCount}</span>
                  </div>
                  <Separator className="mt-2" />
                </div>

                <div>
                  <div className="flex flex-col sm:flex-row sm:items-baseline">
                    <span className="text-lg md:text-xl font-medium">Consultant Email - </span>
                    <span className="text-lg md:text-xl font-bold sm:ml-2">{agentDetails.email}</span>
                  </div>
                  <Separator className="mt-2" />
                </div>

                <div>
                  <div className="flex flex-col sm:flex-row sm:items-baseline">
                    <span className="text-lg md:text-xl font-medium">Commission Rate - </span>
                    <span className="text-lg md:text-xl font-bold sm:ml-2 text-emerald-600">
                      {agentDetails.commissionRate !== undefined ? `${agentDetails.commissionRate}%` : "Not set"}
                    </span>
                  </div>
                  <Separator className="mt-2" />
                </div>
              </div>

              {/* Buttons in a single horizontal line */}
              <div className="flex flex-row gap-3 mt-8 pt-4 border-t flex-wrap md:flex-nowrap">
                <Button
                  className="bg-[#1e4b95] hover:bg-[#1e4b95]/90 text-white px-4 py-2 rounded-md flex-1 whitespace-nowrap"
                  onClick={() => setIsEditModalOpen(true)}
                >
                  Edit
                </Button>

                <Button
                  variant="ghost"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 flex-1 flex items-center justify-center gap-2 whitespace-nowrap"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-5 w-5" />
                  Suspend Consultant
                </Button>
              </div>

              {/* Affiliated Clients Table */}
              {agentDetails && (
                <div className="mt-10 pt-6 border-t">
                  <h2 className="text-xl md:text-2xl font-bold mb-6">Affiliated Clients</h2>
                  <AgentClientsTable agentEmail={agentDetails.email} agentName={agentDetails.name} />
                </div>
              )}
            </div>
          )
        )}
      </div>

      {/* Edit Agent Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Consultant</DialogTitle>
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
              {/* Commission Rate field */}
              <div className="grid gap-2">
                <Label htmlFor="commissionRate">
                  Commission Rate (%)
                  <span className="ml-1 text-sm text-muted-foreground">
                    - Products will be priced higher by this percentage
                  </span>
                </Label>
                <Input
                  id="commissionRate"
                  name="commissionRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={editFormData.commissionRate}
                  onChange={handleEditInputChange}
                  onKeyDown={(e) => {
                    // Allow clearing the field with Backspace or Delete
                    if ((e.key === "Backspace" || e.key === "Delete") && editFormData.commissionRate === 0) {
                      setEditFormData((prev) => ({ ...prev, commissionRate: 0 }))
                    }
                  }}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-3">
            Are you sure you want to delete consultant <span className="font-semibold">{agentDetails?.name}</span>?
            <span className="block mt-2 text-red-500">This action cannot be undone.</span>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAgent} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete Advisor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
