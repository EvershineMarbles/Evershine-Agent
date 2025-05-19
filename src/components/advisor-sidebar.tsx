"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Users, QrCode, LogOut, UserCog } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Image from "next/image"

export function AdvisorSidebar() {
  const pathname = usePathname()

  const routes = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
    },
    {
      name: " Register A Client",
      href: "/register-client",
      icon: Users,
    },
    {
      name: "Client List",
      href: "/dashboard/client-list",
      icon: UserCog,
    },
    {
      name: "Scan QR",
      href: "/dashboard/scan-qr",
      icon: QrCode,
    },
  ]

  return (
    <div className="fixed top-0 left-0 h-screen w-16 flex flex-col bg-dark text-white shadow-lg">
      <div className="sidebar-icon mt-4">
        A
      </div>

      <hr className="sidebar-hr my-2" />

      <TooltipProvider>
        {routes.map((route) => (
          <Tooltip key={route.href}>
            <TooltipTrigger asChild>
              <Link
                href={route.href}
                className={cn(
                  "sidebar-icon",
                  pathname === route.href || pathname.startsWith(route.href + "/") ? "bg-blue" : "",
                )}
              >
                <route.icon size={24} />
                <span className="sidebar-tooltip">{route.name}</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">{route.name}</TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>

      <div className="mt-auto mb-4">
        <hr className="sidebar-hr my-2" />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/agent-login" className="sidebar-icon">
                <LogOut size={24} />
                <span className="sidebar-tooltip">Logout</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">Logout</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  )
}
