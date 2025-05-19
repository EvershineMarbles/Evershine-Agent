"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { extractProductId } from "@/lib/qr-utils"

// Create a separate component for the QR scanner to better control its lifecycle
const QRScanner = ({ onScan, onError }) => {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Create a style element to force the camera to stay in position
    const styleElement = document.createElement("style")
    styleElement.textContent = `
      #admin-qr-reader {
        position: relative !important;
        height: 300px !important;
        width: 100% !important;
        overflow: hidden !important;
      }
      
      #admin-qr-reader video {
        object-fit: cover !important;
        width: 100% !important;
        height: 100% !important;
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
      }
      
      #admin-qr-reader canvas {
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
      }
      
      #admin-qr-reader__scan_region {
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
      }
      
      #admin-qr-reader__dashboard {
        position: absolute !important;
        bottom: 0 !important;
        width: 100% !important;
        background: rgba(0, 0, 0, 0.5) !important;
        color: white !important;
        padding: 5px !important;
        z-index: 10 !important;
      }
    `
    document.head.appendChild(styleElement)

    // Load the QR code library
    const script = document.createElement("script")
    script.src = "https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js"
    script.async = true
    document.head.appendChild(script)

    script.onload = () => {
      console.log("QR code library loaded")
      setTimeout(initializeScanner, 500)
    }

    script.onerror = () => {
      console.error("Failed to load QR code library")
      onError("Failed to load scanner. Please refresh the page.")
      setLoading(false)
    }

    return () => {
      // Clean up
      try {
        if (window.Html5Qrcode) {
          const scanner = new window.Html5Qrcode("admin-qr-reader")
          if (scanner.isScanning) {
            scanner.stop().catch(console.error)
          }
        }
      } catch (error) {
        console.error("Error cleaning up scanner:", error)
      }

      // Remove the style element
      document.head.removeChild(styleElement)
    }
  }, [onScan, onError])

  const initializeScanner = () => {
    if (!window.Html5Qrcode) {
      console.error("Html5Qrcode not available")
      onError("Scanner library not available. Please refresh the page.")
      setLoading(false)
      return
    }

    try {
      const html5QrCode = new window.Html5Qrcode("admin-qr-reader")

      // Configure scanner
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        formatsToSupport: [0], // QR_CODE only
      }

      // Start scanning
      html5QrCode
        .start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            // On successful scan
            console.log("QR Code detected:", decodedText)
            onScan(decodedText, html5QrCode)
          },
          (errorMessage) => {
            // Just for debugging
            console.debug("QR scanning message:", errorMessage)
          },
        )
        .then(() => {
          console.log("Scanner started successfully")
          setLoading(false)
        })
        .catch((err) => {
          console.error("Error starting scanner:", err)

          // User-friendly error message
          if (err.toString().includes("NotAllowedError")) {
            onError("Camera access denied. Please check your browser settings and permissions.")
          } else if (err.toString().includes("NotFoundError")) {
            onError("No camera found. Please make sure your device has a working camera.")
          } else if (err.toString().includes("NotReadableError")) {
            onError("Camera is in use by another application. Please close other apps using the camera.")
          } else {
            onError("Failed to start camera. Please try again or use a different device.")
          }

          setLoading(false)
        })
    } catch (error) {
      console.error("Error in startScanner:", error)
      onError("Failed to initialize scanner. Please refresh and try again.")
      setLoading(false)
    }
  }

  return (
    <div className="relative w-full h-64 overflow-hidden">
      {loading ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-2" />
          <span className="text-gray-600">Starting camera...</span>
        </div>
      ) : null}
      <div id="admin-qr-reader" className="w-full h-full"></div>
    </div>
  )
}

export default function AdminScanQRPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [showScanner, setShowScanner] = useState(true) // Start with scanner visible

  // Ensure scanner is shown on component mount
  useEffect(() => {
    setShowScanner(true)
  }, [])

  const handleScan = (decodedText: string, scanner: any) => {
    try {
      // Stop scanning immediately
      if (scanner && scanner.isScanning) {
        scanner.stop().catch(console.error)
      }

      // Extract product ID from QR code
      const productId = extractProductId(decodedText)

      if (!productId) {
        toast.error("Invalid QR code")
        setError("Invalid QR code. Please scan a valid Evershine product QR code.")
        return
      }

      // For admin, always redirect to the admin dashboard product page
      const redirectUrl = `/admin/dashboard/product/${productId}`

      // Show success message and redirect
      toast.success("Product found!")
      router.push(redirectUrl)
    } catch (error) {
      console.error("Error processing QR code:", error)
      setError("Failed to process QR code. Please try again.")
    }
  }

  const handleError = (errorMessage: string) => {
    setError(errorMessage)

    // Only hide scanner for critical errors
    if (
      errorMessage.includes("Camera access denied") ||
      errorMessage.includes("No camera found") ||
      errorMessage.includes("Failed to load scanner")
    ) {
      setShowScanner(false)
    }
  }

  const startScanner = () => {
    setError(null)
    setShowScanner(true)
  }

  return (
    <div className="min-h-screen p-4 bg-gray-50">
      <div className="max-w-md mx-auto">
        <Link href="/admin/dashboard" className="inline-flex items-center text-dark hover:underline mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
        <Card className="w-full mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-center">Scan QR Code</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 mx-4 mb-3">
                <p className="text-sm text-red-600">{error}</p>
                <Button onClick={startScanner} variant="outline" size="sm" className="mt-2 w-full">
                  Try Again
                </Button>
              </div>
            )}

            {!showScanner && (
              <div className="px-4 pb-4">
                <Button
                  onClick={startScanner}
                  className="w-full bg-[#194a95] hover:bg-[#0f3a7a] flex items-center justify-center"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Scan QR
                </Button>
              </div>
            )}

            {showScanner && <QRScanner onScan={handleScan} onError={handleError} />}
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardContent className="p-4">
            <h3 className="font-medium text-gray-900 mb-2">Scanning Tips:</h3>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li>Make sure the QR code is well-lit and not blurry</li>
              <li>Hold your device steady while scanning</li>
              <li>Position the QR code within the scanning area</li>
              <li>If scanning fails, use the "Try Again" button</li>
              <li>Ensure camera permissions are granted in your browser</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
