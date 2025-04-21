"use client"

import { useRef, useEffect, useState } from "react"
import Image from "next/image"
import QRCode from "qrcode"
import { Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface QRCodeGeneratorProps {
  productId: string
  productName: string
  category?: string
  thickness?: string
  size?: string
}

export default function QRCodeGenerator({
  productId,
  productName,
  category = "",
  thickness = "",
  size = "",
}: QRCodeGeneratorProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const templateImageRef = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    generateQRCode()
  }, [productId])

  const generateQRCode = async () => {
    try {
      setIsGenerating(true)

      // Generate QR code for the product URL
      const productUrl = `${window.location.origin}/product/${productId}`
      const qrCodeDataUrl = await QRCode.toDataURL(productUrl, {
        width: 200,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      })

      // Create the branded QR code card
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      // Set canvas dimensions to match the template image
      canvas.width = 600
      canvas.height = 900

      // Load the template image - using document.createElement instead of new Image()
      const templateImage = document.createElement("img")
      templateImage.crossOrigin = "anonymous"
      templateImage.src = "/assets/qr-template.png"

      templateImage.onload = () => {
        // Draw the template image on the canvas
        ctx.drawImage(templateImage, 0, 0, canvas.width, canvas.height)

        // Load and draw the QR code in the white space - using document.createElement
        const qrCode = document.createElement("img")
        qrCode.crossOrigin = "anonymous"
        qrCode.onload = () => {
          // Draw QR code in the white space at bottom right - adjusted position
          ctx.drawImage(qrCode, 380, 640, 150, 150)

          // Convert canvas to data URL
          const dataUrl = canvas.toDataURL("image/png")
          setQrCodeUrl(dataUrl)
          setIsGenerating(false)
        }
        qrCode.src = qrCodeDataUrl
      }

      templateImageRef.current = templateImage
    } catch (error) {
      console.error("Error generating QR code:", error)
      setIsGenerating(false)
    }
  }

  const handleDownload = () => {
    if (!qrCodeUrl) return

    const link = document.createElement("a")
    link.href = qrCodeUrl
    link.download = `evershine-product-${productId}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="flex flex-col items-center">
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {isGenerating ? (
        <div className="flex flex-col items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-[#194a95] mb-4" />
          <p>Generating QR code...</p>
        </div>
      ) : (
        <>
          <div className="mb-6 border rounded-lg overflow-hidden shadow-lg">
            <Image
              src={qrCodeUrl || "/placeholder.svg"}
              alt="Product QR Code"
              width={300}
              height={450}
              className="object-contain"
            />
          </div>
          <Button
            onClick={handleDownload}
            className="bg-[#194a95] hover:bg-[#0f3a7a] text-white flex items-center gap-2 px-6 py-2"
          >
            <Download className="w-5 h-5" />
            Download QR Code
          </Button>
        </>
      )}
    </div>
  )
}
