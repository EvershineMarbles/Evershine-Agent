import type React from "react"
import { IconSidebar } from "@/components/icon-sidebar"

export default function ClientDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { clientId: string }
}) {
  return (
    <div className="flex min-h-screen">
      <IconSidebar clientId={params.clientId} />
      <main className="flex-1 bg-gray-50">{children}</main>
    </div>
  )
}

