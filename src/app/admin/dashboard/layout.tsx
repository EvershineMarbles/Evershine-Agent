"use client"

import type React from "react"
import { AdminSidebar } from "@/components/admin-sidebar"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if admin is logged in
    const isAdminAuthenticated = localStorage.getItem("adminToken") !== null

    if (!isAdminAuthenticated) {
      // Redirect to login page if not authenticated
      router.push("/login")
      return
    }

    setIsLoading(false)
  }, [router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue"></div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 ml-16 overflow-auto">
        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  )
}
