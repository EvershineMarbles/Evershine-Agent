"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Save } from "lucide-react"

// Update the ClientSettings interface to include consultantLevel
interface ClientSettings {
  name: string
  email: string
  mobile: string
  city: string
  profession: string
  purpose: string // Kept in interface for API compatibility
  clientId: string
  quantityRequired: number // Kept in interface for API compatibility
  agentAffiliated: string
  createdAt?: string
  updatedAt?: string
  address: string // Kept in interface for API compatibility
  dateOfBirth: string
  businessName: string
  gstNumber: string
  projectType: string
  consultantLevel: string
}

export default function SettingsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const clientId = params.clientId as string

  // Update the initial state to include consultantLevel
  const [settings, setSettings] = useState<ClientSettings>({
    name: "",
    email: "",
    mobile: "",
    city: "",
    profession: "",
    purpose: "",
    clientId: "",
    quantityRequired: 0,
    agentAffiliated: "",
    address: "",
    dateOfBirth: "",
    businessName: "",
    gstNumber: "",
    projectType: "",
    consultantLevel: "red", // Default to red
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchClientData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get the token
        const token = localStorage.getItem("clientImpersonationToken")

        if (!token) {
          throw new Error("No authentication token found. Please refresh the page and try again.")
        }

        // Use the correct API endpoint - make sure this matches your backend route
        // Note: Changed from /api/clients/ to /api/getClientDetails/ based on your route.js file
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "https://evershinebackend-2.onrender.com"}/api/getClientDetails/${clientId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        )

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Client not found. Please check the client ID.")
          } else if (response.status === 401) {
            throw new Error("Authentication failed. Please refresh the token and try again.")
          } else {
            throw new Error(`API error: ${response.status} ${response.statusText}`)
          }
        }

        const data = await response.json()

        if (data.data) {
          // Set client data to state, ensuring we capture all fields
          setSettings({
            name: data.data.name || "",
            email: data.data.email || "",
            mobile: data.data.mobile || "",
            city: data.data.city || "",
            profession: data.data.profession || "",
            purpose: data.data.purpose || "",
            clientId: data.data.clientId || clientId,
            quantityRequired: data.data.quantityRequired || 0,
            agentAffiliated: data.data.agentAffiliated || "",
            createdAt: data.data.createdAt || "",
            updatedAt: data.data.updatedAt || "",
            address: data.data.address || "",
            dateOfBirth: data.data.dateOfBirth ? data.data.dateOfBirth.split("T")[0] : "",
            businessName: data.data.businessName || "",
            gstNumber: data.data.gstNumber || "",
            projectType: data.data.projectType || "",
            consultantLevel: data.data.consultantLevel || "red",
            // Add any additional fields that might be in the client data
            // This ensures we don't lose any data when updating
            ...data.data,
          })
        } else {
          throw new Error("Invalid response format from server")
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
        console.error("Error fetching client data:", error)
        setError(errorMessage)
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchClientData()
  }, [clientId, toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSettings((prev) => ({ ...prev, [name]: value }))
  }

  // Add this function to handle consultant level changes
  const handleConsultantLevelChange = (level: string) => {
    setSettings((prev) => ({ ...prev, consultantLevel: level }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      // Get the token
      const token = localStorage.getItem("clientImpersonationToken")

      if (!token) {
        throw new Error("No authentication token found. Please refresh the page and try again.")
      }

      // Log the data being sent for debugging
      console.log("Updating client with data:", settings)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "https://evershinebackend-2.onrender.com"}/api/update-client`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(settings),
        },
      )

      if (!response.ok) {
        // Try to get more detailed error information
        let errorMessage = `API error: ${response.status} ${response.statusText}`
        try {
          const errorData = await response.json()
          if (errorData && errorData.message) {
            errorMessage = errorData.message
          }
        } catch (e) {
          // If we can't parse the error as JSON, just use the status
        }

        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log("Update response:", data)

      toast({
        title: "Settings Saved",
        description: "Your client settings have been updated successfully.",
      })
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
      console.error("Error saving settings:", error)
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading client settings...</p>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-3xl font-bold mb-8">Client Settings</h1>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4 text-red-800">
            <p>{error}</p>
            <Button
              variant="outline"
              className="mt-2 border-red-300 text-red-800 hover:bg-red-100"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" name="name" value={settings.name} onChange={handleChange} disabled={saving} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={settings.email}
                      onChange={handleChange}
                      disabled={saving}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mobile">Mobile Number</Label>
                    <Input
                      id="mobile"
                      name="mobile"
                      value={settings.mobile}
                      onChange={handleChange}
                      disabled={saving || true} // Mobile is typically immutable
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" name="city" value={settings.city} onChange={handleChange} disabled={saving} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="profession">Profession</Label>
                    <Input
                      id="profession"
                      name="profession"
                      value={settings.profession}
                      onChange={handleChange}
                      disabled={saving}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="agentAffiliated">Agent Affiliated</Label>
                    <Input
                      id="agentAffiliated"
                      name="agentAffiliated"
                      value={settings.agentAffiliated || ""}
                      onChange={handleChange}
                      disabled={true} // Agent affiliation should be immutable
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clientId">Client ID</Label>
                    <Input
                      id="clientId"
                      name="clientId"
                      value={settings.clientId || clientId}
                      disabled={true} // Client ID is immutable
                    />
                  </div>

                  {settings.createdAt && (
                    <div className="space-y-2">
                      <Label htmlFor="createdAt">Created At</Label>
                      <Input
                        id="createdAt"
                        name="createdAt"
                        value={new Date(settings.createdAt).toLocaleString()}
                        disabled={true}
                      />
                    </div>
                  )}

                  {settings.updatedAt && (
                    <div className="space-y-2">
                      <Label htmlFor="updatedAt">Last Updated</Label>
                      <Input
                        id="updatedAt"
                        name="updatedAt"
                        value={new Date(settings.updatedAt).toLocaleString()}
                        disabled={true}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      name="dateOfBirth"
                      type="date"
                      value={settings.dateOfBirth ? settings.dateOfBirth.split("T")[0] : ""}
                      onChange={handleChange}
                      disabled={saving}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name</Label>
                    <Input
                      id="businessName"
                      name="businessName"
                      value={settings.businessName}
                      onChange={handleChange}
                      disabled={saving}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gstNumber">GST Number</Label>
                    <Input
                      id="gstNumber"
                      name="gstNumber"
                      value={settings.gstNumber}
                      onChange={handleChange}
                      disabled={saving}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="projectType">Project Type</Label>
                    <Input
                      id="projectType"
                      name="projectType"
                      value={settings.projectType}
                      onChange={handleChange}
                      disabled={saving}
                    />
                  </div>
                  <div className="space-y-2 col-span-1 md:col-span-2">
                    <Label htmlFor="consultantLevel" className="text-base font-medium">
                      Consultant Level
                    </Label>
                    <div className="flex items-center gap-6 mt-2">
                    <button
                        type="button"
                        onClick={() => handleConsultantLevelChange("red")}
                        className={`w-8 h-8 rounded-full transition-all ${
                          settings.consultantLevel === "red" ? "ring-4 ring-green-200 scale-110" : "hover:scale-105"
                        }`}
                        style={{
                          backgroundColor: settings.consultantLevel === "red" ? "#86D800" : "#86D800",
                        }}
                        onMouseEnter={(e) => {
                          if (settings.consultantLevel !== "red") {
                            e.currentTarget.style.backgroundColor = "#6BA000"
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (settings.consultantLevel !== "red") {
                            e.currentTarget.style.backgroundColor = "#86D800"
                          }
                        }}
                        aria-label="Red consultant level (+5%)"
                        />
                      <button
                        type="button"
                        onClick={() => handleConsultantLevelChange("yellow")}
                        className={`w-8 h-8 rounded-full bg-yellow-500 transition-all ${
                          settings.consultantLevel === "yellow" ? "ring-4 ring-yellow-200 scale-110" : "hover:scale-105"
                        }`}
                        aria-label="Yellow consultant level (+10%)"
                      />
                      <button
                        type="button"
                        onClick={() => handleConsultantLevelChange("purple")}
                        className={`w-8 h-8 rounded-full bg-purple-600 transition-all ${
                          settings.consultantLevel === "purple" ? "ring-4 ring-purple-200 scale-110" : "hover:scale-105"
                        }`}
                        aria-label="Purple consultant level (+15%)"
                      />
                    </div>
                    
                  </div>
                </div>

                <Separator />

                <div className="flex justify-end">
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Preferences settings will be available soon.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Notification settings will be available soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
