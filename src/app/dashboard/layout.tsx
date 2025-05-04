"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { AdvisorSidebar } from "@/components/advisor-sidebar"
import { isAgentAuthenticated, clearAllTokens } from "@/lib/auth-utils"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [agentEmail, setAgentEmail] = useState<string | null>(null)
  const [agentName, setAgentName] = useState<string | null>(null)

  useEffect(() => {
    // Check if agent is logged in
    if (!isAgentAuthenticated()) {
      router.push("/agent-login")
      return
    }

    // Fetch agent email from localStorage
    const email = localStorage.getItem("agentEmail")
    setAgentEmail(email)

    // Extract name from email (for demo purposes)
    if (email) {
      const name = email.split("@")[0]
      // Capitalize first letter and format name
      const formattedName = name.charAt(0).toUpperCase() + name.slice(1)
      setAgentName(formattedName)
    }
  }, [router])

  const handleLogout = () => {
    clearAllTokens()
    router.push("/agent-login")
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Add the sidebar */}
      <AdvisorSidebar />

      {/* Adjust the main content to make room for the sidebar */}
      <div className="ml-16">
        {/* Blue strip at the top */}
        <div className="w-full bg-[#194a95] text-white py-4 px-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Image src="/logo2.png" alt="Evershine Logo" width={80} height={30} />
              <h1 className="text-xl font-semibold">Consultant Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm md:text-base">Welcome, {agentName || agentEmail}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-white hover:bg-white/20 hover:text-white"
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="container mx-auto py-6 px-4 flex-1">{children}</main>
      </div>
    </div>
  )
}
