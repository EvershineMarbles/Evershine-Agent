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
    <div className="flex-1 bg-white">
      <header className="p-4 border-b">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <h1 className="text-2xl font-bold">Welcome, Mr. Ankit</h1>
          <div className="relative w-full sm:w-[300px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input type="text" placeholder="Search..." className="pl-10 py-2 h-10 text-sm border rounded-full" />
          </div>
        </div>
      </header>

      <main className="p-4">
        {/* Stats Cards - Now in a responsive grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link href="/admin/dashboard/all-clients">
            <Card className="border rounded-xl overflow-hidden cursor-pointer hover:shadow-lg hover:border-[#1e4b9a] transition-all h-full">
              <CardContent className="p-6 flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                  <Users className="h-8 w-8 text-[#1e4b9a]" />
                </div>
                <h2 className="text-lg font-semibold text-center mb-1">Total Clients</h2>
                <p className="text-4xl font-bold text-[#1e4b9a]">{stats.clients}</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/dashboard/agents">
            <Card className="border rounded-xl overflow-hidden cursor-pointer hover:shadow-lg hover:border-[#1e4b9a] transition-all h-full">
              <CardContent className="p-6 flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-3">
                  <UserCheck className="h-8 w-8 text-[#1e4b9a]" />
                </div>
                <h2 className="text-lg font-semibold text-center mb-1">Active Agents</h2>
                <p className="text-4xl font-bold text-[#1e4b9a]">{stats.agents}</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/dashboard/products">
            <Card className="border rounded-xl overflow-hidden cursor-pointer hover:shadow-lg hover:border-[#1e4b9a] transition-all h-full">
              <CardContent className="p-6 flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-3">
                  <Package className="h-8 w-8 text-[#1e4b9a]" />
                </div>
                <h2 className="text-lg font-semibold text-center mb-1">Products</h2>
                <p className="text-4xl font-bold text-[#1e4b9a]">{stats.products}</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/dashboard/followups">
            <Card className="border rounded-xl overflow-hidden cursor-pointer hover:shadow-lg hover:border-[#1e4b9a] transition-all h-full">
              <CardContent className="p-6 flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-3">
                  <Clock className="h-8 w-8 text-[#1e4b9a]" />
                </div>
                <h2 className="text-lg font-semibold text-center mb-1">Follow-ups</h2>
                <p className="text-4xl font-bold text-[#1e4b9a]">{stats.followups}</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Action Buttons - Now in a responsive grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          <Link href="/admin/dashboard/agents" className="w-full">
            <Button className="bg-[#1e4b9a] hover:bg-[#1e4b9a]/90 text-white h-10 text-sm font-medium w-full rounded-md">
              Consultants
            </Button>
          </Link>

          <Link href="/admin/dashboard/all-clients" className="w-full">
            <Button className="bg-[#1e4b9a] hover:bg-[#1e4b9a]/90 text-white h-10 text-sm font-medium w-full rounded-md">
              Client List
            </Button>
          </Link>

          <Link href="/scan-qr" className="w-full">
            <Button className="bg-[#1e4b9a] hover:bg-[#1e4b9a]/90 text-white h-10 text-sm font-medium w-full rounded-md">
              Scan QR Code
            </Button>
          </Link>

    

          <Link href="/admin/dashboard/global-commission" className="w-full">
            <Button className="bg-[#1e4b9a] hover:bg-[#1e4b9a]/90 text-white h-10 text-sm font-medium w-full rounded-md">
              Change Standard Pricing
            </Button>
          </Link>

          <Link href="../register-client" className="w-full">
            <Button className="bg-[#1e4b9a] hover:bg-[#1e4b9a]/90 text-white h-10 text-sm font-medium w-full rounded-md">
              New Client
            </Button>
          </Link>

          <Link href="/admin/dashboard/followups" className="w-full">
            <Button className="bg-[#1e4b9a] hover:bg-[#1e4b9a]/90 text-white h-10 text-sm font-medium w-full rounded-md">
              Follow-ups
            </Button>
          </Link>
        </div>

        {/* Erase All Data Button */}
        <div className="flex justify-center mt-6">
          <Button className="bg-red-600 hover:bg-red-700 text-white h-10 w-full max-w-md text-sm font-medium rounded-md">
            Erase All Data
          </Button>
        </div>
      </main>
    </div>
  )
}
