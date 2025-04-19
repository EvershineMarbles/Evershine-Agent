"use client"

import React from "react"
import { IconSidebar } from "@/components/icon-sidebar"
import Link from "next/link"
import { Heart, ShoppingCart, User, LogOut, ArrowLeft } from "lucide-react"

// Define the type for the unwrapped params
type ClientParams = {
  clientId: string
}

export default function ClientDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<ClientParams> | ClientParams
}) {
  // Unwrap the params object using React.use()
  const unwrappedParams = React.use(params as Promise<ClientParams>)
  const clientId = unwrappedParams.clientId

  // State for wishlist and cart counts
  const [wishlistCount, setWishlistCount] = React.useState(0)
  const [cartCount, setCartCount] = React.useState(0)

  // Load wishlist and cart counts from localStorage
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedWishlist = localStorage.getItem("wishlist")
        if (savedWishlist) {
          setWishlistCount(JSON.parse(savedWishlist).length)
        }

        const savedCart = localStorage.getItem("cart")
        if (savedCart) {
          setCartCount(JSON.parse(savedCart).length)
        }
      } catch (e) {
        console.error("Error loading data from localStorage:", e)
      }
    }
  }, [])

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top Navigation Strip */}
      <div className="w-full bg-[#194a95] text-white py-3 px-4 md:px-8 shadow-md z-0">
        <div className="ml-16 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
        <ArrowLeft className="h-5 w-5" />
        <span className="font-medium hidden sm:inline">Back to Advisor Dashboard</span>
      </Link>
     
        </div>
      </div>

      {/* Main content with sidebar */}
      <div className="flex flex-1 overflow-hidden">
        <IconSidebar clientId={clientId} />
        <main className="flex-1 ml-16 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
