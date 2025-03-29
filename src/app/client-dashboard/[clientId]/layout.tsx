// Change the layout component to handle async params

import type React from "react"
import { IconSidebar } from "@/components/icon-sidebar"

export default async function ClientDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ clientId: string }>
}) {
  const resolvedParams = await params

  return (
    <div className="flex min-h-screen">
      <IconSidebar clientId={resolvedParams.clientId} />
      <main className="flex-1 bg-gray-50">{children}</main>
    </div>
  )
}

