"use client"
import { useState, useEffect } from "react"
import type React from "react"

import axios from "axios"
import { toast } from "react-toastify"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Info, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface CommissionSettings {
  globalCommissionRate: number | null
  isActive: boolean
  updatedAgentsCount?: number
}

export default function GlobalCommissionSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<CommissionSettings>({
    globalCommissionRate: null,
    isActive: false,
  })
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null)

  // Fetch current settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true)
        // Get the admin token - try different possible storage keys
        const token =
          localStorage.getItem("adminToken") ||
          localStorage.getItem("accessToken") ||
          sessionStorage.getItem("adminToken") ||
          localStorage.getItem("admin_token") ||
          localStorage.getItem("token")

        const response = await axios.get(`${API_URL}/api/admin/settings/commission`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (response.data.success) {
          // Simplify the data structure - we're always overriding consultant commissions
          setSettings({
            globalCommissionRate: response.data.data.globalCommissionRate,
            isActive: response.data.data.globalCommissionRate !== null,
          })
        } else {
          toast.error("Failed to load commission settings")
        }
      } catch (error) {
        console.error("Error fetching commission settings:", error)
        toast.error("Failed to load commission settings")
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setSaving(true)
      setFeedback(null)

      // Get the admin token - try different possible storage keys
      const token =
        localStorage.getItem("adminToken") ||
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("adminToken") ||
        localStorage.getItem("admin_token") ||
        localStorage.getItem("token")

      const response = await axios.put(
        `${API_URL}/api/admin/settings/commission`,
        {
          globalCommissionRate: settings.globalCommissionRate,
          overrideAgentCommissions: true, // Always override consultant commissions
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      )

      if (response.data.success) {
        setSettings({
          globalCommissionRate: settings.globalCommissionRate,
          isActive: settings.globalCommissionRate !== null,
          updatedAgentsCount: response.data.data.updatedAgentsCount,
        })

        setFeedback({
          message: "Standard commission rate updated successfully",
          type: "success",
        })

        // Show feedback about affected consultants
        if (response.data.data.updatedAgentsCount > 0) {
          setFeedback({
            message: `Updated commission rate for ${response.data.data.updatedAgentsCount} consultants`,
            type: "info",
          })
        }
      } else {
        setFeedback({
          message: "Failed to update commission settings",
          type: "error",
        })
      }
    } catch (error) {
      console.error("Error updating commission settings:", error)
      setFeedback({
        message: "Failed to update commission settings",
        type: "error",
      })
    } finally {
      setSaving(false)
    }
  }

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target
    setSettings({
      ...settings,
      globalCommissionRate: value === "" ? null : Number.parseFloat(value),
      isActive: value !== "",
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-[#194a95]" />
        <span className="ml-2">Loading...</span>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <Card className="max-w-2xl ml-0">
        {" "}
        {/* Changed from mx-auto to ml-0 to align left */}
        <CardHeader className="pb-4">
          <CardTitle>Standard Commission Rate</CardTitle>
          <CardDescription>Set a standard rate that applies to all consultants in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="globalCommissionRate">Commission Rate (%)</Label>
              <Input
                id="globalCommissionRate"
                name="globalCommissionRate"
                type="number"
                placeholder="Enter rate (e.g., 10)"
                value={settings.globalCommissionRate === null ? "" : settings.globalCommissionRate}
                onChange={handleInputChange}
                min="0"
                max="100"
                step="0.1"
                className="max-w-xs"
              />
              <p className="text-sm text-gray-500">Leave empty to use individual consultant rates</p>
            </div>

            {settings.globalCommissionRate !== null && (
              <Alert className="bg-amber-50 border-amber-200 text-amber-800">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This will override all individual consultant commission rates with {settings.globalCommissionRate}%
                </AlertDescription>
              </Alert>
            )}

            <div className="bg-gray-50 p-3 rounded-md text-sm">
              <div className="flex items-center">
                <Info className="h-4 w-4 text-blue-500 mr-2" />
                <span className="font-medium">Status:</span>
                <span className="ml-2">
                  {settings.isActive
                    ? `Active at ${settings.globalCommissionRate}%`
                    : "Not active (using individual rates)"}
                </span>
              </div>
            </div>

            {feedback && (
              <Alert
                variant={feedback.type === "error" ? "destructive" : "default"}
                className={feedback.type === "info" ? "bg-blue-50 text-blue-800 border-blue-200" : ""}
              >
                <AlertDescription>{feedback.message}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={saving} className="bg-[#194a95] hover:bg-[#0f3a7a]">
                {saving ? (
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
        </CardContent>
        <CardFooter className="bg-gray-50 border-t text-xs text-gray-600">
          <p>Set a rate to apply to all consultants. Clear the field to use individual consultant rates.</p>
        </CardFooter>
      </Card>
    </div>
  )
}
