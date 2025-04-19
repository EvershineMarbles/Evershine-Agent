"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, ShoppingCart, Heart, QrCode, Package, Settings, LogOut, User } from "lucide-react"
import { useState } from "react"

interface IconSidebarProps {
  clientId: string
}

export function IconSidebar({ clientId }: IconSidebarProps) {
  const pathname = usePathname()
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null)

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

  // Inline styles with !important to override everything
  const tooltipStyle = {
    position: "fixed" as const,
    left: "70px",
    backgroundColor: "#202225",
    color: "white",
    padding: "8px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "bold",
    zIndex: 99999,
    boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
  }

  return (
    <div className="fixed top-0 left-0 h-screen w-16 flex flex-col bg-dark text-white shadow-lg">
      <div
        className="flex items-center justify-center h-12 w-12 mt-4 mx-auto bg-dark hover:bg-blue rounded-xl cursor-pointer"
        onMouseEnter={() => setActiveTooltip("profile")}
        onMouseLeave={() => setActiveTooltip(null)}
      >
        <User size={24} />
        {activeTooltip === "profile" && <div style={tooltipStyle}>Profile</div>}
      </div>

      <hr className="my-2 border-gray-700" />

      {routes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className={cn(
            "flex items-center justify-center h-12 w-12 mt-2 mb-2 mx-auto rounded-xl cursor-pointer",
            pathname === route.href ? "bg-blue" : "bg-dark hover:bg-blue",
          )}
          onMouseEnter={() => setActiveTooltip(route.href)}
          onMouseLeave={() => setActiveTooltip(null)}
        >
          <route.icon size={24} />
          {activeTooltip === route.href && <div style={tooltipStyle}>{route.name}</div>}
        </Link>
      ))}

      <div className="mt-auto mb-4">
        <hr className="my-2 border-gray-700" />
        <Link
          href="/"
          className="flex items-center justify-center h-12 w-12 mx-auto bg-dark hover:bg-blue rounded-xl cursor-pointer"
          onMouseEnter={() => setActiveTooltip("logout")}
          onMouseLeave={() => setActiveTooltip(null)}
        >
          <LogOut size={24} />
          {activeTooltip === "logout" && <div style={tooltipStyle}>Logout</div>}
        </Link>
      </div>
    </div>
  )
}
