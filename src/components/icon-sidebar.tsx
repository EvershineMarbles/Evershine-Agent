"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, ShoppingCart, Heart, QrCode, Package, Settings, LogOut, User } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface IconSidebarProps {
  clientId: string
}

export function IconSidebar({ clientId }: IconSidebarProps) {
  const pathname = usePathname()

  const routes = [
    {
      name: "Dashboard",
      href: `/client-dashboard/${clientId}`,
      icon: Home,
    },
    {
      name: "Products",
      href: `/client-dashboard/${clientId}/products`,
      icon: Package,
    },
    {
      name: "Scan Products",
      href: `/client-dashboard/${clientId}/scan`,
      icon: QrCode,
    },
    {
      name: "Wishlist",
      href: `/client-dashboard/${clientId}/wishlist`,
      icon: Heart,
    },
    {
      name: "Cart",
      href: `/client-dashboard/${clientId}/cart`,
      icon: ShoppingCart,
    },
    {
      name: "Settings",
      href: `/client-dashboard/${clientId}/settings`,
      icon: Settings,
    },
  ]

  return (
    <div className="fixed top-0 left-0 h-screen w-16 flex flex-col bg-dark text-white shadow-lg">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="sidebar-icon mt-4">
              <User size={24} />
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="z-[9999]">
            Profile
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <hr className="sidebar-hr my-2" />

      <TooltipProvider>
        {routes.map((route) => (
          <Tooltip key={route.href}>
            <TooltipTrigger asChild>
              <Link href={route.href} className={cn("sidebar-icon", pathname === route.href ? "bg-blue" : "")}>
                <route.icon size={24} />
                <span className="sidebar-tooltip z-[9999]">{route.name}</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="z-[9999]">
              {route.name}
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>

      <div className="mt-auto mb-4">
        <hr className="sidebar-hr my-2" />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/" className="sidebar-icon">
                <LogOut size={24} />
                <span className="sidebar-tooltip z-[9999]">Logout</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="z-[9999]">
              Logout
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  )
}
