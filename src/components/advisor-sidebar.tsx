"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, UserPlus, Users, QrCode, ShoppingBag, LogOut, ChevronRight, ChevronLeft, Menu } from "lucide-react"
import { clearAllTokens } from "@/lib/auth-utils"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export function AdvisorSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Check if we're on mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setCollapsed(true)
      }
    }

    // Initial check
    checkMobile()

    // Add resize listener
    window.addEventListener("resize", checkMobile)

    // Cleanup
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const routes = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
    },
    {
      name: "Register Client",
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

  // Mobile sidebar
  if (isMobile) {
    return (
      <>
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-50 text-white"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Menu className="h-6 w-6" />
        </Button>

        {isOpen && (
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsOpen(false)}>
            <div
              className="fixed top-0 left-0 h-full w-64 bg-[#194a95] text-white p-4 z-50"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Menu</h2>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-2">
                {routes.map((route) => (
                  <Link
                    key={route.href}
                    href={route.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-md transition-colors",
                      pathname === route.href
                        ? "bg-white/20 text-white"
                        : "text-white/80 hover:bg-white/10 hover:text-white",
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    <route.icon className="h-5 w-5" />
                    <span>{route.name}</span>
                  </Link>
                ))}

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 rounded-md transition-colors text-white/80 hover:bg-white/10 hover:text-white w-full text-left mt-6"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  // Desktop sidebar using shadcn/ui sidebar
  return (
    <SidebarProvider defaultOpen={!collapsed}>
      <Sidebar className="border-r border-gray-200 bg-white" side="left">
        <SidebarHeader className="p-4 flex justify-between items-center">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-[#194a95] flex items-center justify-center text-white font-bold">
              E
            </div>
            {!collapsed && <span className="ml-2 font-semibold">Evershine</span>}
          </div>
          <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)} className="text-gray-500">
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
        </SidebarHeader>

        <SidebarContent>
          <SidebarMenu>
            {routes.map((route) => (
              <SidebarMenuItem key={route.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === route.href}
                  className={cn(
                    "hover:bg-gray-100",
                    pathname === route.href && "bg-[#194a95]/10 text-[#194a95] font-medium",
                  )}
                >
                  <Link href={route.href}>
                    <route.icon className="h-5 w-5" />
                    {!collapsed && <span>{route.name}</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}

            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogout} className="hover:bg-gray-100 mt-4">
                <LogOut className="h-5 w-5 text-red-500" />
                {!collapsed && <span className="text-red-500">Logout</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>

        <SidebarTrigger className="hidden" />
      </Sidebar>
    </SidebarProvider>
  )
}
