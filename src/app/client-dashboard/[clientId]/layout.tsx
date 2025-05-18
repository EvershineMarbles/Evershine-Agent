"use client"

import React from "react"
import { IconSidebar } from "@/components/icon-sidebar"
import Link from "next/link"
import { ArrowLeft, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

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
  // State for agent name
  const [agentName, setAgentName] = React.useState<string | null>(null)
  const [agentEmail, setAgentEmail] = React.useState<string | null>(null)

  // Load wishlist, cart counts, and agent info from localStorage
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

        // Get agent email from localStorage
        const email = localStorage.getItem("agentEmail")
        setAgentEmail(email)

        // Extract name from email (similar to code 2)
        if (email) {
          const name = email.split("@")[0]
          // Capitalize first letter and format name
          const formattedName = name.charAt(0).toUpperCase() + name.slice(1)
          setAgentName(formattedName)
        }
      } catch (e) {
        console.error("Error loading data from localStorage:", e)
      }
    }
  }, [])

  const handleLogout = () => {
    // Clear tokens and redirect to login
    if (typeof window !== "undefined") {
      localStorage.removeItem("agentToken")
      localStorage.removeItem("agentEmail")
      window.location.href = "/agent-login"
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top Navigation Strip */}
      <div className="w-full bg-[#194a95] text-white py-3 px-4 md:px-8 shadow-md z-0">
        <div className="ml-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium hidden sm:inline">Back to Consultant Dashboard</span>
          </Link>

          {/* Agent name on the right side */}
          <div className="flex items-center gap-4">
            <span className="text-sm md:text-base">{agentName || agentEmail}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-white hover:bg-white/20 hover:text-white"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
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
