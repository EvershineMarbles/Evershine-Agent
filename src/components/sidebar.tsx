"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, ShoppingCart, Heart, QrCode, Package, Settings, LogOut, User, PackageSearch } from "lucide-react"

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
      name: "Past Orders",
      href: `/client-dashboard/${clientId}/past-orders`,
      icon: PackageSearch,
    },
    {
      name: "Settings",
      href: `/client-dashboard/${clientId}/settings`,
      icon: Settings,
    },
  ]

  return (
    <div className="fixed top-0 left-0 h-screen w-16 flex flex-col bg-dark text-white shadow-lg">
      <div className="sidebar-icon mt-4 relative group">
      
      </div>

      <hr className="sidebar-hr my-2" />

      {routes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className={cn("sidebar-icon relative group", pathname === route.href ? "bg-blue" : "")}
        >
          <route.icon size={24} />
          <div className="tooltip-wrapper">{route.name}</div>
        </Link>
      ))}

      <div className="mt-auto mb-4">
        <hr className="sidebar-hr my-2" />
        <Link href="/dashboard" className="sidebar-icon relative group">
          <LogOut size={24} />
          <div className="tooltip-wrapper">Logout</div>
        </Link>
      </div>
    </div>
  )
}
