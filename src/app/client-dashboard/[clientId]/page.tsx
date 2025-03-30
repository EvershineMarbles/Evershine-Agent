"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, QrCode, ShoppingCart, Heart } from 'lucide-react'
import Link from "next/link"

// Define the type for the unwrapped params
type ClientParams = {
  clientId: string
}

export default function ClientDashboard({
  params,
}: {
  params: Promise<ClientParams> | ClientParams
}) {
  // Unwrap the params object using React.use()
  const unwrappedParams = React.use(params as Promise<ClientParams>)
  const clientId = unwrappedParams.clientId

  // Format client name for display (convert from URL format)
  const clientName = clientId
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-3xl font-bold mb-8">Welcome to {clientName}&apos;s Dashboard</h1>

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
            <Button className="bg-blue hover:bg-blue/90">
              <ShoppingCart className="h-4 w-4 mr-2" />
              View Cart
            </Button>
            <Button className="bg-blue hover:bg-blue/90">
              <Heart className="h-4 w-4 mr-2" />
              Wishlist
            </Button>
            <Button className="bg-blue hover:bg-blue/90">
              <QrCode className="h-4 w-4 mr-2" />
              Scan QR
            </Button>
            <Button className="bg-blue hover:bg-blue/90">
              <Package className="h-4 w-4 mr-2" />
              Products
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}