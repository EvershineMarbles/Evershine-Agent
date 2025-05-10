"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { extractProductId } from "@/lib/qr-utils"

export default function AgentScanQRPage() {
  const router = useRouter()
  const [scanning, setScanning] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const scannerRef = useRef<any>(null)

  // Initialize scanner as soon as component mounts
  useEffect(() => {
    initScanner()

    // Clean up on unmount
    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.stop().catch(() => {})
        } catch (error) {
          console.error("Error stopping scanner:", error)
        }
      }
    }
  }, [])

  const initScanner = async () => {
    setLoading(true)
    setError(null)

    try {
      // Check if the HTML5QrCode is available
      if (typeof window !== "undefined" && typeof window.Html5Qrcode !== "undefined") {
        startScanner()
      } else {
        // If not available, wait for it to load
        const checkLibrary = setInterval(() => {
          if (typeof window !== "undefined" && typeof window.Html5Qrcode !== "undefined") {
            clearInterval(checkLibrary)
            startScanner()
          }
        }, 100)

        // Set a timeout to clear the interval if it takes too long
        setTimeout(() => {
          clearInterval(checkLibrary)
          if (!scannerRef.current) {
            setError("QR scanner library failed to load. Please refresh the page.")
            setLoading(false)
          }
        }, 5000)
      }
    } catch (error) {
      console.error("Error initializing scanner:", error)
      setError("Failed to initialize scanner. Please refresh and try again.")
      setLoading(false)
    }
  }

  const startScanner = () => {
    try {
      const qrContainer = document.getElementById("agent-qr-reader")
      if (!qrContainer) {
        console.error("QR reader container not found")
        setError("Scanner initialization failed. Please refresh the page.")
        setLoading(false)
        return
      }

      // Create scanner instance
      const html5QrCode = new window.Html5Qrcode("agent-qr-reader")
      scannerRef.current = html5QrCode

      // Configure scanner
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      }

      // Start scanner
      html5QrCode
        .start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            // On successful scan
            console.log("QR Code detected:", decodedText)
            processQrCode(decodedText)
          },
          (errorMessage) => {
            // This is just for QR detection errors, not for showing to users
            console.debug("QR scanning error:", errorMessage)
          },
        )
        .then(() => {
          setScanning(true)
          setLoading(false)
        })
        .catch((err) => {
          console.error("Error starting scanner:", err)
          setError("Failed to start camera. Please check camera permissions.")
          setLoading(false)
        })
    } catch (error) {
      console.error("Error in startScanner:", error)
      setError("Scanner initialization failed. Please refresh and try again.")
      setLoading(false)
    }
  }

  const processQrCode = (decodedText: string) => {
    try {
      // Try to stop the scanner immediately
      if (scannerRef.current) {
        scannerRef.current.stop().catch((err: any) => console.error("Error stopping scanner:", err))
      }

      // Extract product ID from QR code
      const productId = extractProductId(decodedText)

      if (!productId) {
        toast.error("Invalid QR code format")
        setError("Invalid QR code. Please scan a valid Evershine product QR code.")
        setScanning(false)
        return
      }

      // Agent dashboard product view
      const redirectUrl = `/dashboard/product/${productId}`
      toast.success("Product found! Redirecting to agent view...")

      // Navigate to the product page
      router.push(redirectUrl)
    } catch (error) {
      console.error("Error processing QR code:", error)
      setError("Failed to process QR code. Please try again.")
      setScanning(false)
    }
  }

  const restartScanner = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.stop().catch(() => {})
      } catch (error) {
        console.error("Error stopping scanner:", error)
      }
    }

    scannerRef.current = null
    setScanning(false)
    setError(null)

    // Short delay before restarting
    setTimeout(() => {
      initScanner()
    }, 100)
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50 flex flex-col items-center">
      <div className="w-full max-w-md">
        <Link href="/dashboard" className="inline-flex items-center text-dark hover:underline mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>

        <h2 className="text-2xl font-bold mb-6 text-center">Agent QR Scanner</h2>

        <Card className="w-full mb-6">
          <CardHeader>
            <CardTitle className="text-center">Scan Product QR</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4 w-full">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="w-full mb-4">
              {loading ? (
                <div className="h-64 flex items-center justify-center bg-gray-100 rounded-lg">
                  <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                  <span className="ml-2 text-gray-600">Starting camera...</span>
                </div>
              ) : (
                <div id="agent-qr-reader" className="w-full h-64 overflow-hidden rounded-lg"></div>
              )}

              <p className="text-center text-sm text-muted-foreground mt-2">
                {scanning ? "Position the QR code within the frame" : "Camera initializing..."}
              </p>
            </div>

            <Button
              onClick={restartScanner}
              className="w-full bg-[#194a95] hover:bg-[#0f3a7a] flex items-center justify-center"
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Restart Camera
            </Button>
          </CardContent>
        </Card>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-medium text-gray-900 mb-2">Agent Scanner Tips:</h3>
          <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
            <li>You will be redirected to the agent product view</li>
            <li>Make sure the QR code is clearly visible</li>
            <li>Good lighting improves scanning success</li>
            <li>Hold the camera steady for best results</li>
          </ul>
        </div>
      </div>

      {/* Add script to load html5-qrcode */}
      <script src="https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js" async />
    </div>
  )
}
