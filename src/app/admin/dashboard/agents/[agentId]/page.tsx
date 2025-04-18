"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Trash2 } from "lucide-react"
import { fetchWithAdminAuth } from "@/lib/admin-auth"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

interface Agent {
  _id: string
  name: string
  email: string
  mobile?: string
  agentId: string
  createdAt: string
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
    <div className="p-6">
      <div className="flex flex-col ">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Advisor Details</h1>

          <div className="flex items-center space-x-4">
            <Input
              type="text"
              placeholder="Search by client name, product, sales agent..."
              className="pl-10 py-2 pr-4 border rounded-md w-[450px]"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Button className="bg-[#1e4b95] hover:bg-[#1e4b95]/90 text-white px-4 py-2 rounded-md">Edit</Button>
            <Button
              className="bg-[#1e4b95] hover:bg-[#1e4b95]/90 text-white px-4 py-2 rounded-md"
              onClick={() =>
                router.push(
                  `/admin/dashboard/agents/${agentId}/clients?email=${agentDetails?.email}&name=${agentDetails?.name}`,
                )
              }
            >
              Client List
            </Button>
            <Button variant="outline" className="border-[#1e4b95] text-[#1e4b95] px-4 py-2 rounded-md">
              Suspend
            </Button>
            <Button
              variant="ghost"
              className="text-red-500 hover:text-red-700"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="h-6 w-6" />
            </Button>
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
          </div>
        ) : (
          agentDetails && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <div className="flex items-baseline">
                    <span className="text-xl font-medium">Advisor Name - </span>
                    <span className="text-xl font-bold ml-2">{agentDetails.name}</span>
                  </div>
                  <Separator className="mt-2" />
                </div>

                <div>
                  <div className="flex items-baseline">
                    <span className="text-xl font-medium">Mobile No. - </span>
                    <span className="text-xl font-bold ml-2">{agentDetails.mobile || "+91-XXXXXXXXXX"}</span>
                  </div>
                  <Separator className="mt-2" />
                </div>

                <div>
                  <div className="flex items-baseline">
                    <span className="text-xl font-medium">Date of Joining - </span>
                    <span className="text-xl font-bold ml-2">{formatDate(agentDetails.createdAt)}</span>
                  </div>
                  <Separator className="mt-2" />
                </div>

                <div>
                  <div className="flex items-baseline">
                    <span className="text-xl font-medium">Total Clients - </span>
                    <span className="text-xl font-bold ml-2">{clientCount}</span>
                  </div>
                  <Separator className="mt-2" />
                </div>

                <div>
                  <div className="flex items-baseline">
                    <span className="text-xl font-medium">Current Price Increase % - </span>
                    <span className="text-xl font-bold ml-2">10%</span>
                  </div>
                  <Separator className="mt-2" />
                </div>
              </div>
            </div>
          )
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-3">
            Are you sure you want to delete advisor <span className="font-semibold">{agentDetails?.name}</span>?
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
