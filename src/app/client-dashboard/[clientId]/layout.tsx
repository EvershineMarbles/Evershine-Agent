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
   
        </div>
        {children}
      </main>
    </div>
  )
}

