"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { LogOut, User, Heart, ShoppingCart } from "lucide-react"
import { cn } from "@/lib/utils"

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)

    // Check authentication here if needed
    // If not authenticated, redirect to login
    // if (!isAuthenticated()) {
    //   router.push("/admin/login")
    // }
  }, [router])

  const handleLogout = () => {
    // Clear tokens or session
    // clearAdminTokens()
    router.push("/admin/login")
  }

  // Don't render anything during SSR to prevent hydration mismatch
  if (!isMounted) {
    return null
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-[125px] bg-black text-white flex flex-col">
        {/* Logo */}
        <div className="p-4 flex justify-center items-center">
          <Image src="/logo.png" alt="Evershine Logo" width={90} height={90} className="mb-6" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col items-center pt-8">
          <Link
            href="/admin/dashboard/agents"
            className={cn(
              "flex flex-col items-center justify-center w-full py-6 hover:bg-gray-900",
              pathname?.includes("/agents") ? "bg-gray-900" : "",
            )}
          >
            <User className="h-8 w-8 mb-2" />
            <span className="text-sm">Advisor</span>
          </Link>

          <Link
            href="/admin/dashboard/all-clients"
            className={cn(
              "flex flex-col items-center justify-center w-full py-6 hover:bg-gray-900",
              pathname?.includes("/all-clients") ? "bg-gray-900" : "",
            )}
          >
            <Heart className="h-8 w-8 mb-2" />
            <span className="text-sm">Client</span>
          </Link>

          <Link
            href="/admin/dashboard/products"
            className={cn(
              "flex flex-col items-center justify-center w-full py-6 hover:bg-gray-900",
              pathname?.includes("/products") ? "bg-gray-900" : "",
            )}
          >
            <ShoppingCart className="h-8 w-8 mb-2" />
            <span className="text-sm">Products</span>
          </Link>
        </nav>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center w-full py-6 hover:bg-gray-900 mt-auto mb-8"
        >
          <LogOut className="h-8 w-8 mb-2" />
          <span className="text-sm">Log out</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-white">{children}</div>
    </div>
  )
}
