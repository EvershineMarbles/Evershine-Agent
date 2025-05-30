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

interface ClientSettings {
  name: string
  email: string
  mobile: string
  city: string
  profession: string
  purpose: string
}

export default function SettingsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const clientId = params.clientId as string

  const [settings, setSettings] = useState<ClientSettings>({
    name: "",
    email: "",
    mobile: "",
    city: "",
    profession: "",
    purpose: "",
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
          // Set client data to state
          setSettings({
            name: data.data.name || "",
            email: data.data.email || "",
            mobile: data.data.mobile || "",
            city: data.data.city || "",
            profession: data.data.profession || "",
            purpose: data.data.purpose || "",
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

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://evershinebackend-2.onrender.com"}/api/update-client`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

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
                    <Label htmlFor="purpose">Purpose</Label>
                    <Input
                      id="purpose"
                      name="purpose"
                      value={settings.purpose}
                      onChange={handleChange}
                      disabled={saving}
                    />
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
