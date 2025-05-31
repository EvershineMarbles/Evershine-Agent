"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, ArrowLeft } from "lucide-react"
import { clientAPI } from "@/lib/client-api"
import Image from "next/image"

export default function VerifyOTPPage() {
  const [otp, setOtp] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [countdown, setCountdown] = useState(30)
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()

  const mobile = searchParams.get("mobile")
  const type = searchParams.get("type") // 'existing' or 'new'
  const clientId = searchParams.get("clientId")
  const clientName = searchParams.get("clientName")

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const verifyOTP = async () => {
    if (!otp.trim() || otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a valid 6-digit OTP",
        variant: "destructive",
      })
      return
    }

    if (!mobile) {
      toast({
        title: "Error",
        description: "Mobile number is missing",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const formattedPhone = mobile.startsWith("+") ? mobile : `+91${mobile}`
      const response = await clientAPI.verifyOTP(formattedPhone, otp)

      if (response.success) {
        if (type === "existing" && clientId && clientName) {
          // Get agent token from localStorage
          const agentToken = localStorage.getItem("agentToken")

          if (!agentToken) {
            toast({
              title: "Error",
              description: "Agent not authenticated. Please login again.",
              variant: "destructive",
            })
            router.push("/agent-login")
            return
          }

          // Get impersonation token for this client
          const impersonationResponse = await clientAPI.agentImpersonateClient(clientId, agentToken)

          if (impersonationResponse.success) {
            // Store impersonation token
            localStorage.setItem("clientImpersonationToken", impersonationResponse.impersonationToken)
            localStorage.setItem("clientId", clientId)

            // Redirect to client dashboard
            router.push(`/client-dashboard/${clientId}`)

            toast({
              title: "Access Granted",
              description: `Successfully accessing ${clientName}'s dashboard`,
            })
          } else {
            toast({
              title: "Access Denied",
              description: impersonationResponse.message || "Failed to access client dashboard",
              variant: "destructive",
            })
          }
        } else {
          // Handle new client registration flow
          router.push(`/register-client?mobile=${mobile}&verified=true`)

          toast({
            title: "Phone Verified",
            description: "Please complete your registration",
          })
        }
      } else {
        toast({
          title: "Invalid OTP",
          description: response.message || "Please check your OTP and try again",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error verifying OTP:", error)
      toast({
        title: "Error",
        description: "Failed to verify OTP. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resendOTP = async () => {
    if (!mobile) return

    setResendLoading(true)
    try {
      const response = await clientAPI.sendOTP(mobile)

      if (response.success) {
        setCountdown(30)
        toast({
          title: "OTP Sent",
          description: "A new OTP has been sent to your mobile number",
        })
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to resend OTP",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error resending OTP:", error)
      toast({
        title: "Error",
        description: "Failed to resend OTP. Please try again.",
        variant: "destructive",
      })
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      {/* Logo */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2">
        <Image src="/logo.png" alt="Evershine Logo" width={180} height={60} className="h-12 w-auto" />
      </div>

      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-[#194a95]">Verify OTP</CardTitle>
          <CardDescription>
            Enter the 6-digit code sent to +91{mobile}
            {type === "existing" && clientName && (
              <div className="mt-2 p-2 bg-green-50 rounded-md">
                <span className="text-green-700 font-medium">Accessing: {clientName}</span>
              </div>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="otp">OTP Code</Label>
            <Input
              id="otp"
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              maxLength={6}
              className="text-center text-lg tracking-widest"
            />
          </div>

          <Button
            onClick={verifyOTP}
            className="w-full bg-[#194a95] hover:bg-[#0d3a7d]"
            disabled={isLoading || otp.length !== 6}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : type === "existing" ? (
              "Access Dashboard"
            ) : (
              "Verify & Continue"
            )}
          </Button>

          <div className="text-center space-y-2">
            {countdown > 0 ? (
              <p className="text-sm text-gray-600">Resend OTP in {countdown} seconds</p>
            ) : (
              <Button variant="link" onClick={resendOTP} disabled={resendLoading} className="text-[#194a95]">
                {resendLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Resend OTP"
                )}
              </Button>
            )}
          </div>

          <Button variant="outline" onClick={() => router.back()} className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
