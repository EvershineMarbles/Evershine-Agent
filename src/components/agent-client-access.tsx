"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, User, ArrowRight, Phone } from "lucide-react"
import { useRouter } from "next/navigation"
import { clientAPI } from "@/lib/client-api"
import Image from "next/image"

interface ExistingClient {
  clientId: string
  clientName: string
  mobile: string
}

export default function AgentClientAccess() {
  const [mobile, setMobile] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [existingClient, setExistingClient] = useState<ExistingClient | null>(null)
  const [showNewClientOption, setShowNewClientOption] = useState(false)
  const [otpSending, setOtpSending] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Check if agent is authenticated
  const isAgentAuthenticated = () => {
    if (typeof window === "undefined") return false
    return !!localStorage.getItem("agentToken")
  }

  const checkExistingClient = async () => {
    if (!mobile.trim() || mobile.length < 10) {
      toast({
        title: "Mobile number required",
        description: "Please enter a valid 10-digit mobile number",
        variant: "destructive",
      })
      return
    }

    // Check if agent is authenticated
    if (!isAgentAuthenticated()) {
      toast({
        title: "Authentication required",
        description: "Please login as an agent first",
        variant: "destructive",
      })
      router.push("/agent-login")
      return
    }

    setIsLoading(true)
    try {
      // Use the API endpoint through our client API helper
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
            title: "Client Found",
            description: `Found existing client: ${response.clientName}`,
          })
        } else {
          // Client doesn't exist
          setShowNewClientOption(true)
          toast({
            title: "New Client",
            description: "No existing client found with this mobile number",
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

  const sendOTPForExistingClient = async () => {
    if (!existingClient) return

    setOtpSending(true)
    try {
      // Send OTP for verification
      const response = await clientAPI.sendOTP(mobile)

      if (response.success) {
        // Store client info temporarily and redirect to OTP verification
        sessionStorage.setItem("pendingClientAccess", JSON.stringify(existingClient))
        router.push(`/verify-otp?mobile=${mobile}&type=existing`)

        toast({
          title: "OTP Sent",
          description: "Please verify the OTP sent to the client's mobile",
        })
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
      setOtpSending(false)
    }
  }

  const sendOTPForNewClient = async () => {
    setOtpSending(true)
    try {
      const response = await clientAPI.sendOTP(mobile)

      if (response.success) {
        // Redirect to OTP verification page for new client
        router.push(`/verify-otp?mobile=${mobile}&type=new`)

        toast({
          title: "OTP Sent",
          description: "Please verify the OTP sent to the client's mobile",
        })
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
      setOtpSending(false)
    }
  }

  const resetForm = () => {
    setMobile("")
    setExistingClient(null)
    setShowNewClientOption(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md mb-6">
        <div className="flex justify-center mb-4">
          <Image src="/logo.png" alt="Evershine Logo" width={180} height={60} className="h-12 w-auto" />
        </div>
      </div>

      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-[#194a95]">Client Access</CardTitle>
          <CardDescription>Enter client's mobile number to access or create their account</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {!existingClient && !showNewClientOption && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile Number</Label>
                <div className="flex items-center space-x-2">
                  <div className="bg-gray-100 px-3 py-2 rounded-l-md border border-r-0 border-gray-300">
                    <span className="text-gray-500">+91</span>
                  </div>
                  <Input
                    id="mobile"
                    type="tel"
                    placeholder="Enter client's 10-digit mobile number"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    maxLength={10}
                    className="rounded-l-none"
                  />
                </div>
              </div>
              <Button
                onClick={checkExistingClient}
                className="w-full bg-[#194a95] hover:bg-[#0d3a7d]"
                disabled={isLoading || mobile.length !== 10}
              >
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
                    <div className="flex items-center text-sm text-green-600">
                      <Phone className="h-3 w-3 mr-1" />
                      +91 {existingClient.mobile}
                    </div>
                    <p className="text-xs text-green-600 mt-1">This client already exists in the system</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={sendOTPForExistingClient}
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={otpSending}
                >
                  {otpSending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      Send OTP to Access Dashboard
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

          {showNewClientOption && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <h3 className="font-semibold text-blue-800 mb-2">New Client</h3>
                <p className="text-sm text-blue-600">No client found with mobile number +91 {mobile}</p>
                <p className="text-xs text-blue-600 mt-1">You can register this client as a new client</p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={sendOTPForNewClient}
                  className="w-full bg-[#194a95] hover:bg-[#0d3a7d]"
                  disabled={otpSending}
                >
                  {otpSending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      Send OTP to Register New Client
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

        <CardFooter className="flex justify-center pt-0">
          <p className="text-xs text-gray-500 text-center">
            Any agent can access any client's dashboard after OTP verification
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
