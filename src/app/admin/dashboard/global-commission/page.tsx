"use client"
import { useState, useEffect } from "react"
import type React from "react"

import axios from "axios"
import { toast } from "react-toastify"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Info, Loader2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

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
          // Simplify the data structure - we're always overriding agent commissions
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
          overrideAgentCommissions: true // Always override agent commissions
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
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

        // Show feedback about affected agents
        if (response.data.data.updatedAgentsCount > 0) {
          setFeedback({
            message: `Updated commission rate for ${response.data.data.updatedAgentsCount} agents`,
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
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#194a95]" />
        <span className="ml-2">Loading commission settings...</span>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Standard Commission Rate</h1>

        <Card>
          <CardHeader>
            <CardTitle>Standard Commission Rate</CardTitle>
            <CardDescription>
              Set a standard commission rate that will apply to all agents in the system.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {/* Commission Rate Input */}
                <div className="space-y-2">
                  <Label htmlFor="globalCommissionRate" className="text-base">
                    Standard Commission Rate (%)
                  </Label>
                  <Input
                    id="globalCommissionRate"
                    name="globalCommissionRate"
                    type="number"
                    placeholder="Enter commission rate (e.g., 10)"
                    value={settings.globalCommissionRate === null ? "" : settings.globalCommissionRate}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    step="0.1"
                    className="max-w-xs"
                  />
                  <p className="text-sm text-gray-500">
                    Leave empty to disable standard commission rate and use individual agent rates
                  </p>
                </div>

                {/* Warning Alert */}
                {settings.globalCommissionRate !== null && (
                  <Alert className="mt-4 bg-amber-50 border-amber-200 text-amber-800">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Important</AlertTitle>
                    <AlertDescription>
                      Setting a standard commission rate will override all individual agent commission rates with the rate of{" "}
                      {settings.globalCommissionRate}%. This affects pricing calculations for all agents immediately.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Status Indicator */}
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="flex items-start">
                    <Info className="h-5 w-5 text-blue-500 mt-0.5 mr-2" />
                    <div>
                      <h3 className="font-medium">Current Status</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {settings.isActive
                          ? `✅ Standard commission rate is active at ${settings.globalCommissionRate}%`
                          : "❌ Standard commission rate is not active (using individual agent rates)"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Feedback Message */}
                {feedback && (
                  <Alert
                    variant={
                      feedback.type === "error" ? "destructive" : feedback.type === "success" ? "default" : "default"
                    }
                    className={feedback.type === "info" ? "bg-blue-50 text-blue-800 border-blue-200" : ""}
                  >
                    <AlertDescription>{feedback.message}</AlertDescription>
                  </Alert>
                )}

                {/* Submit Button */}
                <div className="flex justify-end">
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
              </div>
            </form>
          </CardContent>

          <CardFooter className="bg-gray-50 border-t">
            <div className="text-sm text-gray-600">
              <p className="font-medium">How this works:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Set a standard commission rate to apply the same rate to all agents</li>
                <li>When active, all product prices will be calculated using this standard rate</li>
                <li>To use individual agent rates again, clear the standard rate field</li>
              </ul>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
