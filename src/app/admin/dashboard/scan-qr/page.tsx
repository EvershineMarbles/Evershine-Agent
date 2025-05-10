"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function AdminScanQRPage() {
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Start scanning utomatically when the component mounts
  useEffect(() => {
    // Small delay to ensure DOM is fully loaded
    const timer = setTimeout(() => {
      startScanning()
    }, 1000)

    return () => {
      clearTimeout(timer)
      // Clean up on unmount
      if (typeof window !== "undefined") {
        const element = document.getElementById("qr-reader")
        if (element) {
          try {
            const html5QrCode = new (window as any).Html5Qrcode("qr-reader")
            html5QrCode.stop().catch(() => {})
          } catch (error) {
            // Ignore errors during cleanup
          }
        }
      }
    }
  }, [])

  // Function to start scanning
  const startScanning = async () => {
    setError(null)
    setScanning(true)
    setLoading(true)

    try {
      // Dynamically import the html5-qrcode library
      const { Html5Qrcode } = await import("html5-qrcode")

      // Create instance
      const html5QrCode = new Html5Qrcode("qr-reader")
      setLoading(false)

      // Start scanning
      html5QrCode
        .start(
          { facingMode: "environment" }, // Use back camera
          {
            fps: 10,
            qrbox: 250,
          },
          (decodedText) => {
            // On successful scan
            console.log(`QR Code detected: ${decodedText}`)

            // Stop scanning
            html5QrCode
              .stop()
              .then(() => {
                // Process the QR code
                processQRCode(decodedText)
              })
              .catch((err) => {
                console.error("Error stopping QR scanner:", err)
                setScanning(false)
                setError("Failed to process QR code. Please try again.")
              })
          },
          (errorMessage) => {
            // On error
            console.error(`QR Code scanning error: ${errorMessage}`)
          },
        )
        .catch((err) => {
          console.error("Error starting QR scanner:", err)
          setScanning(false)
          setLoading(false)
          setError("Could not access camera. Please ensure you've granted camera permissions.")
        })
    } catch (error) {
      console.error("Error initializing QR scanner:", error)
      setScanning(false)
      setLoading(false)
      setError("Failed to initialize QR scanner. Please try again.")
    }
  }

  // Process the scanned QR code
  const processQRCode = (decodedText: string) => {
    try {
      // Check if the decoded text is our special format
      if (decodedText.startsWith("ev://product/")) {
        // Extract the product ID
        const productId = decodedText.replace("ev://product/", "")

        // For admin, always redirect to admin product page
        router.push(`/admin/dashboard/product/${productId}`)
        toast.success("Product found! Redirecting to admin view...")
        return
      }

      // Handle legacy QR code formats
      if (decodedText.includes("/product/")) {
        // Try to extract product ID from URL
        try {
          const url = new URL(decodedText)
          const pathParts = url.pathname.split("/")
          const productIndex = pathParts.findIndex((part) => part === "product")

          if (productIndex !== -1 && pathParts.length > productIndex + 1) {
            const productId = pathParts[productIndex + 1]
            router.push(`/admin/dashboard/product/${productId}`)
            toast.success("Product found! Redirecting to admin view...")
            return
          }
        } catch (e) {
          // Not a URL, continue with other checks
        }
      }

      // If we get here, we couldn't process the QR code
      setScanning(false)
      setError("Invalid QR code. Please scan a valid Evershine product QR code.")
    } catch (error) {
      console.error("Error processing QR code:", error)
      setScanning(false)
      setError("Failed to process QR code. Please try again.")
    }
  }

  // Function to stop scanning
  const stopScanning = () => {
    if (typeof window !== "undefined") {
      const element = document.getElementById("qr-reader")
      if (element) {
        try {
          const html5QrCode = new (window as any).Html5Qrcode("qr-reader")
          html5QrCode.stop().catch(() => {})
          setScanning(false)
        } catch (error) {
          console.error("Error stopping scanner:", error)
        }
      }
    }
  }

  // Function to restart scanning
  const restartScanning = () => {
    stopScanning()
    setTimeout(() => {
      startScanning()
    }, 500)
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-md mx-auto">
        <Link href="/admin/dashboard" className="inline-flex items-center text-dark hover:underline mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>

        <h2 className="text-2xl font-bold mb-6 text-center">Admin QR Scanner</h2>

        <Card className="w-full mb-6">
          <CardHeader>
            <CardTitle className="text-center">Scan Product QR</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4 w-full flex items-start">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="w-full mb-4">
              {loading ? (
                <div className="h-64 flex items-center justify-center bg-gray-100 rounded-lg">
                  <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                  <span className="ml-2 text-gray-600">Initializing camera...</span>
                </div>
              ) : (
                <>
                  <div id="qr-reader" className="w-full h-64 overflow-hidden rounded-lg"></div>
                  <p className="text-center text-sm text-muted-foreground mt-2">
                    {scanning ? "Position the QR code within the frame" : "Camera is off"}
                  </p>
                </>
              )}
            </div>

            {/* Control buttons */}
            <div className="flex gap-2 w-full">
              {scanning ? (
                <Button onClick={stopScanning} className="w-1/2 bg-red-500 hover:bg-red-600">
                  Stop Camera
                </Button>
              ) : (
                <Button onClick={startScanning} className="w-1/2 bg-blue-600 hover:bg-blue-700" disabled={loading}>
                  Start Camera
                </Button>
              )}

              <Button
                onClick={restartScanning}
                className="w-1/2 bg-gray-600 hover:bg-gray-700"
                disabled={loading || !scanning}
              >
                Restart Scanner
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-medium text-gray-900 mb-2">Admin Scanner Features:</h3>
          <ul className="list-disc pl-5 text-sm text-gray-600 space-y-2">
            <li>Automatically redirects to admin product view</li>
            <li>Works with all Evershine product QR codes</li>
            <li>Camera starts automatically when page loads</li>
            <li>Use the restart button if scanning is slow</li>
          </ul>
        </div>
      </div>

      {/* Add script to load html5-qrcode */}
      <script src="https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js" async />
    </div>
  )
}
