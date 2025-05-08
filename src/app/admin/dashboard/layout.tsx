"use client"

import type React from "react"
import { AdminSidebar } from "@/components/admin-sidebar"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top Navigation Strip */}
      <div className="w-full bg-[#194a95] text-white py-3 px-4 md:px-8 shadow-md z-0">
        <div className="ml-16 flex items-center justify-between">
          <Link href="https://evershine-two.vercel.app/" className="flex items-center gap-2">
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium hidden sm:inline">Back to Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Main content with sidebar */}
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 ml-16 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
