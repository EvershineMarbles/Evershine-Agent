"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { fetchWithAdminAuth } from "@/lib/admin-auth"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Loader2 } from "lucide-react"

interface Agent {
  _id: string
  name: string
  email: string
  mobile?: string
  agentId: string
  createdAt: string
  commissionRate?: number
}

export default function EditAgentPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const agentId = params.agentId as string

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    commissionRate: 0,
  })

  useEffect(() => {
    const fetchAgentDetails = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetchWithAdminAuth(`/api/admin/agents/${agentId}`)
        if (!response.ok) {
          throw new Error(`Failed to fetch agent details: ${response.status}`)
        }
        const data = await response.json()
        if (data.success && data.data) {
          setFormData({
            name: data.data.name,
            email: data.data.email,
            commissionRate: data.data.commissionRate || 0,
          })
        } else {
          throw new Error(data.message || "Failed to fetch agent details")
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    // Special handling for commission rate to ensure it's a number between 0-100
    if (name === "commissionRate") {
      // If the value is empty or just a minus sign, set it to 0
      if (value === "" || value === "-") {
        setFormData((prev) => ({
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
          setFormData((prev) => ({
            ...prev,
            [name]: clampedValue,
          }))
          return
        }
      }

      const numValue = Number.parseFloat(value)
      if (isNaN(numValue)) return

      const clampedValue = Math.min(Math.max(numValue, 0), 100)
      setFormData((prev) => ({
        ...prev,
        [name]: clampedValue,
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      // First update the general agent info
      const response = await fetchWithAdminAuth(`/api/admin/agents/${agentId}`, {
        method: "PUT",
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to update agent")
      }

      // Then update the commission rate separately
      const commissionResponse = await fetchWithAdminAuth(`/api/admin/agents/${agentId}/commission`, {
        method: "PATCH",
        body: JSON.stringify({
          commissionRate: formData.commissionRate,
        }),
      })

      if (!commissionResponse.ok) {
        const errorData = await commissionResponse.json()
        throw new Error(errorData.message || "Failed to update commission rate")
      }

      toast({
        title: "Consultant updated",
        description: "The consultant has been updated successfully",
      })

      // Navigate back to the agent details page
      router.push(`/admin/dashboard/agents/${agentId}`)
    } catch (err: any) {
      console.error("Error updating agent:", err)
      setError(err.message || "Failed to update consultant")
      toast({
        title: "Update failed",
        description: err.message || "Failed to update consultant",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="mr-2 hover:bg-gray-100"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold">Edit Consultant</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6">
          <p>{error}</p>
        </div>
      )}

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <h2 className="text-xl font-semibold">Consultant Information</h2>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

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
                    value={formData.commissionRate}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="bg-[#1e4b95] hover:bg-[#1e4b95]/90">
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
