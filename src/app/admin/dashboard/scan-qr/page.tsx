"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Camera, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function AdminScanQRPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const scannerRef = useRef<any>(null)
  const [cameraActive, setCameraActive] = useState(false)

  // Immediately load the QR code library when component mounts
  useEffect(() => {
    // Preload the HTML5QrCode library
    const script = document.createElement("script")
    script.src = "https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js"
    script.async = true
    script.onload = () => {
      // Start scanner immediately after script loads
      initializeScanner()
    }
    document.head.appendChild(script)

    // Cleanup function
    return () => {
      stopScanner()
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [])

  const initializeScanner = () => {
    if (typeof window === "undefined" || !window.Html5Qrcode) {
      console.error("HTML5QrCode library not loaded")
      setError("Scanner library failed to load. Please refresh the page.")
      return
    }

    try {
      const qrElement = document.getElementById("qr-reader")
      if (!qrElement) {
        console.error("QR reader element not found")
        setError("Scanner initialization failed. Please refresh the page.")
        return
      }

      // Clear any previous instances
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error)
      }

      // Create new scanner instance
      const html5QrCode = new window.Html5Qrcode("qr-reader")
      scannerRef.current = html5QrCode

      // Start scanning immediately
      html5QrCode
        .start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            processQrCode(decodedText)
          },
          (errorMessage) => {
            // Just log scanning errors, don't display to user unless critical
            console.log("QR scanning message:", errorMessage)
          },
        )
        .then(() => {
          console.log("QR Scanner started successfully")
          setCameraActive(true)
        })
        .catch((err) => {
          console.error("Failed to start scanner:", err)
          setError("Camera access denied. Please check your browser permissions.")
          setCameraActive(false)
        })
    } catch (err) {
      console.error("Scanner initialization error:", err)
      setError(`Scanner error: ${err instanceof Error ? err.message : "Unknown error"}`)
    }
  }

  const stopScanner = () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().catch(console.error)
        }
      } catch (err) {
        console.error("Error stopping scanner:", err)
      }
      scannerRef.current = null
      setCameraActive(false)
    }
  }

  const processQrCode = (decodedText: string) => {
    console.log("Processing QR code:", decodedText)

    // Stop scanner immediately to prevent multiple scans
    if (scannerRef.current && scannerRef.current.isScanning) {
      // Use stop without waiting for it to complete
      scannerRef.current.stop().catch(console.error)
      setCameraActive(false)
    }

    try {
      // Check if it's our special format
      if (decodedText.startsWith("ev://product/")) {
        const productId = decodedText.replace("ev://product/", "")
        redirectToProduct(productId)
        return
      }

      // Handle legacy URL formats
      if (decodedText.includes("/product/")) {
        const parts = decodedText.split("/product/")
        if (parts.length > 1) {
          const productId = parts[1].split("/")[0].split("?")[0]
          if (productId) {
            redirectToProduct(productId)
            return
          }
        }
      }

      // If we get here, we couldn't process the QR code
      toast.error("Invalid QR code format. Please scan a valid product QR code.")
      // Restart scanner after a short delay
      setTimeout(initializeScanner, 2000)
    } catch (err) {
      console.error("Error processing QR code:", err)
      toast.error("Failed to process QR code")
      // Restart scanner after a short delay
      setTimeout(initializeScanner, 2000)
    }
  }

  const redirectToProduct = (productId: string) => {
    toast.success("Product found! Redirecting...", {
      duration: 1500,
    })

    // Navigate immediately without waiting
    router.push(`/admin/dashboard/product/${productId}`)
  }

  const restartScanner = () => {
    stopScanner()
    // Start again immediately
    initializeScanner()
  }

  return (
    <div className="min-h-screen p-4 bg-gray-50">
      <div className="max-w-md mx-auto">
        <Link href="/admin/dashboard" className="inline-flex items-center text-dark hover:underline mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>

        <h2 className="text-2xl font-bold mb-4 text-center">Admin QR Scanner</h2>

        <Card className="w-full mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-center">Scan Product QR</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-3 w-full">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            )}

            <div className="w-full mb-3">
              <div className="relative">
                {/* This div will be used by the html5-qrcode library */}
                <div id="qr-reader" className="w-full h-64 overflow-hidden rounded-lg"></div>

                {!cameraActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 bg-opacity-90 rounded-lg">
                    <Camera className="h-12 w-12 text-gray-400 mb-2" />
                    <p className="text-gray-500">Initializing camera...</p>
                  </div>
                )}
              </div>

              <p className="text-center text-sm text-gray-500 mt-2">
                {cameraActive ? "Position the QR code within the frame" : "Camera starting..."}
              </p>
            </div>

            <Button onClick={restartScanner} className="w-full bg-blue-600 hover:bg-blue-700">
              Restart Camera
            </Button>
          </CardContent>
        </Card>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <h3 className="font-medium text-blue-800 mb-1">Scanner Tips:</h3>
          <ul className="list-disc pl-4 text-sm text-blue-700 space-y-1">
            <li>Hold the QR code steady within the frame</li>
            <li>Ensure adequate lighting for best results</li>
            <li>If scanning fails, use the "Restart Camera" button</li>
            <li>Make sure camera permissions are granted</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
