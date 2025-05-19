"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { fetchWithAdminAuth } from "@/lib/admin-auth"

interface Agent {
  _id: string
  name: string
  email: string
  agentId: string
  createdAt: string
}

interface EditAgentFormProps {
  agentId: string
}

export default function EditAgentForm({ agentId }: EditAgentFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAgentDetails = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetchWithAdminAuth(`/api/admin/agents/${agentId}`)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || "Failed to fetch agent details")
        }

        const data = await response.json()

        if (data.success && data.data) {
          setFormData({
            name: data.data.name,
            email: data.data.email,
          })
        } else {
          throw new Error(data.message || "Failed to fetch agent details")
        }
      } catch (err: any) {
        console.error("Error fetching agent details:", err)
        setError(err.message || "An unexpected error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchAgentDetails()
  }, [agentId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const response = await fetchWithAdminAuth(`/api/admin/agents/${agentId}`, {
        method: "PUT",
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to update agent")
      }

      // Redirect to agents list on success
      router.push("/admin/dashboard/agents")
    } catch (err: any) {
      console.error("Error updating agent:", err)
      setError(err.message || "An unexpected error occurred")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Edit Agent</CardTitle>
      </CardHeader>
      <CardContent>
        {error && <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4">{error}</div>}
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Agent Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter agent name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter email address"
                type="email"
              />
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
