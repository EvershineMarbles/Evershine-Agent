"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Phone, User, Mail, MapPin, Building, Calendar } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"

export default function RegisterClient() {
  const router = useRouter()
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

  // Simplified OTP state - use a single string instead of array
  const [otpValue, setOtpValue] = useState("")
  const otpInputs = useRef<(HTMLInputElement | null)[]>([])

  // Initialize refs array
  useEffect(() => {
    otpInputs.current = otpInputs.current.slice(0, 6)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Simplified OTP handling
  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value

    // Only allow numbers
    if (!/^\d*$/.test(value)) return

    // Create a new OTP string
    const newOtpValue = otpValue.split("")

    // Handle pasting
    if (value.length > 1) {
      // If pasting, distribute the digits across fields
      const digits = value.split("").slice(0, 6 - index)
      const newValue = otpValue.split("")

      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newValue[index + i] = digit
        }
      })

      setOtpValue(newValue.join(""))

      // Focus the next empty field or the last field
      const nextIndex = Math.min(index + digits.length, 5)
      setTimeout(() => {
        otpInputs.current[nextIndex]?.focus()
      }, 0)
    } else {
      // For single digit input
      newOtpValue[index] = value.charAt(0) || ""
      setOtpValue(newOtpValue.join(""))

      // Auto-focus next input if a digit was entered
      if (value && index < 5) {
        setTimeout(() => {
          otpInputs.current[index + 1]?.focus()
        }, 0)
      }
    }
  }

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    // Handle backspace to go to previous field
    if (e.key === "Backspace" && !otpValue[index] && index > 0) {
      otpInputs.current[index - 1]?.focus()
    }
  }

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, agreeToTerms: checked }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setFormData((prev) => ({ ...prev, dateOfBirth: format(date, "yyyy-MM-dd") }))
    }
  }

  const handleSubmitInitial = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, you would send an API request to send OTP
    setStep("otp")
  }

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, you would verify the OTP with an API call
    setStep("details")
  }

  const handleSubmitDetails = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, you would submit all client details
    router.push(`/client-dashboard/${formData.name.toLowerCase().replace(/\s+/g, "-")}`)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 md:p-12 bg-gray-50">
      <div className="w-full max-w-xl">
        <div className="w-full flex flex-col items-center relative mb-8">
          <Link href="/" className="absolute left-0 top-0 inline-flex items-center text-dark hover:underline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
          <Image src="/logo.png" alt="Evershine Logo" width={180} height={100} priority className="mt-8" />
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
                >
                  Send OTP
                </Button>
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
                    We{"'"}ve sent a 6-digit OTP to{" "}
                    <span className="font-medium text-foreground">{formData.mobile}</span>
                  </p>
                </div>

                {/* Simplified OTP input rendering */}
                <div className="flex justify-center gap-2">
                  {Array(6)
                    .fill(0)
                    .map((_, index) => (
                      <Input
                        key={index}
                        ref={(el) => {
                          otpInputs.current[index] = el
                        }}
                        className="h-14 w-12 text-center text-xl font-bold rounded-md"
                        value={otpValue[index] || ""}
                        onChange={(e) => handleOtpChange(e, index)}
                        onKeyDown={(e) => handleOtpKeyDown(e, index)}
                        maxLength={index === 0 ? 6 : 1}
                        inputMode="numeric"
                        type="text"
                        pattern="[0-9]*"
                        required={index === 0}
                      />
                    ))}
                </div>

                <div className="text-center mt-4">
                  <p className="text-sm text-muted-foreground">
                    Didn{"'"}t receive OTP?{" "}
                    <Button variant="link" className="p-0 h-auto text-blue" type="button">
                      Resend
                    </Button>
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 mt-6 bg-blue hover:bg-blue/90 text-white rounded-md text-base"
                >
                  Verify OTP
                </Button>
              </form>
            </CardContent>

            <CardFooter className="flex justify-center">
              <Button variant="link" onClick={() => setStep("initial")} className="text-blue" type="button">
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
                      onChange={(e) => setFormData((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
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
                  disabled={!formData.agreeToTerms}
                >
                  Complete Registration
                </Button>
              </form>
            </CardContent>

            <CardFooter className="flex justify-center">
              <Button variant="link" onClick={() => setStep("otp")} className="text-blue" type="button">
                Back to OTP verification
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  )
}

