"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { toast } from "sonner"
import { extractProductId } from "@/lib/qr-utils"

export default function ClientScanQRPage() {
  const router = useRouter()
  const params = useParams()
  const clientId = params.clientId as string

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [scannerInitialized, setScannerInitialized] = useState(false)

  // Load the QR code library as soon as possible
  useEffect(() => {
    // Create a container for the QR reader if it doesn't exist
    let qrContainer = document.getElementById("client-qr-reader")
    if (!qrContainer) {
      console.log("Creating QR reader container")
      qrContainer = document.createElement("div")
      qrContainer.id = "client-qr-reader"
      qrContainer.className = "w-full h-64 overflow-hidden rounded-lg"

      // Find the parent container where it should be inserted
      const parentContainer = document.getElementById("qr-container")
      if (parentContainer) {
        parentContainer.appendChild(qrContainer)
      }
    }

    // Add the script to the head to load it early
    const script = document.createElement("script")
    script.src = "https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js"
    script.async = true
    document.head.appendChild(script)

    script.onload = () => {
      console.log("QR code library loaded")
      // Wait a moment for the DOM to be fully ready
      setTimeout(initializeScanner, 1000)
    }

    script.onerror = () => {
      console.error("Failed to load QR code library")
      setError("Failed to load scanner. Please refresh the page.")
      setLoading(false)
    }

    return () => {
      // Clean up
      if (scannerInitialized && window.Html5Qrcode) {
        try {
          const scanner = new window.Html5Qrcode("client-qr-reader")
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
    const qrContainer = document.getElementById("client-qr-reader")
    if (!qrContainer) {
      console.error("QR reader container not found, will retry")

      // Instead of failing, retry after a short delay
      setTimeout(() => {
        const retryContainer = document.getElementById("client-qr-reader")
        if (retryContainer) {
          console.log("QR reader container found on retry")
          startScanner()
        } else {
          console.error("QR reader container still not found after retry")
          setError("Scanner element not found. Please refresh the page.")
          setLoading(false)
        }
      }, 1000)
      return
    }

    // If container exists, start the scanner
    startScanner()
  }

  // Add this new function to handle the actual scanner initialization
  const startScanner = () => {
    try {
      const html5QrCode = new window.Html5Qrcode("client-qr-reader")

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

      // For clients, redirect to the client product page
      const redirectUrl = `/client-dashboard/${clientId}/product/${productId}`

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
        const scanner = new window.Html5Qrcode("client-qr-reader")
        if (scanner.isScanning) {
          scanner.stop().catch(console.error)
        }
      } catch (error) {
        console.error("Error stopping scanner:", error)
      }
    }

    // Make sure the container exists
    let qrContainer = document.getElementById("client-qr-reader")
    if (!qrContainer) {
      console.log("Recreating QR reader container")
      qrContainer = document.createElement("div")
      qrContainer.id = "client-qr-reader"
      qrContainer.className = "w-full h-64 overflow-hidden rounded-lg"

      const parentContainer = document.getElementById("qr-container")
      if (parentContainer) {
        parentContainer.appendChild(qrContainer)
      }
    }

    // Reinitialize after a short delay
    setTimeout(initializeScanner, 1000)
  }

  return (
    <div className="min-h-screen p-4 bg-gray-50">
      <div className="max-w-md mx-auto">
        <Link
          href={`/client-dashboard/${clientId}`}
          className="inline-flex items-center text-dark hover:underline mb-4"
        >
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

            <div className="w-full" id="qr-container">
              {loading ? (
                <div className="h-64 flex flex-col items-center justify-center bg-gray-100 rounded-lg">
                  <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-2" />
                  <span className="text-gray-600">Starting camera...</span>
                </div>
              ) : (
                <div id="client-qr-reader" className="w-full h-64 overflow-hidden rounded-lg"></div>
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
