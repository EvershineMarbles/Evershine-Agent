"use client"

import { useState, useEffect, useRef } from "react"
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
  const scannerRef = useRef<any>(null)
  const isMounted = useRef(true)

  // Load the QR code library as soon as possible
  useEffect(() => {
    // Set mounted flag
    isMounted.current = true

    // Add the script to the head to load it early
    const script = document.createElement("script")
    script.src = "https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js"
    script.async = true
    document.head.appendChild(script)

    script.onload = () => {
      if (!isMounted.current) return
      console.log("QR code library loaded")

      // Wait a moment for the DOM to be fully ready
      setTimeout(initializeScanner, 500)
    }

    script.onerror = () => {
      if (!isMounted.current) return
      console.error("Failed to load QR code library")
      setError("Failed to load scanner. Please refresh the page.")
      setLoading(false)
    }

    // Clean up function
    return () => {
      // Set unmounted flag
      isMounted.current = false

      // Safely stop the scanner if it exists
      if (scannerRef.current) {
        try {
          scannerRef.current
            .stop()
            .then(() => console.log("Scanner stopped successfully"))
            .catch(() => console.log("Scanner already stopped"))
        } catch (error) {
          console.log("Error while stopping scanner:", error)
        }
        scannerRef.current = null
      }
    }
  }, [])

  const initializeScanner = () => {
    if (!isMounted.current) return

    // First, check if the library is available
    if (typeof window === "undefined" || !window.Html5Qrcode) {
      console.error("Html5Qrcode not available")
      setError("Scanner library not available. Please refresh the page.")
      setLoading(false)
      return
    }

    // Make sure we have a container to put the scanner in
    const qrContainer = document.getElementById("qr-container")
    if (!qrContainer) {
      console.error("QR container not found")
      setError("Scanner container not found. Please refresh the page.")
      setLoading(false)
      return
    }

    // Create a fresh scanner element
    qrContainer.innerHTML = '<div id="agent-qr-reader" style="width: 100%; height: 300px;"></div>'

    // Short delay to ensure DOM is updated
    setTimeout(startScanner, 100)
  }

  const startScanner = () => {
    if (!isMounted.current) return

    try {
      // Check if element exists
      const qrElement = document.getElementById("agent-qr-reader")
      if (!qrElement) {
        console.error("QR reader element not found")
        setError("Scanner element not found. Please refresh the page.")
        setLoading(false)
        return
      }

      // Create scanner instance
      const html5QrCode = new window.Html5Qrcode("agent-qr-reader")
      scannerRef.current = html5QrCode

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
            if (!isMounted.current) return
            // On successful scan
            console.log("QR Code detected:", decodedText)
            processQrCode(decodedText)
          },
          (errorMessage) => {
            // Just for debugging, don't show to user
            console.debug("QR scanning message:", errorMessage)
          },
        )
        .then(() => {
          if (!isMounted.current) {
            // If component unmounted during initialization, stop the scanner
            if (scannerRef.current) {
              scannerRef.current.stop().catch(console.error)
            }
            return
          }

          console.log("Scanner started successfully")
          setLoading(false)
        })
        .catch((err) => {
          if (!isMounted.current) return

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
      if (!isMounted.current) return

      console.error("Error in startScanner:", error)
      setError("Failed to initialize scanner. Please refresh and try again.")
      setLoading(false)
    }
  }

  const processQrCode = (decodedText: string) => {
    if (!isMounted.current) return

    try {
      // Stop scanning immediately
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error)
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
    if (!isMounted.current) return

    setLoading(true)
    setError(null)

    // Safely stop the scanner if it exists
    if (scannerRef.current) {
      try {
        scannerRef.current
          .stop()
          .then(() => {
            scannerRef.current = null
            initializeScanner()
          })
          .catch((err) => {
            console.error("Error stopping scanner:", err)
            scannerRef.current = null
            initializeScanner()
          })
      } catch (error) {
        console.error("Error in scanner cleanup:", error)
        scannerRef.current = null
        initializeScanner()
      }
    } else {
      initializeScanner()
    }
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
