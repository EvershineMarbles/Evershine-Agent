"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { QrCode, Camera, ShoppingCart, Heart } from "lucide-react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"

export default function ScanPage({ params }: { params: { clientId: string } }) {
  const [scanning, setScanning] = useState(false)
  const [scannedProduct, setScannedProduct] = useState<null | {
    id: number
    name: string
    description: string
    price: number
    category: string
    image: string
  }>(null)

  const { toast } = useToast()

  const addToCart = (productId: number) => {
    // In a real app, you would add to cart via API
    console.log(`Added product ${productId} to cart`)

    // Show toast notification
    toast({
      title: "Added to Cart",
      description: `${scannedProduct?.name} has been added to your cart`,
      variant: "success",
      duration: 3000,
    })
  }

  const startScanning = () => {
    setScanning(true)

    // Simulate scanning a product after 2 seconds
    setTimeout(() => {
      setScanning(false)
      setScannedProduct({
        id: 101,
        name: "Premium Marble Slab",
        description: "High-quality imported marble slab with unique veining patterns",
        price: 5600,
        category: "Marble",
        image: "/placeholder.svg?height=300&width=300",
      })
    }, 2000)
  }

  const resetScan = () => {
    setScannedProduct(null)
  }

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-3xl font-bold mb-8">Scan Products</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>QR Code Scanner</CardTitle>
            <CardDescription>Scan a product QR code to view details</CardDescription>
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
            ) : scannedProduct ? (
              <div className="text-center">
                <div className="relative w-64 h-64 mx-auto overflow-hidden mb-4">
                  <Image
                    src={scannedProduct.image || "/placeholder.svg"}
                    alt={scannedProduct.name}
                    fill
                    className="object-cover rounded-lg"
                  />
                  <Badge className="absolute top-2 right-2 bg-blue">{scannedProduct.category}</Badge>
                </div>
                <h3 className="text-xl font-bold">{scannedProduct.name}</h3>
                <p className="text-muted-foreground mt-2">{scannedProduct.description}</p>
                <p className="text-lg font-bold mt-2">₹{scannedProduct.price}</p>
              </div>
            ) : (
              <div className="text-center">
                <QrCode className="h-24 w-24 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No QR code scanned yet</p>
                <Button onClick={startScanning} className="bg-blue hover:bg-blue/90">
                  <Camera className="h-4 w-4 mr-2" />
                  Start Scanning
                </Button>
              </div>
            )}
          </CardContent>
          {scannedProduct && (
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={resetScan}>
                Scan Another
              </Button>
              <div className="space-x-2">
                <Button variant="outline" size="icon">
                  <Heart className="h-4 w-4" />
                </Button>
                <Button className="bg-blue hover:bg-blue/90" onClick={() => addToCart(scannedProduct.id)}>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scanning Instructions</CardTitle>
            <CardDescription>How to scan product QR codes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="bg-blue/10 rounded-full p-2 text-blue">
                <span className="font-bold">1</span>
              </div>
              <div>
                <h3 className="font-medium">Find the QR code</h3>
                <p className="text-muted-foreground">Locate the QR code on the product or catalog</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-blue/10 rounded-full p-2 text-blue">
                <span className="font-bold">2</span>
              </div>
              <div>
                <h3 className="font-medium">Click "Start Scanning"</h3>
                <p className="text-muted-foreground">Press the button to activate the scanner</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-blue/10 rounded-full p-2 text-blue">
                <span className="font-bold">3</span>
              </div>
              <div>
                <h3 className="font-medium">Position the QR code</h3>
                <p className="text-muted-foreground">Center the QR code in the scanning area</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-blue/10 rounded-full p-2 text-blue">
                <span className="font-bold">4</span>
              </div>
              <div>
                <h3 className="font-medium">View product details</h3>
                <p className="text-muted-foreground">Product information will appear automatically</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

