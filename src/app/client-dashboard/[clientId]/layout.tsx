"use client"

import React from "react"
import { IconSidebar } from "@/components/icon-sidebar"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

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

  return (
    <div className="flex h-screen bg-gray-50">
      <IconSidebar clientId={clientId} />
      <main className="flex-1 ml-16 overflow-auto">
        <div className="p-4 border-b bg-white">
          <Link href="/dashboard" className="inline-flex items-center text-dark hover:underline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Back to Home</span>
            <span className="sm:hidden">Home</span>
          </Link>
        </div>
        {children}
      </main>
    </div>
  )
}
