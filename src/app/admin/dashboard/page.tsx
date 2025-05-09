"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Search, Users, Package, UserCheck, Clock } from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export default function AdminDashboard() {
  // Static data - no API calls
  const stats = {
    clients: 5,
    agents: 4,
    products: 172,
    followups: 200,
  }

  return (
    <div className="flex-1 bg-white h-screen flex flex-col">
      <header className="py-3 px-4 border-b">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">Welcome, Mr. Ankit</h1>
          <div className="relative w-[300px]">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input type="text" placeholder="Search..." className="pl-8 py-1 h-8 text-sm" />
          </div>
        </div>
      </header>

      <main className="p-4 flex-1 overflow-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <Link href="/admin/dashboard/all-clients">
            <Card className="border rounded-lg overflow-hidden cursor-pointer hover:border-[#1e4b9a] hover:shadow-sm transition-all h-full">
              <CardContent className="p-3 flex items-center">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                  <Users className="h-5 w-5 text-[#1e4b9a]" />
                </div>
                <div>
                  <h2 className="text-sm font-medium">Total Clients</h2>
                  <p className="text-xl font-bold text-[#1e4b9a]">{stats.clients}</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/dashboard/agents">
            <Card className="border rounded-lg overflow-hidden cursor-pointer hover:border-[#1e4b9a] hover:shadow-sm transition-all h-full">
              <CardContent className="p-3 flex items-center">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                  <UserCheck className="h-5 w-5 text-[#1e4b9a]" />
                </div>
                <div>
                  <h2 className="text-sm font-medium">Sales Agents</h2>
                  <p className="text-xl font-bold text-[#1e4b9a]">{stats.agents}</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/dashboard/products">
            <Card className="border rounded-lg overflow-hidden cursor-pointer hover:border-[#1e4b9a] hover:shadow-sm transition-all h-full">
              <CardContent className="p-3 flex items-center">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                  <Package className="h-5 w-5 text-[#1e4b9a]" />
                </div>
                <div>
                  <h2 className="text-sm font-medium">Products</h2>
                  <p className="text-xl font-bold text-[#1e4b9a]">{stats.products}</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/dashboard/followups">
            <Card className="border rounded-lg overflow-hidden cursor-pointer hover:border-[#1e4b9a] hover:shadow-sm transition-all h-full">
              <CardContent className="p-3 flex items-center">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mr-3">
                  <Clock className="h-5 w-5 text-[#1e4b9a]" />
                </div>
                <div>
                  <h2 className="text-sm font-medium">Follow-ups</h2>
                  <p className="text-xl font-bold text-[#1e4b9a]">{stats.followups}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Action Buttons - All in one grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
          <Link href="/admin/dashboard/agents" className="w-full">
            <Button className="bg-[#1e4b9a] hover:bg-[#1e4b9a]/90 text-white h-9 text-sm w-full">Consultants</Button>
          </Link>

          <Link href="/admin/dashboard/all-clients" className="w-full">
            <Button className="bg-[#1e4b9a] hover:bg-[#1e4b9a]/90 text-white h-9 text-sm w-full">Client List</Button>
          </Link>

          <Link href="/scan-qr" className="w-full">
            <Button className="bg-[#1e4b9a] hover:bg-[#1e4b9a]/90 text-white h-9 text-sm w-full">Scan QR Code</Button>
          </Link>

          <Link href="/admin/dashboard/followups" className="w-full">
            <Button className="bg-[#1e4b9a] hover:bg-[#1e4b9a]/90 text-white h-9 text-sm w-full">
              Follow-up Reminders
            </Button>
          </Link>

          <Link href="/admin/products/pricing" className="w-full">
            <Button className="bg-[#1e4b9a] hover:bg-[#1e4b9a]/90 text-white h-9 text-sm w-full">Change Pricing</Button>
          </Link>

          <Link href="../register-client" className="w-full">
            <Button className="bg-[#1e4b9a] hover:bg-[#1e4b9a]/90 text-white h-9 text-sm w-full">
              Register Client
            </Button>
          </Link>
        </div>

        {/* Erase All Data Button */}
        <div className="flex justify-center">
          <Button className="bg-red-600 hover:bg-red-700 text-white h-9 text-sm w-full max-w-xs">Erase All Data</Button>
        </div>
      </main>
    </div>
  )
}
