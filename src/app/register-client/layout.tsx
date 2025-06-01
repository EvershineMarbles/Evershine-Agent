"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { LogOut } from 'lucide-react'
import { AdvisorSidebar } from "@/components/advisor-sidebar"
import { isAgentAuthenticated, clearAllTokens } from "@/lib/auth-utils"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [agentName, setAgentName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if agent is logged in
    if (!isAgentAuthenticated()) {
      router.push("/agent-login")
      return
    }

    // Get agent token for API call
    const token = localStorage.getItem("agentToken")
    
    // Fetch agent details from backend
    const fetchAgentDetails = async () => {
      try {
        // Call your existing endpoint
        const response = await fetch("/api/agent/commission-rate", {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          
          // Check if we got a successful response with agent name
          if (data.success && data.data && data.data.name) {
            // Use the real name from database
            setAgentName(data.data.name)
            console.log("✅ Agent name fetched:", data.data.name)
          } else {
            setAgentName("Agent")
          }
        } else {
          console.error("Failed to fetch agent details:", response.status)
          setAgentName("Agent")
        }
      } catch (error) {
        console.error("Error fetching agent details:", error)
        setAgentName("Agent")
      } finally {
        setIsLoading(false)
      }
    }
    
    // Call the fetch function if we have a token
    if (token) {
      fetchAgentDetails()
    } else {
      setAgentName("Agent")
      setIsLoading(false)
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