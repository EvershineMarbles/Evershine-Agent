"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Users, Package, LogOut, UserCog, QrCode } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function AdminSidebar() {
  const pathname = usePathname()

  const routes = [
    {
      name: "Dashboard",
      href: "/admin/dashboard",
      icon: Home,
    },
    {
      name: "Consultant",
      href: "/admin/dashboard/agents",
      icon: UserCog,
    },
    {
      name: "Clients",
      href: "/admin/dashboard/all-clients",
      icon: Users,
    },
    {
      name: "Products",
      href: "/admin/dashboard/products",
      icon: Package,
    },
    {
      name: "Scan QR",
      href: "/admin/dashboard/scan-qr",
      icon: QrCode,
    },
  ]

  return (
    <div className="fixed top-0 left-0 h-screen w-16 flex flex-col bg-dark text-white shadow-lg z-10">
      <div className="sidebar-icon mt-4">
        <span className="text-xl font-bold">A</span>
      </div>

      <hr className="sidebar-hr my-2" />

      <div className="flex-1 flex flex-col overflow-y-auto">
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
      </div>

      {/* Logout button in a fixed position at the bottom */}
      <div className="sticky bottom-0 w-full bg-dark pb-4 pt-2">
        <hr className="sidebar-hr mb-2" />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/admin/login" className="sidebar-icon">
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
