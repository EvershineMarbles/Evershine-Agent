"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, User, UserPlus, Phone, CheckCircle, AlertCircle } from "lucide-react"
import { clientAPI } from "@/lib/client-api"
import { useToast } from "@/components/ui/use-toast"

export default function AgentClientAccess() {
  const [mobile, setMobile] = useState("")
  const [isChecking, setIsChecking] = useState(false)
  const [isSendingOTP, setIsSendingOTP] = useState(false)
  const [clientStatus, setClientStatus] = useState<{
    checked: boolean
    exists: boolean
    clientName?: string
    clientId?: string
    message?: string
  }>({
    checked: false,
    exists: false,
  })

  const router = useRouter()
  const { toast } = useToast()

  const handleMobileChange = (value: string) => {
    // Only allow numbers and limit to 10 digits
    const numericValue = value.replace(/\D/g, "").slice(0, 10)
    setMobile(numericValue)

    // Reset client status when mobile changes
    if (clientStatus.checked) {
      setClientStatus({ checked: false, exists: false })
    }
  }

  const checkClientExists = async () => {
    if (mobile.length !== 10) {
      toast({
        title: "Invalid Mobile Number",
        description: "Please enter a valid 10-digit mobile number",
        variant: "destructive",
      })
      return
    }

    setIsChecking(true)
    try {
      // Check if client exists using the new backend endpoint
      const result = await clientAPI.checkExistingClient(mobile)

      setClientStatus({
        checked: true,
        exists: result.exists,
        clientName: result.clientName,
        clientId: result.clientId,
        message: result.message,
      })

      if (result.exists) {
        toast({
          title: "Client Found!",
          description: `Welcome back, ${result.clientName}`,
        })
      } else {
        toast({
          title: "New Client",
          description: "This mobile number is not registered yet",
        })
      }
    } catch (error) {
      console.error("Error checking client:", error)
      toast({
        title: "Error",
        description: "Failed to check client status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsChecking(false)
    }
  }

  const sendOTPAndProceed = async () => {
    setIsSendingOTP(true)
    try {
      // Send OTP to the mobile number
      const otpResult = await clientAPI.sendOTP(mobile)

      if (otpResult.success) {
        toast({
          title: "OTP Sent",
          description: `Verification code sent to +91${mobile}`,
        })

        // Navigate to OTP verification with client status
        const params = new URLSearchParams({
          mobile: mobile,
          phone: otpResult.formattedPhone || `+91${mobile}`,
          type: clientStatus.exists ? "existing" : "new",
        })

        // Add client details if existing client
        if (clientStatus.exists && clientStatus.clientId && clientStatus.clientName) {
          params.append("clientId", clientStatus.clientId)
          params.append("clientName", clientStatus.clientName)
        }

        router.push(`/verify-otp?${params.toString()}`)
      } else {
        toast({
          title: "Failed to Send OTP",
          description: otpResult.message || "Please try again",
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
      setIsSendingOTP(false)
    }
  }

  const resetForm = () => {
    setMobile("")
    setClientStatus({ checked: false, exists: false })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">Client Access</CardTitle>
            <CardDescription className="text-gray-600">
              Enter client's mobile number to check status and access dashboard
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Mobile Number Input */}
            <div className="space-y-4">
              <div>
                <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">+91</span>
                  </div>
                  <Input
                    id="mobile"
                    type="tel"
                    value={mobile}
                    onChange={(e) => handleMobileChange(e.target.value)}
                    placeholder="Enter 10-digit mobile number"
                    className="pl-12"
                    maxLength={10}
                    disabled={isChecking || isSendingOTP}
                  />
                </div>
              </div>

              {/* Check Client Button */}
              {!clientStatus.checked && (
                <Button
                  onClick={checkClientExists}
                  disabled={mobile.length !== 10 || isChecking}
                  className="w-full bg-[#194a95] hover:bg-[#153d7a]"
                >
                  {isChecking ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <Phone className="h-4 w-4 mr-2" />
                      Check Client Status
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Client Status Display */}
            {clientStatus.checked && (
              <div className="space-y-4">
                {clientStatus.exists ? (
                  // Existing Client Card
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-green-800">Client Found!</span>
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Existing
                          </Badge>
                        </div>
                        <div className="text-green-700">
                          <p className="font-semibold">{clientStatus.clientName}</p>
                          <p className="text-sm">Mobile: +91{mobile}</p>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                ) : (
                  // New Client Card
                  <Alert className="border-blue-200 bg-blue-50">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-blue-800">New Client</span>
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            Registration Required
                          </Badge>
                        </div>
                        <div className="text-blue-700">
                          <p>Mobile: +91{mobile}</p>
                          <p className="text-sm">This number is not registered yet</p>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={sendOTPAndProceed}
                    disabled={isSendingOTP}
                    className="w-full bg-[#194a95] hover:bg-[#153d7a]"
                  >
                    {isSendingOTP ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending OTP...
                      </>
                    ) : clientStatus.exists ? (
                      <>
                        <User className="h-4 w-4 mr-2" />
                        Send OTP to Access Dashboard
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Send OTP to Register Client
                      </>
                    )}
                  </Button>

                  <Button variant="outline" onClick={resetForm} className="w-full">
                    Try Different Number
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
