"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, QrCode, Heart, ShoppingCart } from "lucide-react"
import { hasClientImpersonation } from "@/lib/auth-utils"

interface ClientError {
  message: string
  code?: number
}

export default function ClientDashboard() {
  const router = useRouter()
  const params = useParams()
  const [clientName, setClientName] = useState("")
  const [clientId, setClientId] = useState("")
  const [error, setError] = useState<ClientError | null>(null)

  useEffect(() => {
    // Get clientId from params
    const id = params.clientId as string
    if (!id) return

    setClientId(id)

    // Check if agent has impersonation token
    if (!hasClientImpersonation()) {
      console.log("No impersonation token found in page, redirecting to dashboard")
      router.push("/dashboard")
      return
    }

    // Format client name for display
    setClientName(
      id
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
    )
  }, [params, router])

  // Don't render anything until clientId is set
  if (!clientId) {
    return null
  }

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-3xl font-bold mb-8">Welcome to {clientName || "Client"}&apos;s Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href={`/client-dashboard/${clientId}/products`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader className="pb-2">
              <Package className="h-8 w-8 text-blue mb-2" />
              <CardTitle>Products</CardTitle>
              <CardDescription>Browse all available products</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-blue hover:bg-blue/90 mt-2">View Products</Button>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/client-dashboard/${clientId}/scan`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader className="pb-2">
              <QrCode className="h-8 w-8 text-blue mb-2" />
              <CardTitle>Scan Products</CardTitle>
              <CardDescription>Scan QR codes to view products</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-blue hover:bg-blue/90 mt-2">Scan Now</Button>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/client-dashboard/${clientId}/wishlist`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader className="pb-2">
              <Heart className="h-8 w-8 text-blue mb-2" />
              <CardTitle>Wishlist</CardTitle>
              <CardDescription>View your saved products</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-blue hover:bg-blue/90 mt-2">View Wishlist</Button>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/client-dashboard/${clientId}/cart`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader className="pb-2">
              <ShoppingCart className="h-8 w-8 text-blue mb-2" />
              <CardTitle>Cart</CardTitle>
              <CardDescription>View your cart and checkout</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-blue hover:bg-blue/90 mt-2">View Cart</Button>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Your latest orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">No recent orders found</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Frequently used actions</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Button
              className="bg-blue hover:bg-blue/90"
              onClick={() => router.push(`/client-dashboard/${clientId}/cart`)}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              View Cart
            </Button>
            <Button
              className="bg-blue hover:bg-blue/90"
              onClick={() => router.push(`/client-dashboard/${clientId}/wishlist`)}
            >
              <Heart className="h-4 w-4 mr-2" />
              Wishlist
            </Button>
            <Button
              className="bg-blue hover:bg-blue/90"
              onClick={() => router.push(`/client-dashboard/${clientId}/scan`)}
            >
              <QrCode className="h-4 w-4 mr-2" />
              Scan QR
            </Button>
            <Button
              className="bg-blue hover:bg-blue/90"
              onClick={() => router.push(`/client-dashboard/${clientId}/products`)}
            >
              <Package className="h-4 w-4 mr-2" />
              Products
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
