"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { UserPlus, Users, QrCode, ShoppingBag, LogOut } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { clearAllTokens } from "@/lib/auth-utils"
import { useRouter } from "next/navigation"

export function AdvisorSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const routes = [
    {
      name: "Register New Client",
      href: "/register-client",
      icon: UserPlus,
    },
    {
      name: "Client List",
      href: "/client-list",
      icon: Users,
    },
    {
      name: "Scan QR",
      href: "/scan-qr",
      icon: QrCode,
    },
    {
      name: "Active Orders",
      href: "/reminders",
      icon: ShoppingBag,
    },
  ]

  const handleLogout = () => {
    clearAllTokens()
    router.push("/agent-login")
  }

  return (
    <div className="fixed top-0 left-0 h-screen w-16 flex flex-col bg-[#194a95] text-white shadow-lg">
      <div className="sidebar-icon mt-4">
        <span className="text-xl font-bold">E</span>
      </div>

      <hr className="sidebar-hr my-2 border-white/20" />

      <TooltipProvider>
        {routes.map((route) => (
          <Tooltip key={route.href}>
            <TooltipTrigger asChild>
              <Link
                href={route.href}
                className={cn(
                  "sidebar-icon group flex h-12 w-12 mx-auto my-2 items-center justify-center rounded-md transition-all hover:bg-white/20",
                  pathname === route.href || pathname.startsWith(route.href + "/")
                    ? "bg-white/30 text-white"
                    : "text-white/80",
                )}
              >
                <route.icon size={24} />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">{route.name}</TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>

      <div className="mt-auto mb-4">
        <hr className="sidebar-hr my-2 border-white/20" />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleLogout}
                className="sidebar-icon group flex h-12 w-12 mx-auto my-2 items-center justify-center rounded-md transition-all hover:bg-white/20 text-white/80"
              >
                <LogOut size={24} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Logout</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  )
}
