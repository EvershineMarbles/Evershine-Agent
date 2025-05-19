"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { QrCode, Camera, ArrowLeft } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function ScanQRPage() {
  const [scanning, setScanning] = useState(false)
  const [scanned, setScanned] = useState(false)

  const startScanning = () => {
    setScanning(true)

    // Simulate scanning process
    setTimeout(() => {
      setScanning(false)
      setScanned(true)
    }, 2000)
  }

  return (
    <div className="min-h-screen p-6 md:p-12 bg-gray-50">
      <div className="flex flex-col items-center relative mb-8">
        <Link href="/dashboard" className="absolute left-6 md:left-12 top-6 inline-flex items-center text-dark hover:underline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
        <Image src="/logo.png" alt="Evershine Logo" width={180} height={100} priority className="mt-8" />
      </div>

      <h2 className="text-3xl font-bold mb-6 text-center">Scan QR Code</h2>

      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>QR Code Scanner</CardTitle>
          <CardDescription>Scan a QR code to access client information</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center min-h-[300px]">
          {scanning ? (
            <div className="text-center">
              <div className="relative w-64 h-64 mx-auto border-4 border-blue rounded-lg overflow-hidden mb-4">
                <div className="absolute inset-0 bg-black/5"></div>
                <div className="absolute left-0 top-0 w-full h-1 bg-blue animate-scan"></div>
              </div>
              <p className="text-muted-foreground">Scanning...</p>
            </div>
          ) : scanned ? (
            <div className="text-center">
              <div className="bg-green-50 rounded-full p-6 mb-4">
                <QrCode className="h-16 w-16 text-green-500 mx-auto" />
              </div>
              <h3 className="text-xl font-bold">QR Code Scanned Successfully!</h3>
              <p className="text-muted-foreground mt-2 mb-4">Client information retrieved</p>
              <Button
                className="bg-blue hover:bg-blue/90"
                onClick={() => {
                  // In a real app, this would navigate to the client dashboard
                  window.location.href = "/client-dashboard/rahul-sharma"
                }}
              >
                View Client Dashboard
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <QrCode className="h-24 w-24 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">Position a QR code in front of your camera</p>
              <Button onClick={startScanning} className="bg-blue hover:bg-blue/90">
                <Camera className="h-4 w-4 mr-2" />
                Start Scanning
              </Button>
            </div>
          )}
        </CardContent>
        {!scanning && !scanned && (
          <CardFooter className="text-center text-sm text-muted-foreground">
            Scan the QR code provided to clients to quickly access their dashboard
          </CardFooter>
        )}
      </Card>
    </div>
  )
}

