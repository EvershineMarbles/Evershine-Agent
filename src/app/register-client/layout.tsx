"use client"

import type React from "react"

import { redirect } from "next/navigation"
import { isAgentAuthenticated } from "@/lib/auth-utils"
import { AdvisorSidebar } from "@/components/advisor-sidebar"

export default function RegisterClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check if agent is authenticated
  if (!isAgentAuthenticated()) {
    redirect("/agent-login")
  }

  // Get agent info from localStorage (client-side only)
  let agentName = ""
  let agentEmail = ""

  if (typeof window !== "undefined") {
    agentName = localStorage.getItem("agentName") || ""
    agentEmail = localStorage.getItem("agentEmail") || ""
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <AdvisorSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <header className="bg-white shadow-sm z-10">
          <div className="flex items-center justify-between p-4">
            <h1 className="text-xl font-semibold text-gray-800">Register New Client</h1>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{agentName}</p>
                <p className="text-xs text-gray-500">{agentEmail}</p>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem("agentToken")
                  localStorage.removeItem("agentName")
                  localStorage.removeItem("agentEmail")
                  window.location.href = "/agent-login"
                }}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4">{children}</main>
      </div>
    </div>
  )
}
