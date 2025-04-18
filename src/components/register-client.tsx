"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Phone, User, Mail, MapPin, Building, Calendar, Loader2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { isAgentAuthenticated } from "@/lib/auth-utils"
import axios from "axios"

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
    agreeToTerms: false,
  })
  const [isLoading, setIsLoading] = useState(false)

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

  // Add these new state variables
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiError, setApiError] = useState("")
  const [formattedPhone, setFormattedPhone] = useState("")

  // Update the handleSubmitInitial function to call the OTP send API
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
      const phoneNumber = formData.mobile.startsWith("+") ? formData.mobile : `+91${formData.mobile}` // Assuming India country code, adjust as needed

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
    } catch (error: Error | unknown) {
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

  // Update the handleVerifyOTP function to call the OTP verify API
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
      // Call the OTP verify API
      const response = await axios.post("https://evershinebackend-2.onrender.com/api/otp/verify", {
        phoneNumber: formattedPhone,
        otp: otpValue,
      })

      if (response.data.success) {
        toast({
          title: "OTP Verified",
          description: "Your phone number has been verified successfully",
        })

        // Check if user is new or existing
        if (response.data.data.isNewUser) {
          // New user, proceed to details step
          setStep("details")
        } else {
          // Existing user, store token and redirect to dashboard
          localStorage.setItem("clientToken", response.data.data.token)
          localStorage.setItem("clientId", response.data.data.clientId)

          toast({
            title: "Welcome Back",
            description: "You have been logged in successfully",
          })

          // Redirect to client dashboard
          setTimeout(() => {
            router.push(`/client-dashboard/${response.data.data.clientId}`)
          }, 1500)
        }
      } else {
        throw new Error(response.data.message || "Failed to verify OTP")
      }
    } catch (error: Error | unknown) {
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

  // Updated handleSubmitDetails function
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
        }),
      })

      // Check if the response is ok
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("Create client response:", data)

      toast({
        title: "Success",
        description: "Client registered successfully!",
      })

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (error: Error | unknown) {
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
    <div className="flex min-h-screen flex-col items-center justify-center p-6 md:p-12 bg-gray-50">
      <div className="w-full max-w-xl">
        <div className="w-full flex flex-col items-center relative mb-8">
          <Link href="/dashboard" className="absolute left-0 top-0 inline-flex items-center text-dark hover:underline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
          {/* Fixed image aspect ratio by setting both width and height with auto property */}
          <Image
            src="/logo.png"
            alt="Evershine Logo"
            width={180}
            height={90}
            style={{ height: "auto" }}
            priority
            className="mt-8"
          />
        </div>

        {step === "initial" && (
          <Card className="shadow-lg border-0">
            <CardHeader className="space-y-1 bg-blue/5 border-b pb-4">
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
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending OTP...
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
          <Card className="shadow-lg border-0">
            <CardHeader className="space-y-1 bg-blue/5 border-b pb-4">
              <CardTitle className="text-2xl text-center text-blue">Verify OTP</CardTitle>
              <CardDescription className="text-center">Enter the OTP sent to your mobile number</CardDescription>
            </CardHeader>

            <CardContent className="pt-6">
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
                        } catch (error: Error | unknown) {
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
          <Card className="shadow-lg border-0">
            <CardHeader className="space-y-1 bg-blue/5 border-b pb-4">
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
                    <TabsList className="grid grid-cols-4 w-full">
                      <TabsTrigger value="architect">Architect</TabsTrigger>
                      <TabsTrigger value="contractor">Contractor</TabsTrigger>
                      <TabsTrigger value="builder">Builder</TabsTrigger>
                      <TabsTrigger value="other">Other</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

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
                  {isLoading ? "Creating Client..." : "Complete Registration"}
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
