"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Loader2, Save } from "lucide-react"
import { fetchWithAdminAuth } from "@/lib/admin-auth"
import { useToast } from "@/components/ui/use-toast"

interface ClientDetails {
  _id: string
  name: string
  mobile: string
  clientId: string
  email?: string
  city?: string
  profession?: string
  purpose?: string
  quantityRequired?: number
  agentAffiliated?: string
  createdAt: string
  updatedAt: string
  businessName?: string
  gstNumber?: string
  projectType?: string
  dateOfBirth?: string
  address?: string
  consultantLevel?: string
  architectDetails?: {
    name?: string
    contact?: string
    firm?: string
  }
}

interface ClientEditProps {
  clientId: string
}

export default function ClientEdit({ clientId }: ClientEditProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [client, setClient] = useState<ClientDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchClientData = async () => {
      setLoading(true)
      setError(null)

      try {
        // Fetch client details
        const clientResponse = await fetchWithAdminAuth(`/api/admin/clients/${clientId}`)

        if (!clientResponse.ok) {
          throw new Error(`Failed to fetch client details: ${clientResponse.status}`)
        }

        const clientData = await clientResponse.json()

        if (clientData.success && clientData.data) {
          setClient(clientData.data)
        } else {
          throw new Error(clientData.message || "Failed to fetch client details")
        }
      } catch (err: any) {
        console.error("Error fetching client data:", err)
        setError(err.message || "Failed to fetch client data")
      } finally {
        setLoading(false)
      }
    }

    fetchClientData()
  }, [clientId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    // Handle nested architectDetails fields
    if (name.startsWith("architectDetails.")) {
      const field = name.split(".")[1]
      setClient((prev) =>
        prev
          ? {
              ...prev,
              architectDetails: {
                ...prev.architectDetails,
                [field]: value,
              },
            }
          : null,
      )
    } else {
      setClient((prev) => (prev ? { ...prev, [name]: value } : null))
    }
  }

  // Add this function to handle consultant level changes
  const handleConsultantLevelChange = (level: string) => {
    setClient((prev) => (prev ? { ...prev, consultantLevel: level } : null))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!client) return

    setSaving(true)
    setError(null)

    try {
      const response = await fetchWithAdminAuth(`/api/admin/clients/${clientId}`, {
        method: "PUT",
        body: JSON.stringify(client),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Failed to update client: ${response.status}`)
      }

      toast({
        title: "Success",
        description: "Client details updated successfully",
      })

      // Navigate back to client details page
      router.push(`/admin/dashboard/clients/${clientId}`)
    } catch (err: any) {
      console.error("Error updating client:", err)
      setError(err.message || "Failed to update client")
      toast({
        title: "Error",
        description: err.message || "Failed to update client",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground mb-4">Client not found</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="mr-2">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Edit Client: {client.name}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" value={client.name} onChange={handleChange} disabled={true} />
                <p className="text-xs text-muted-foreground">Name cannot be changed</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile Number</Label>
                <Input id="mobile" name="mobile" value={client.mobile} onChange={handleChange} disabled={true} />
                <p className="text-xs text-muted-foreground">Mobile number cannot be changed</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" name="email" type="email" value={client.email || ""} onChange={handleChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" name="city" value={client.city || ""} onChange={handleChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profession">Profession</Label>
                <Input id="profession" name="profession" value={client.profession || ""} onChange={handleChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose</Label>
                <Input id="purpose" name="purpose" value={client.purpose || ""} onChange={handleChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantityRequired">Quantity Required</Label>
                <Input
                  id="quantityRequired"
                  name="quantityRequired"
                  type="number"
                  value={client.quantityRequired || 0}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="agentAffiliated">Affiliated Agent</Label>
                <Input
                  id="agentAffiliated"
                  name="agentAffiliated"
                  value={client.agentAffiliated || ""}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  name="businessName"
                  value={client.businessName || ""}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gstNumber">GST Number</Label>
                <Input id="gstNumber" name="gstNumber" value={client.gstNumber || ""} onChange={handleChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="projectType">Project Type</Label>
                <Input id="projectType" name="projectType" value={client.projectType || ""} onChange={handleChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  name="dateOfBirth"
                  type="date"
                  value={client.dateOfBirth || ""}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" name="address" value={client.address || ""} onChange={handleChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="architectDetails.name">Architect Name</Label>
                <Input
                  id="architectDetails.name"
                  name="architectDetails.name"
                  value={client.architectDetails?.name || ""}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="architectDetails.contact">Architect Contact</Label>
                <Input
                  id="architectDetails.contact"
                  name="architectDetails.contact"
                  value={client.architectDetails?.contact || ""}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="architectDetails.firm">Architect Firm</Label>
                <Input
                  id="architectDetails.firm"
                  name="architectDetails.firm"
                  value={client.architectDetails?.firm || ""}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2 mt-6">
              <Label htmlFor="consultantLevel" className="text-base font-medium">
                Consultant Level
              </Label>
              <div className="flex items-center gap-6 mt-2">
                <button
                  type="button"
                  onClick={() => handleConsultantLevelChange("red")}
                  className={`w-8 h-8 rounded-full bg-red-500 transition-all ${
                    client.consultantLevel === "red" ? "ring-4 ring-red-200 scale-110" : "hover:scale-105"
                  }`}
                  aria-label="Red consultant level (+5%)"
                />
                <button
                  type="button"
                  onClick={() => handleConsultantLevelChange("yellow")}
                  className={`w-8 h-8 rounded-full bg-yellow-500 transition-all ${
                    client.consultantLevel === "yellow" ? "ring-4 ring-yellow-200 scale-110" : "hover:scale-105"
                  }`}
                  aria-label="Yellow consultant level (+10%)"
                />
                <button
                  type="button"
                  onClick={() => handleConsultantLevelChange("purple")}
                  className={`w-8 h-8 rounded-full bg-purple-600 transition-all ${
                    client.consultantLevel === "purple" ? "ring-4 ring-purple-200 scale-110" : "hover:scale-105"
                  }`}
                  aria-label="Purple consultant level (+15%)"
                />
              </div>
            </div>

            <Separator />

            <div className="flex justify-end">
              <Button variant="outline" type="button" onClick={() => router.back()} className="mr-2">
                Cancel
              </Button>
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
    </div>
  )
}
