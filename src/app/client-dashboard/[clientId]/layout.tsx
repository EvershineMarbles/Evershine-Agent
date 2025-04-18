"use client"

import React from "react"
import { IconSidebar } from "@/components/icon-sidebar"
import Link from "next/link"
import { Heart, ShoppingCart, User, LogOut, Home } from "lucide-react"

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
          <Link href="/" className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            <span className="font-medium hidden sm:inline">Evershine</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link href={`/client-dashboard/${clientId}/wishlist`} className="relative">
              <button className="p-2 text-white hover:bg-white/20 rounded-full">
                <Heart className="h-5 w-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </button>
            </Link>

            <Link href={`/client-dashboard/${clientId}/cart`} className="relative">
              <button className="p-2 text-white hover:bg-white/20 rounded-full">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
            </Link>

            <div className="h-6 w-px bg-white/30 mx-1"></div>

            <button className="p-2 text-white hover:bg-white/20 rounded-md flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Account</span>
            </button>

            <button className="p-2 text-white hover:bg-white/20 rounded-md flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
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
