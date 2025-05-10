"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Html5Qrcode } from "html5-qrcode"
import { ArrowLeft, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { extractProductId, getRedirectUrl } from "@/lib/qr-utils"

export default function ClientScanQR() {
  const router = useRouter()
  const params = useParams()
  const clientId = params.clientId as string

  const [scanning, setScanning] = useState(false)
  const [html5QrCode, setHtml5QrCode] = useState<Html5Qrcode | null>(null)

  useEffect(() => {
    // Clean up on unmount
    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode
          .stop()
          .then(() => console.log("QR Code scanning stopped"))
          .catch((err) => console.error("Failed to stop QR Code scanning:", err))
      }
    }
  }, [html5QrCode])

  const startScanning = () => {
    setScanning(true)

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
    }

    const qrCodeScanner = new Html5Qrcode("reader")
    setHtml5QrCode(qrCodeScanner)

    const qrCodeSuccessCallback = (decodedText: string) => {
      handleQrCodeScan(decodedText, qrCodeScanner)
    }

    qrCodeScanner.start({ facingMode: "environment" }, config, qrCodeSuccessCallback).catch((err) => {
      console.error("Error starting QR code scanner:", err)
      toast.error("Failed to start camera. Please check permissions.")
      setScanning(false)
    })
  }

  const stopScanning = () => {
    if (html5QrCode && html5QrCode.isScanning) {
      html5QrCode
        .stop()
        .then(() => {
          console.log("QR Code scanning stopped")
          setScanning(false)
        })
        .catch((err) => {
          console.error("Failed to stop QR Code scanning:", err)
        })
    }
  }

  const handleQrCodeScan = async (decodedText: string, scanner: Html5Qrcode) => {
    try {
      // Stop scanning immediately to prevent multiple scans
      await scanner.stop()
      setScanning(false)

      console.log("QR Code detected:", decodedText)

      // Extract product ID from QR code
      const productId = extractProductId(decodedText)

      if (!productId) {
        toast.error("Invalid QR code format")
        return
      }

      // For client dashboard, always redirect to client product page
      const redirectUrl = getRedirectUrl(productId, false, clientId)

      // Navigate to the product page
      router.push(redirectUrl)
    } catch (error) {
      console.error("Error handling QR code scan:", error)
      toast.error("Failed to process QR code")
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/client-dashboard/${clientId}`)}
            className="mr-2"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Scan Product QR</h1>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-gray-600 mb-2">Position the QR code within the camera view to scan it automatically.</p>
          <p className="text-sm text-green-600">
            You will be able to view product details and add items to your wishlist.
          </p>
        </div>

        <div className="flex flex-col items-center">
          <div
            id="reader"
            className={`w-full max-w-sm h-64 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mb-6 ${
              scanning ? "border-solid border-[#194a95]" : ""
            }`}
          >
            {!scanning && (
              <div className="text-center p-4">
                <Camera className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500">Camera will appear here</p>
              </div>
            )}
          </div>

          <Button
            onClick={scanning ? stopScanning : startScanning}
            className={`w-full max-w-sm ${
              scanning ? "bg-red-500 hover:bg-red-600" : "bg-[#194a95] hover:bg-[#0f3a7a]"
            }`}
          >
            {scanning ? "Stop Scanning" : "Start Scanning"}
          </Button>
        </div>
      </div>
    </div>
  )
}
