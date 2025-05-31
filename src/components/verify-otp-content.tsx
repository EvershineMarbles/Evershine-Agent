"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, CheckCircle, Clock, RefreshCw } from "lucide-react"
import { clientAPI } from "@/lib/client-api"
import { storeClientImpersonationToken } from "@/lib/auth-utils"

export default function VerifyOTPContent() {
  const [otp, setOtp] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [countdown, setCountdown] = useState(0)
  const [canResend, setCanResend] = useState(false)

  const searchParams = useSearchParams()
  const router = useRouter()

  const mobile = searchParams.get("mobile") || ""
  const clientExists = searchParams.get("exists") === "true"
  const clientName = searchParams.get("clientName") || ""
  const clientId = searchParams.get("clientId") || ""
  const source = searchParams.get("source") || "register"

  useEffect(() => {
    // Start countdown for resend OTP
    setCountdown(30)
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true)
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleOTPChange = (value: string) => {
    // Only allow numbers and limit to 6 digits
    const numericValue = value.replace(/\D/g, "").slice(0, 6)
    setOtp(numericValue)
    setError("")
  }

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP")
      return
    }

    setIsVerifying(true)
    setError("")

    try {
      const formattedPhone = mobile.startsWith("+") ? mobile : `+91${mobile}`
      const result = await clientAPI.verifyOTP(formattedPhone, otp)

      if (result.success) {
        setSuccess("OTP verified successfully!")

        if (clientExists && clientId) {
          // For existing client - get impersonation token
          const agentToken = localStorage.getItem("agentToken")
          if (agentToken) {
            const impersonationResult = await clientAPI.agentImpersonateClient(clientId, agentToken)

            if (impersonationResult.success) {
              // Store impersonation token
              storeClientImpersonationToken(impersonationResult.impersonationToken, clientId)

              // Redirect to client dashboard
              setTimeout(() => {
                router.push(`/client-dashboard/${clientId}`)
              }, 1500)
            } else {
              setError("Failed to access client dashboard. Please try again.")
            }
          } else {
            setError("Agent authentication required. Please login again.")
          }
        } else {
          // For new client - redirect to registration
          setTimeout(() => {
            router.push(`/register-client?mobile=${encodeURIComponent(mobile)}&verified=true`)
          }, 1500)
        }
      } else {
        setError(result.message || "Invalid OTP. Please try again.")
      }
    } catch (error) {
      console.error("OTP verification error:", error)
      setError("Failed to verify OTP. Please try again.")
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResendOTP = async () => {
    setCanResend(false)
    setCountdown(30)
    setError("")
    setOtp("")

    try {
      const result = await clientAPI.sendOTP(mobile)
      if (result.success) {
        setSuccess("OTP sent successfully!")
        setTimeout(() => setSuccess(""), 3000)
      } else {
        setError(result.message || "Failed to send OTP")
      }
    } catch (error) {
      console.error("Resend OTP error:", error)
      setError("Failed to send OTP. Please try again.")
    }

    // Restart countdown
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true)
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleBack = () => {
    if (source === "lookup") {
      router.push("/client-lookup")
    } else {
      router.push("/register-client")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex-1" />
            </div>

            <CardTitle className="text-2xl font-bold text-gray-900">Verify OTP</CardTitle>

            <CardDescription className="text-gray-600">
              {clientExists ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-700">Client Found: {clientName}</span>
                  </div>
                  <p>Enter the OTP sent to +91{mobile} to access the dashboard</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="font-medium text-blue-700">New Client Registration</p>
                  <p>Enter the OTP sent to +91{mobile} to continue registration</p>
                </div>
              )}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">{success}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                  Enter 6-digit OTP
                </label>
                <Input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => handleOTPChange(e.target.value)}
                  placeholder="000000"
                  className="text-center text-2xl font-mono tracking-widest"
                  maxLength={6}
                  disabled={isVerifying}
                />
              </div>

              <Button
                onClick={handleVerifyOTP}
                disabled={otp.length !== 6 || isVerifying}
                className="w-full bg-[#194a95] hover:bg-[#153d7a]"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify OTP"
                )}
              </Button>

              <div className="text-center">
                {canResend ? (
                  <Button variant="link" onClick={handleResendOTP} className="text-[#194a95]">
                    Resend OTP
                  </Button>
                ) : (
                  <div className="flex items-center justify-center space-x-2 text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span>Resend OTP in {countdown}s</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
