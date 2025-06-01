"use client"

import type React from "react"
import { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Phone, User, Mail, MapPin, Building, Calendar, Loader2, AlertCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { isAgentAuthenticated } from "@/lib/auth-utils"
import axios from "axios"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function RegisterClient() {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState<"initial" | "otp" | "details">("initial")
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiError, setApiError] = useState("")
  const [formattedPhone, setFormattedPhone] = useState("")

  // New state variables for client existence check
  const [clientExists, setClientExists] = useState(false)
  const [existingClientData, setExistingClientData] = useState<any>(null)
  const [checkingClient, setCheckingClient] = useState(false)

  // OTP state and refs
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const otpInputs = useRef<(HTMLInputElement | null)[]>([null, null, null, null, null, null])

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

  // New function to check if client exists
  const checkClientExists = useCallback(async (phoneNumber: string) => {
    try {
      setCheckingClient(true)
      setApiError("")

      // Format phone number to E.164 format if it doesn't already start with +
      const formattedNumber = phoneNumber.startsWith("+") ? phoneNumber : `+91${phoneNumber}`

      const response = await axios.post("https://evershinebackend-2.onrender.com/api/client/check-exists", {
        phoneNumber: formattedNumber,
      })

      if (response.data.success) {
        return response.data.data
      } else {
        throw new Error(response.data.message || "Failed to check client existence")
      }
    } catch (error: any) {
      console.error("Error checking client existence:", error)
      return { exists: false }
    } finally {
      setCheckingClient(false)
    }
  }, [])

  // Update the handleSubmitInitial function to check client existence before sending OTP
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
      // Format phone number to E.164 format if it doesn't already start with +
      const phoneNumber = formData.mobile.startsWith("+") ? formData.mobile : `+91${formData.mobile}`

      // First check if client exists
      const clientCheckResult = await checkClientExists(formData.mobile)
      setClientExists(clientCheckResult.exists || false)
      setExistingClientData(clientCheckResult)

      if (clientCheckResult.exists) {
        toast({
          title: "Client Found",
          description: `Found existing client: ${clientCheckResult.clientName}`,
        })
      }

      // Call the OTP send API
      const response = await axios.post("https://evershinebackend-2.onrender.com/api/otp/send", {
        phoneNumber,
      })

      if (response.data.success) {
        toast({
          title: "OTP Sent",
          description: "A verification code has been sent to your mobile number",
        })
        // Store the formatted phone number for verification
        setFormattedPhone(phoneNumber)
        // Move to OTP verification step
        setStep("otp")
      } else {
        throw new Error(response.data.message || "Failed to send OTP")
      }
    } catch (error: any) {
      console.error("Error sending OTP:", error)
      const errorResponse = error instanceof Error ? error.message : "Failed to send OTP"
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

  // Update the handleVerifyOTP function to handle existing clients
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
      console.log("🔍 STARTING OTP VERIFICATION")
      console.log("📱 Phone Number:", formattedPhone)
      console.log("🔢 OTP Value:", otpValue)

      // Call the OTP verify API
      const response = await axios.post("https://evershinebackend-2.onrender.com/api/otp/verify", {
        phoneNumber: formattedPhone,
        otp: otpValue,
      })

      console.log("🌐 FULL API RESPONSE:", response)
      console.log("📦 Response Data:", response.data)
      console.log("✅ Response Success:", response.data.success)

      if (response.data && response.data.data) {
        console.log("📋 Response Data Object:", response.data.data)
        console.log("🆔 isNewUser Field:", response.data.data.isNewUser)
        console.log("🔍 isNewUser Type:", typeof response.data.data.isNewUser)
        console.log("🎯 isNewUser === false:", response.data.data.isNewUser === false)
        console.log("🎯 isNewUser === true:", response.data.data.isNewUser === true)
        console.log("🎯 isNewUser == false:", response.data.data.isNewUser == false)
        console.log("🎯 !isNewUser:", !response.data.data.isNewUser)
      }

      if (response.data.success) {
        toast({
          title: "OTP Verified",
          description: "Your phone number has been verified successfully",
        })

        // Check if user is new or existing based on the enhanced OTP response
        const isNewUser = response.data.data.isNewUser
        console.log("🔄 CHECKING USER TYPE...")
        console.log("📊 isNewUser variable:", isNewUser)
        console.log("📊 isNewUser type:", typeof isNewUser)

        if (isNewUser === false) {
          console.log("🎉 EXISTING CLIENT DETECTED!")
          console.log("👤 Client ID:", response.data.data.clientId)
          console.log("👤 Client Name:", response.data.data.clientName)
          console.log("🔑 Token:", response.data.data.token)

          // Existing user, store token and redirect to dashboard
          localStorage.setItem("clientToken", response.data.data.token)
          localStorage.setItem("clientId", response.data.data.clientId)

          toast({
            title: "Welcome Back",
            description: `Redirecting to ${response.data.data.clientName}'s dashboard`,
          })

          // Generate impersonation token for the existing client
          try {
            const token = localStorage.getItem("agentToken")
            console.log("🔐 Agent Token:", token ? "Found" : "Not Found")

            if (!token) {
              throw new Error("Agent token not found")
            }

            console.log("🔄 Generating impersonation token...")
            const impersonateResponse = await fetch(
              `https://evershinebackend-2.onrender.com/api/agent/impersonate/${response.data.data.clientId}`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              },
            )

            console.log("🌐 Impersonation Response Status:", impersonateResponse.status)

            if (!impersonateResponse.ok) {
              throw new Error("Failed to generate impersonation token")
            }

            const impersonateData = await impersonateResponse.json()
            console.log("🔑 Impersonation Data:", impersonateData)

            if (impersonateData.success && impersonateData.data?.impersonationToken) {
              // Store the impersonation token
              localStorage.setItem("clientImpersonationToken", impersonateData.data.impersonationToken)
              console.log("✅ Impersonation token stored successfully")

              // Redirect to client dashboard immediately
              console.log("🚀 REDIRECTING TO DASHBOARD:", `/client-dashboard/${response.data.data.clientId}`)
              router.push(`/client-dashboard/${response.data.data.clientId}`)
              return // Important: return here to prevent further execution
            } else {
              throw new Error("Invalid impersonation token response")
            }
          } catch (impersonateError) {
            console.error("❌ Error generating impersonation token:", impersonateError)
            // If impersonation fails, still try to redirect to client dashboard
            console.log("🚀 FALLBACK REDIRECT TO DASHBOARD:", `/client-dashboard/${response.data.data.clientId}`)
            router.push(`/client-dashboard/${response.data.data.clientId}`)
            return // Important: return here to prevent further execution
          }
        } else if (isNewUser === true) {
          console.log("🆕 NEW CLIENT DETECTED - SHOWING REGISTRATION FORM")
          // New user, proceed to details step
          setStep("details")
        } else {
          console.log("⚠️ UNEXPECTED isNewUser VALUE:", isNewUser)
          console.log("⚠️ Defaulting to registration form")
          // Fallback to registration form
          setStep("details")
        }
      } else {
        console.log("❌ API Response not successful:", response.data)
        throw new Error(response.data.message || "Failed to verify OTP")
      }
    } catch (error: any) {
      console.error("❌ ERROR in OTP verification:", error)
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

  // The rest of the component remains the same
  const handleSubmitDetails = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
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

      // Make the API request with fetch instead of axios
      const response = await fetch("https://evershinebackend-2.onrender.com/api/create-client", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
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
          consultantLevel: formData.consultantLevel || undefined, // This will now be "red", "yellow", or "purple"
        }),
      })

      // Check if the response is ok
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("Create client response:", data)

      // Get the client ID from the response
      const clientId = data.data?.client?.clientId

      if (!clientId) {
        throw new Error("Client ID not found in response")
      }

      toast({
        title: "Success",
        description: "Client registered successfully!",
      })

      // Generate impersonation token for the new client
      try {
        const impersonateResponse = await fetch(
          `https://evershinebackend-2.onrender.com/api/agent/impersonate/${clientId}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        )

        if (!impersonateResponse.ok) {
          throw new Error("Failed to generate impersonation token")
        }

        const impersonateData = await impersonateResponse.json()

        if (impersonateData.success && impersonateData.data?.impersonationToken) {
          // Store the impersonation token
          localStorage.setItem("clientImpersonationToken", impersonateData.data.impersonationToken)

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
    } catch (error: any) {
      console.error("Error creating client:", error)
      const errorMessage = error instanceof Error ? error.message : "An error occurred while creating the client"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="w-full max-w-xl">
        <div className="mb-4">
          <button onClick={() => router.push("/dashboard")} className="p-2 rounded-full hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </button>
        </div>

        {step === "initial" && (
          <Card className="shadow-sm border">
            <CardHeader className="space-y-1 border-b pb-4">
              <CardTitle className="text-2xl text-center text-blue">Register New Client</CardTitle>
              <CardDescription className="text-center">Enter basic client information</CardDescription>
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
                  className="w-full h-12 mt-6 bg-blue hover:bg-blue/90 text-white rounded-md text-base"
                  disabled={isSubmitting || checkingClient}
                >
                  {isSubmitting || checkingClient ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {checkingClient ? "Checking client..." : "Sending OTP..."}
                    </>
                  ) : (
                    "Send OTP"
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
              <CardTitle className="text-2xl text-center text-blue">Verify OTP</CardTitle>
              <CardDescription className="text-center">Enter the OTP sent to your mobile number</CardDescription>
            </CardHeader>

            <CardContent className="pt-6">
              {clientExists && existingClientData && (
                <Alert className="mb-4 bg-blue-50 border-blue-200">
                  <AlertCircle className="h-4 w-4 text-blue-500" />
                  <AlertDescription className="text-blue-700">
                    Existing client found: <span className="font-semibold">{existingClientData.clientName}</span>
                    <br />
                    After verification, you'll be redirected to their dashboard.
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div className="text-center mb-6">
                  <p className="text-muted-foreground">
                    We&apos;ve sent a 6-digit OTP to{" "}
                    <span className="font-medium text-foreground">{formData.mobile}</span>
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
                      className="p-0 h-auto text-blue"
                      onClick={async () => {
                        try {
                          setIsSubmitting(true)
                          const response = await axios.post("https://evershinebackend-2.onrender.com/api/otp/send", {
                            phoneNumber: formattedPhone,
                          })

                          if (response.data.success) {
                            toast({
                              title: "OTP Resent",
                              description: "A new verification code has been sent to your mobile number",
                            })
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
                      }}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Sending..." : "Resend"}
                    </Button>
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 mt-6 bg-blue hover:bg-blue/90 text-white rounded-md text-base"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify OTP"
                  )}
                </Button>
                {apiError && <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">{apiError}</div>}
              </form>
            </CardContent>

            <CardFooter className="flex justify-center">
              <Button variant="link" onClick={() => setStep("initial")} className="text-blue">
                Back to details
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === "details" && (
          <Card className="shadow-sm border">
            <CardHeader className="space-y-1 border-b pb-4">
              <CardTitle className="text-2xl text-center text-blue">Client Details</CardTitle>
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
                      className="h-12 pl-10 rounded-md"
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
                    Consultant
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
                  className="w-full h-12 mt-6 bg-blue hover:bg-blue/90 text-white rounded-md text-base"
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

            <CardFooter className="flex justify-center">
              <Button variant="link" onClick={() => setStep("otp")} className="text-blue">
                Back to OTP verification
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  )
}
