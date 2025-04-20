"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Users, Package, LogOut, UserCog } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function AdminSidebar() {
  const pathname = usePathname()

  const routes = [
    {
      name: "Dashboard",
      href: "/admin",
      icon: Home,
    },
    {
      name: "Advisors",
      href: "/admin/agents",
      icon: UserCog,
    },
    {
      name: "Clients",
      href: "/admin/all-clients",
      icon: Users,
    },
    {
      name: "Products",
      href: "/admin/products",
      icon: Package,
    },
  ]

  return (
    <div className="fixed top-0 left-0 h-screen w-16 flex flex-col bg-dark text-white shadow-lg">
      <div className="sidebar-icon mt-4">
        <span className="text-xl font-bold">A</span>
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
              <Link href="/login" className="sidebar-icon">
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
