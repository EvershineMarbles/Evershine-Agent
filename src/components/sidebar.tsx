"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, ShoppingCart, Heart, QrCode, Package, Settings, LogOut } from "lucide-react"

interface SidebarProps {
  clientId: string
}

export function Sidebar({ clientId }: SidebarProps) {
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
    <div className="h-full w-64 bg-dark text-white flex flex-col">
      <div className="p-6">
        <h2 className="text-xl font-bold">Feeder</h2>
      </div>

      <nav className="flex-1 px-4 py-2">
        <ul className="space-y-2">
          {routes.map((route) => (
            <li key={route.href}>
              <Link
                href={route.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-white/10",
                  pathname === route.href ? "bg-white/20" : "transparent",
                )}
              >
                <route.icon className="h-5 w-5" />
                {route.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 mt-auto border-t border-white/10">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-white/10"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </Link>
      </div>
    </div>
  )
}

