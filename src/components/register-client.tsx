"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Phone, User, Mail, MapPin, Building, Calendar, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { isAgentAuthenticated } from "@/lib/auth-utils"
import { clientAPI } from "@/lib/client-api"

export default function RegisterClient() {
  const router = useRouter()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const mobileFromParams = searchParams.get("mobile")
  const isVerified = searchParams.get("verified") === "true"

  const [step, setStep] = useState<"initial" | "otp" | "details">("initial")
  const [formData, setFormData] = useState({
    name: "",
    mobile: mobileFromParams || "",
    email: "",
    address: "",
    city: "",
    state: "",
    profession: "architect",
    businessName: "",
    gstNumber: "",
    projectType: "",
    dateOfBirth: "",
    anniversaryDate: "",
    architectDetails: "",
    consultantLevel: "red",
    agreeToTerms: false,
  })
  const [isLoading, setIsLoading] = useState(false)

  // OTP state and refs
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const otpInputs = useRef<(HTMLInputElement | null)[]>([null, null, null, null, null, null])

  // Additional state for API interactions
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiError, setApiError] = useState("")
  const [formattedPhone, setFormattedPhone] = useState("")

  // Client existence check state
  const [existingClient, setExistingClient] = useState<{
    exists: boolean
    clientId?: string
    clientName?: string
  } | null>(null)

  // Effect to handle pre-filled mobile number from OTP verification
  useEffect(() => {
    if (mobileFromParams && isVerified) {
      setFormData((prev) => ({
        ...prev,
        mobile: mobileFromParams,
      }))

      // If mobile is verified, skip to details step
      setStep("details")
    }
  }, [mobileFromParams, isVerified])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle OTP input changes
  const handleOtpChange = (index: number, value: string) => {
    // Create a new array to avoid direct state mutation
    const newOtp = [...otp]

    // Handle pasting multiple digits
    if (value.length > 1) {
      const digits = value.split("")
      // Fill as many inputs as we have digits, starting from the current index
      for (let i = 0; i < digits.length && index + i < 6; i++) {
        newOtp[index + i] = digits[i]
      }
      setOtp(newOtp)

      // Focus on the next empty field or the last field
      const nextEmptyIndex = Math.min(index + value.length, 5)
      setTimeout(() => {
        otpInputs.current[nextEmptyIndex]?.focus()
      }, 0)
    } else {
      // Handle single digit input
      newOtp[index] = value
      setOtp(newOtp)

      // Auto-focus next input if a digit was entered
      if (value && index < 5) {
        setTimeout(() => {
          otpInputs.current[index + 1]?.focus()
        }, 0)
      }
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace to go to previous field
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus()
    }
  }

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, agreeToTerms: checked }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Submit initial form with mobile number - CHECK CLIENT FIRST
  const handleSubmitInitial = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setApiError("")

    // Basic validation
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid name",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    if (!formData.mobile.trim() || formData.mobile.length < 10) {
      toast({
        title: "Error",
        description: "Please enter a valid mobile number",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    try {
      // Format phone number first
      const phoneNumber = formData.mobile.startsWith("+") ? formData.mobile : `+91${formData.mobile}`
      setFormattedPhone(phoneNumber)

      // FIRST: Try to check if client already exists
      console.log("Checking if client exists for mobile:", formData.mobile)
      const clientCheckResponse = await clientAPI.checkExistingClient(formData.mobile)
      console.log("Client check response:", clientCheckResponse)

      if (clientCheckResponse.success && clientCheckResponse.exists) {
        // Client exists - store the info
        setExistingClient({
          exists: true,
          clientId: clientCheckResponse.clientId,
          clientName: clientCheckResponse.clientName,
        })

        console.log("Existing client found:", {
          clientId: clientCheckResponse.clientId,
          clientName: clientCheckResponse.clientName,
        })

        toast({
          title: "Existing Client Found",
          description: `Welcome back, ${clientCheckResponse.clientName}!`,
        })
      } else {
        // New client OR check failed - we'll determine this later
        setExistingClient({
          exists: false,
        })

        console.log("Treating as new client - will verify during registration")

        toast({
          title: "Proceeding with Verification",
          description: "We'll verify your account status after OTP confirmation",
        })
      }

      // Send OTP regardless of client existence
      const otpResponse = await clientAPI.sendOTP(formData.mobile)

      if (otpResponse.success) {
        toast({
          title: "OTP Sent",
          description: "A verification code has been sent to your mobile number",
        })
        // Move to OTP verification step
        setStep("otp")
      } else {
        throw new Error(otpResponse.message || "Failed to send OTP")
      }
    } catch (error: any) {
      console.error("Error in initial submit:", error)
      const errorResponse = error instanceof Error ? error.message : "Failed to process request"
      setApiError(errorResponse)
      toast({
        title: "Error",
        description: errorResponse,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Verify OTP - HANDLE EXISTING CLIENT DIFFERENTLY
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setApiError("")

    // Validate OTP
    const otpValue = otp.join("")
    if (otpValue.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter a valid 6-digit OTP",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    try {
      console.log("Verifying OTP for:", formattedPhone)
      console.log("Existing client state:", existingClient)

      // Call the OTP verify API
      const response = await clientAPI.verifyOTP(formattedPhone, otpValue)

      if (response.success) {
        toast({
          title: "OTP Verified",
          description: "Your phone number has been verified successfully",
        })

        // Check if this is an existing client based on our earlier check
        if (existingClient?.exists && existingClient.clientId) {
          console.log("Processing existing client:", existingClient)

          // EXISTING CLIENT - Get impersonation token and redirect to dashboard
          const agentToken = localStorage.getItem("agentToken")

          if (!agentToken) {
            toast({
              title: "Authentication Error",
              description: "Agent token not found. Please log in again.",
              variant: "destructive",
            })
            router.push("/agent-login")
            return
          }

          try {
            // Get impersonation token for existing client
            const impersonateResponse = await clientAPI.agentImpersonateClient(existingClient.clientId, agentToken)

            if (impersonateResponse.success) {
              // Store impersonation token
              localStorage.setItem("clientImpersonationToken", impersonateResponse.impersonationToken)
              localStorage.setItem("clientId", existingClient.clientId)

              toast({
                title: "Access Granted",
                description: `You now have access to ${existingClient.clientName}'s dashboard`,
              })

              // Redirect to client dashboard
              setTimeout(() => {
                router.push(`/client-dashboard/${existingClient.clientId}`)
              }, 1500)
            } else {
              throw new Error("Failed to get impersonation token")
            }
          } catch (impersonateError) {
            console.error("Error getting impersonation token:", impersonateError)
            toast({
              title: "Error",
              description: "Failed to access client dashboard. Please try again.",
              variant: "destructive",
            })
          }
        } else {
          console.log("Processing new client - proceeding to details step")
          // NEW CLIENT - Proceed to details step for registration
          setStep("details")
        }
      } else {
        throw new Error(response.message || "Failed to verify OTP")
      }
    } catch (error: any) {
      console.error("Error verifying OTP:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to verify OTP"
      setApiError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage || "Invalid OTP. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Submit client details form (only for NEW clients)
  const handleSubmitDetails = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Double-check that this is actually a new client
      if (existingClient?.exists) {
        toast({
          title: "Error",
          description: "This client already exists. Please use the client access flow instead.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Check if agent is authenticated
      if (!isAgentAuthenticated()) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in as an agent to create clients",
          variant: "destructive",
        })
        router.push("/agent-login")
        return
      }

      // Get the agent token directly from localStorage
      const token = localStorage.getItem("agentToken")

      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Agent token not found. Please log in again.",
          variant: "destructive",
        })
        router.push("/agent-login")
        return
      }

      console.log("Creating new client with data:", {
        name: formData.name,
        mobile: formData.mobile,
        email: formData.email,
      })

      // Create new client
      const response = await clientAPI.registerClient(
        {
          name: formData.name,
          mobile: formData.mobile,
          email: formData.email || undefined,
          city: formData.city || undefined,
          profession: formData.profession || undefined,
          businessName: formData.businessName || undefined,
          gstNumber: formData.gstNumber || undefined,
          projectType: formData.projectType || undefined,
          dateOfBirth: formData.dateOfBirth || undefined,
          anniversaryDate: formData.anniversaryDate || undefined,
          architectDetails: formData.architectDetails || undefined,
          consultantLevel: formData.consultantLevel || undefined,
        },
        token,
      )

      if (response.success) {
        // Get the client ID from the response
        const clientId = response.data?.client?.clientId

        if (!clientId) {
          throw new Error("Client ID not found in response")
        }

        toast({
          title: "Success",
          description: "Client registered successfully!",
        })

        // Generate impersonation token for the new client
        try {
          const impersonateResponse = await clientAPI.agentImpersonateClient(clientId, token)

          if (impersonateResponse.success) {
            // Store the impersonation token
            localStorage.setItem("clientImpersonationToken", impersonateResponse.impersonationToken)
            localStorage.setItem("clientId", clientId)

            // Redirect to client dashboard
            router.push(`/client-dashboard/${clientId}`)
          } else {
            throw new Error("Invalid impersonation token response")
          }
        } catch (impersonateError) {
          console.error("Error generating impersonation token:", impersonateError)
          // If impersonation fails, still redirect to client dashboard
          router.push(`/client-dashboard/${clientId}`)
        }
      } else {
        throw new Error(response.message || "Failed to register client")
      }
    } catch (error: any) {
      console.error("Error creating client:", error)
      const errorMessage = error instanceof Error ? error.message : "An error occurred while creating the client"

      // Check if it's a duplicate client error
      if (
        errorMessage.toLowerCase().includes("phone number already exists") ||
        errorMessage.toLowerCase().includes("client already exists") ||
        errorMessage.toLowerCase().includes("already exists")
      ) {
        toast({
          title: "Client Already Exists",
          description: "This phone number is already registered. Let me redirect you to access the existing account.",
          variant: "destructive",
        })

        // Set as existing client and redirect to OTP for access
        setExistingClient({
          exists: true,
          clientId: undefined, // We don't have the ID, but we know it exists
          clientName: formData.name, // Use the name they provided
        })

        // Go back to OTP step for existing client access
        setStep("otp")

        // Send new OTP for existing client access
        try {
          await clientAPI.sendOTP(formData.mobile)
          toast({
            title: "OTP Sent",
            description: "Please verify your identity to access your existing account",
          })
        } catch (otpError) {
          console.error("Error sending OTP for existing client:", otpError)
        }
      } else {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Resend OTP function
  const handleResendOTP = async () => {
    try {
      setIsSubmitting(true)
      const response = await clientAPI.sendOTP(formData.mobile)

      if (response.success) {
        toast({
          title: "OTP Resent",
          description: "A new verification code has been sent to your mobile number",
        })
      } else {
        throw new Error(response.message || "Failed to resend OTP")
      }
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : "Failed to resend OTP"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-xl">
        <div className="mb-4">
          <button onClick={() => router.push("/dashboard")} className="p-2 rounded-full hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </button>
        </div>

        {step === "initial" && (
          <Card className="shadow-sm border">
            <CardHeader className="space-y-1 border-b pb-4">
              <CardTitle className="text-2xl text-center text-[#194a95]">Client Access</CardTitle>
              <CardDescription className="text-center">
                Enter client information to access existing account or create new one
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6">
              <form onSubmit={handleSubmitInitial} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-base font-medium">
                    Client Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="name"
                      name="name"
                      placeholder="Enter client name"
                      value={formData.name}
                      onChange={handleChange}
                      className="h-12 pl-10 rounded-md"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobile" className="text-base font-medium">
                    Mobile Number
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="mobile"
                      name="mobile"
                      placeholder="Enter mobile number"
                      value={formData.mobile}
                      onChange={handleChange}
                      className="h-12 pl-10 rounded-md"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 mt-6 bg-[#194a95] hover:bg-[#0d3a7d] text-white rounded-md text-base"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking & Sending OTP...
                    </>
                  ) : (
                    "Check Client & Send OTP"
                  )}
                </Button>
                {apiError && <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">{apiError}</div>}
              </form>
            </CardContent>
          </Card>
        )}

        {step === "otp" && (
          <Card className="shadow-sm border">
            <CardHeader className="space-y-1 border-b pb-4">
              <CardTitle className="text-2xl text-center text-[#194a95]">Verify OTP</CardTitle>
              <CardDescription className="text-center">
                {existingClient?.exists ? (
                  <div className="space-y-2">
                    <div className="p-3 bg-green-50 rounded-md border border-green-200">
                      <span className="text-green-700 font-medium">
                        ✅ Existing Client: {existingClient.clientName}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">Enter OTP to access dashboard</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                      <span className="text-blue-700 font-medium">📱 Account Verification</span>
                    </div>
                    <p className="text-sm text-gray-600">Enter OTP to continue</p>
                  </div>
                )}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6">
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div className="text-center mb-6">
                  <p className="text-muted-foreground">
                    We&apos;ve sent a 6-digit OTP to{" "}
                    <span className="font-medium text-foreground">+91{formData.mobile}</span>
                  </p>
                </div>

                <div className="flex justify-center gap-2">
                  {otp.map((digit, index) => (
                    <Input
                      key={index}
                      ref={(el) => {
                        otpInputs.current[index] = el
                      }}
                      className="h-14 w-12 text-center text-xl font-bold rounded-md"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      maxLength={6} // Allow pasting multiple digits
                      inputMode="numeric"
                      pattern="[0-9]*"
                      required
                    />
                  ))}
                </div>

                <div className="text-center mt-4">
                  <p className="text-sm text-muted-foreground">
                    Didn&apos;t receive OTP?{" "}
                    <Button
                      variant="link"
                      className="p-0 h-auto text-[#194a95]"
                      onClick={handleResendOTP}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Sending..." : "Resend"}
                    </Button>
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 mt-6 bg-[#194a95] hover:bg-[#0d3a7d] text-white rounded-md text-base"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : existingClient?.exists ? (
                    "Verify & Access Dashboard"
                  ) : (
                    "Verify & Continue Registration"
                  )}
                </Button>
                {apiError && <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">{apiError}</div>}
              </form>
            </CardContent>

            <CardFooter className="flex justify-center">
              <Button variant="link" onClick={() => setStep("initial")} className="text-[#194a95]">
                Back to details
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === "details" && (
          <Card className="shadow-sm border">
            <CardHeader className="space-y-1 border-b pb-4">
              <CardTitle className="text-2xl text-center text-[#194a95]">New Client Registration</CardTitle>
              <CardDescription className="text-center">Complete client registration with all details</CardDescription>
            </CardHeader>

            <CardContent className="pt-6">
              <form onSubmit={handleSubmitDetails} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="profession" className="text-base font-medium">
                    Profession
                  </Label>
                  <Tabs defaultValue="architect" onValueChange={(value) => handleSelectChange("profession", value)}>
                    <TabsList className="grid grid-cols-5 w-full">
                      <TabsTrigger value="architect">Architect</TabsTrigger>
                      <TabsTrigger value="contractor">Contractor</TabsTrigger>
                      <TabsTrigger value="builder">Builder</TabsTrigger>
                      <TabsTrigger value="self_use">Self Use</TabsTrigger>
                      <TabsTrigger value="other">Other</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {/* Business Name and GST Number in one row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessName" className="text-base font-medium">
                      Business Name
                    </Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="businessName"
                        name="businessName"
                        placeholder="Enter business name"
                        value={formData.businessName}
                        onChange={handleChange}
                        className="h-12 pl-10 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gstNumber" className="text-base font-medium">
                      GST Number
                    </Label>
                    <Input
                      id="gstNumber"
                      name="gstNumber"
                      placeholder="Enter GST number"
                      value={formData.gstNumber}
                      onChange={handleChange}
                      className="h-12 rounded-md"
                    />
                  </div>
                </div>

                {/* Project Type and Email in one row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="projectType" className="text-base font-medium">
                      Project Type
                    </Label>
                    <Select
                      value={formData.projectType}
                      onValueChange={(value) => handleSelectChange("projectType", value)}
                    >
                      <SelectTrigger className="h-12 rounded-md">
                        <SelectValue placeholder="Select project type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="residential">Residential</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="industrial">Industrial</SelectItem>
                        <SelectItem value="infrastructure">Infrastructure</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-base font-medium">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Enter email address"
                        value={formData.email}
                        onChange={handleChange}
                        className="h-12 pl-10 rounded-md"
                      />
                    </div>
                  </div>
                </div>

                {/* City and Architect Details in one row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-base font-medium">
                      City
                    </Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="city"
                        name="city"
                        placeholder="Enter city"
                        value={formData.city}
                        onChange={handleChange}
                        className="h-12 pl-10 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="architectDetails" className="text-base font-medium">
                      Architect Details
                    </Label>
                    <Input
                      id="architectDetails"
                      name="architectDetails"
                      placeholder="Enter architect details"
                      value={formData.architectDetails}
                      onChange={handleChange}
                      className="h-12 rounded-md"
                    />
                  </div>
                </div>

                {/* Date of Birth and Anniversary Date in one row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth" className="text-base font-medium">
                      Date of Birth
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="dateOfBirth"
                        name="dateOfBirth"
                        type="date"
                        placeholder="Select date of birth"
                        value={formData.dateOfBirth}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            dateOfBirth: e.target.value,
                          }))
                        }
                        className="h-12 pl-10 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="anniversaryDate" className="text-base font-medium">
                      Anniversary Date
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="anniversaryDate"
                        name="anniversaryDate"
                        type="date"
                        placeholder="Select anniversary date"
                        value={formData.anniversaryDate}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            anniversaryDate: e.target.value,
                          }))
                        }
                        className="h-12 pl-10 rounded-md"
                      />
                    </div>
                  </div>
                </div>

                {/* Consultant Level with colored dots */}
                <div className="space-y-2 mt-4">
                  <Label htmlFor="consultantLevel" className="text-base font-medium">
                    Consultant Level
                  </Label>
                  <div className="flex items-center gap-6 mt-2">
                    <button
                      type="button"
                      onClick={() => handleSelectChange("consultantLevel", "red")}
                      className={`w-8 h-8 rounded-full bg-red-500 transition-all ${
                        formData.consultantLevel === "red" ? "ring-4 ring-red-200 scale-110" : "hover:scale-105"
                      }`}
                      aria-label="Red consultant level (+5%)"
                    />
                    <button
                      type="button"
                      onClick={() => handleSelectChange("consultantLevel", "yellow")}
                      className={`w-8 h-8 rounded-full bg-yellow-500 transition-all ${
                        formData.consultantLevel === "yellow" ? "ring-4 ring-yellow-200 scale-110" : "hover:scale-105"
                      }`}
                      aria-label="Yellow consultant level (+10%)"
                    />
                    <button
                      type="button"
                      onClick={() => handleSelectChange("consultantLevel", "purple")}
                      className={`w-8 h-8 rounded-full bg-purple-600 transition-all ${
                        formData.consultantLevel === "purple" ? "ring-4 ring-purple-200 scale-110" : "hover:scale-105"
                      }`}
                      aria-label="Purple consultant level (+15%)"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 mt-4">
                  <Checkbox id="terms" checked={formData.agreeToTerms} onCheckedChange={handleCheckboxChange} />
                  <label
                    htmlFor="terms"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I agree to the terms and conditions
                  </label>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 mt-6 bg-[#194a95] hover:bg-[#0d3a7d] text-white rounded-md text-base"
                  disabled={!formData.agreeToTerms || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Client...
                    </>
                  ) : (
                    "Complete Registration"
                  )}
                </Button>
              </form>
            </CardContent>

            {!isVerified && (
              <CardFooter className="flex justify-center">
                <Button variant="link" onClick={() => setStep("otp")} className="text-[#194a95]">
                  Back to OTP verification
                </Button>
              </CardFooter>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}
