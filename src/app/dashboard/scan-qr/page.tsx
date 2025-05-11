"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { extractProductId } from "@/lib/qr-utils"

export default function AgentScanQRPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [scannerInitialized, setScannerInitialized] = useState(false)

  // Load the QR code library as soon as possible
  useEffect(() => {
    // Add the script to the head to load it early
    const script = document.createElement("script")
    script.src = "https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js"
    script.async = true
    document.head.appendChild(script)

    script.onload = () => {
      console.log("QR code library loaded")
      // Wait a moment for the DOM to be fully ready
      setTimeout(() => {
        // Create a clean container for the QR reader
        const qrContainer = document.getElementById("qr-container")
        if (qrContainer) {
          // Clear any existing content
          qrContainer.innerHTML = '<div id="agent-qr-reader" style="width: 100%; height: 300px;"></div>'
          initializeScanner()
        }
      }, 1000)
    }

    script.onerror = () => {
      console.error("Failed to load QR code library")
      setError("Failed to load scanner. Please refresh the page.")
      setLoading(false)
    }

    return () => {
      // Clean up
      if (window.Html5Qrcode) {
        try {
          const scanner = new window.Html5Qrcode("agent-qr-reader")
          if (scanner.isScanning) {
            scanner.stop().catch(console.error)
          }
        } catch (error) {
          console.error("Error cleaning up scanner:", error)
        }
      }
    }
  }, [])

  const initializeScanner = () => {
    // First, check if the library is available
    if (typeof window === "undefined" || !window.Html5Qrcode) {
      console.error("Html5Qrcode not available")
      setError("Scanner library not available. Please refresh the page.")
      setLoading(false)
      return
    }

    // Make sure the container exists before proceeding
    const qrContainer = document.getElementById("agent-qr-reader")
    if (!qrContainer) {
      console.error("QR reader container not found, will retry")
      setError("Scanner element not found. Please refresh the page.")
      setLoading(false)
      return
    }

    // Start the scanner
    startScanner()
  }

  // Add this new function to handle the actual scanner initialization
  const startScanner = () => {
    try {
      const html5QrCode = new window.Html5Qrcode("agent-qr-reader")

      // Configure scanner with more reliable settings
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        formatsToSupport: [0], // QR_CODE only for better performance
      }

      // Start scanning
      html5QrCode
        .start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            // On successful scan
            console.log("QR Code detected:", decodedText)
            processQrCode(decodedText, html5QrCode)
          },
          (errorMessage) => {
            // Just for debugging, don't show to user
            console.debug("QR scanning message:", errorMessage)
          },
        )
        .then(() => {
          console.log("Scanner started successfully")
          setScannerInitialized(true)
          setLoading(false)
        })
        .catch((err) => {
          console.error("Error starting scanner:", err)

          // More user-friendly error message
          if (err.toString().includes("NotAllowedError")) {
            setError("Camera access denied. Please check your browser settings and permissions.")
          } else if (err.toString().includes("NotFoundError")) {
            setError("No camera found. Please make sure your device has a working camera.")
          } else if (err.toString().includes("NotReadableError")) {
            setError("Camera is in use by another application. Please close other apps using the camera.")
          } else {
            setError("Failed to start camera. Please try again or use a different device.")
          }

          setLoading(false)
        })
    } catch (error) {
      console.error("Error in startScanner:", error)
      setError("Failed to initialize scanner. Please refresh and try again.")
      setLoading(false)
    }
  }

  const processQrCode = (decodedText: string, scanner: any) => {
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

      // For agents, always redirect to the agent dashboard product page
      const redirectUrl = `/dashboard/product/${productId}`

      // Show success message and redirect
      toast.success("Product found!")
      router.push(redirectUrl)
    } catch (error) {
      console.error("Error processing QR code:", error)
      setError("Failed to process QR code. Please try again.")
    }
  }

  const restartScanner = () => {
    setLoading(true)
    setError(null)
    setScannerInitialized(false)

    // Clean up existing scanner
    if (window.Html5Qrcode) {
      try {
        const scanner = new window.Html5Qrcode("agent-qr-reader")
        if (scanner.isScanning) {
          scanner.stop().catch(console.error)
        }
      } catch (error) {
        console.error("Error stopping scanner:", error)
      }
    }

    // Clear and recreate the container
    const qrContainer = document.getElementById("qr-container")
    if (qrContainer) {
      qrContainer.innerHTML = '<div id="agent-qr-reader" style="width: 100%; height: 300px;"></div>'
    }

    // Reinitialize after a short delay
    setTimeout(initializeScanner, 500)
  }

  return (
    <div className="min-h-screen p-4 bg-gray-50">
      <div className="max-w-md mx-auto">
        <Link href="/dashboard" className="inline-flex items-center text-dark hover:underline mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>

        <h2 className="text-2xl font-bold mb-4 text-center">Scan Product QR</h2>

        <Card className="w-full mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-center">Scan QR Code</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-3 w-full">
                <p className="text-sm text-red-600">{error}</p>
                <Button onClick={restartScanner} variant="outline" size="sm" className="mt-2 w-full">
                  Try Again
                </Button>
              </div>
            )}

            <Button
              onClick={restartScanner}
              className="w-full bg-[#194a95] hover:bg-[#0f3a7a] flex items-center justify-center mb-4"
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Scan QR
            </Button>

            {/* Fixed container for QR scanner */}
            <div id="qr-container" className="w-full rounded-lg overflow-hidden">
              {loading && (
                <div className="h-[300px] flex flex-col items-center justify-center bg-gray-100">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
                  <span className="text-gray-600">Starting camera...</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-medium text-gray-900 mb-2">Scanning Tips:</h3>
          <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
            <li>Make sure the QR code is well-lit and not blurry</li>
            <li>Hold your device steady while scanning</li>
            <li>Position the QR code within the scanning area</li>
            <li>If scanning fails, try the "Scan QR" button</li>
            <li>Ensure camera permissions are granted in your browser</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
