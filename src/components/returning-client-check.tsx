"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, User, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { clientAPI } from "@/lib/client-api"

interface ExistingClient {
  clientId: string
  clientName: string
  mobile: string
}

export default function ReturningClientCheck() {
  const [mobile, setMobile] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [existingClient, setExistingClient] = useState<ExistingClient | null>(null)
  const [showNewClientOption, setShowNewClientOption] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const checkExistingClient = async () => {
    if (!mobile.trim() || mobile.length < 10) {
      toast({
        title: "Mobile number required",
        description: "Please enter a valid 10-digit mobile number",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      // Use the new API endpoint through our client API helper
      const response = await clientAPI.checkExistingClient(mobile)

      if (response.success) {
        if (response.exists) {
          // Client exists
          setExistingClient({
            clientId: response.clientId,
            clientName: response.clientName,
            mobile: mobile,
          })

          toast({
            title: "Welcome back!",
            description: `Found existing account for ${response.clientName}`,
          })
        } else {
          // Client doesn't exist
          setShowNewClientOption(true)
          toast({
            title: "New client",
            description: "No existing account found. You can create a new account.",
          })
        }
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to check client details",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error checking client:", error)
      toast({
        title: "Error",
        description: "Failed to check client details. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const accessExistingDashboard = async () => {
    if (!existingClient) return

    setIsLoading(true)
    try {
      // Send OTP for verification
      const response = await clientAPI.sendOTP(mobile)

      if (response.success) {
        // Store client info temporarily and redirect to OTP verification
        sessionStorage.setItem("pendingClientAccess", JSON.stringify(existingClient))
        router.push(`/verify-otp?mobile=${mobile}&type=existing`)
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to send OTP",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error sending OTP:", error)
      toast({
        title: "Error",
        description: "Failed to send OTP. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const createNewClient = () => {
    // First send OTP for verification
    sendOTPForNewClient()
  }

  const sendOTPForNewClient = async () => {
    setIsLoading(true)
    try {
      const response = await clientAPI.sendOTP(mobile)

      if (response.success) {
        // Redirect to OTP verification page for new client
        router.push(`/verify-otp?mobile=${mobile}&type=new`)
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to send OTP",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error sending OTP:", error)
      toast({
        title: "Error",
        description: "Failed to send OTP. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setMobile("")
    setExistingClient(null)
    setShowNewClientOption(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-blue-600">Client Access</CardTitle>
          <CardDescription>Enter your mobile number to access your account or create a new one</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!existingClient && !showNewClientOption && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile Number</Label>
                <Input
                  id="mobile"
                  type="tel"
                  placeholder="Enter your mobile number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  maxLength={10}
                />
              </div>
              <Button onClick={checkExistingClient} className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  "Continue"
                )}
              </Button>
            </div>
          )}

          {existingClient && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <User className="h-8 w-8 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-green-800">{existingClient.clientName}</h3>
                    <p className="text-sm text-green-600">{existingClient.mobile}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={accessExistingDashboard}
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      Access My Dashboard
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                <Button onClick={resetForm} variant="outline" className="w-full">
                  Use Different Number
                </Button>
              </div>
            </div>
          )}

          {showNewClientOption && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <h3 className="font-semibold text-blue-800 mb-2">New Client</h3>
                <p className="text-sm text-blue-600">
                  No account found for {mobile}. Would you like to create a new account?
                </p>
              </div>

              <div className="space-y-3">
                <Button onClick={createNewClient} className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      Create New Account
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                <Button onClick={resetForm} variant="outline" className="w-full">
                  Try Different Number
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
