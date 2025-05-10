"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function ScanQRPage() {
  const [scanning, setScanning] = useState(false)
  const router = useRouter()

  // Function to start scanning
  const startScanning = async () => {
    setScanning(true)

    try {
      // Dynamically import the html5-qrcode library
      const { Html5Qrcode } = await import("html5-qrcode")

      // Create instance
      const html5QrCode = new Html5Qrcode("qr-reader")

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
                // Get client ID from URL
                const clientId = window.location.pathname.split("/")[2]

                // Check if the user has a client impersonation token (agent)
                const isAgent = localStorage.getItem("clientImpersonationToken") !== null

                // Check if this is our special format
                if (decodedText.startsWith("ev://product/")) {
                  // Extract the product ID
                  const productId = decodedText.replace("ev://product/", "")

                  if (isAgent && clientId) {
                    // Agent route with client context
                    router.push(`/client-dashboard/${clientId}/product/${productId}`)
                  } else {
                    // Not authorized or missing client context
                    alert("You are not authorized to view this product or missing client context.")
                    setScanning(false)
                  }
                } else if (decodedText.includes("/client-dashboard/")) {
                  // Legacy format - Navigate to the client dashboard
                  router.push(decodedText)
                } else if (decodedText.includes("product/")) {
                  // Legacy format - Navigate to product page
                  router.push(decodedText)
                } else {
                  // Try to extract client ID or product ID
                  const parts = decodedText.split("/")
                  const possibleId = parts[parts.length - 1]

                  if (possibleId && possibleId.length > 3) {
                    // Assume it's a client ID if we can't determine
                    router.push(`/client-dashboard/${possibleId}`)
                  } else {
                    alert("Invalid QR code. Please scan a valid Evershine QR code.")
                    setScanning(false)
                  }
                }
              })
              .catch((err) => {
                console.error("Error stopping QR scanner:", err)
                setScanning(false)
              })
          },
          (errorMessage) => {
            // On error
            console.error(`QR Code scanning error: ${errorMessage}`)
          },
        )
        .catch((err) => {
          console.error("Error starting QR scanner:", err)
          alert("Could not access camera. Please ensure you've granted camera permissions.")
          setScanning(false)
        })
    } catch (error) {
      console.error("Error initializing QR scanner:", error)
      setScanning(false)
    }
  }

  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Try to stop any active scanning when component unmounts
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

  return (
    <div className="min-h-screen p-6 bg-gray-50 flex flex-col items-center">
      <div className="w-full max-w-md">
        <Link href="/dashboard" className="inline-flex items-center text-dark hover:underline mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Link>

        <h2 className="text-2xl font-bold mb-6 text-center">Scan QR Code</h2>

        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-center">Scan Product QR</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            {scanning ? (
              <div className="w-full">
                {/* This div will be used by the html5-qrcode library */}
                <div id="qr-reader" className="w-full max-w-sm mx-auto"></div>
                <p className="text-center text-sm text-muted-foreground mt-4">Position the QR code within the frame</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <Camera className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-6">Click the button below to access your device's camera</p>
                <Button onClick={startScanning} className="bg-blue hover:bg-blue/90">
                  <Camera className="h-4 w-4 mr-2" />
                  Start Scanning
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add script to load html5-qrcode */}
      <script src="https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js" async />
    </div>
  )
}
