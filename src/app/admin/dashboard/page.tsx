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
      <header className="p-6 border-b">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Welcome, Mr. Ankit</h1>
          <div className="relative w-[450px]">
         
          </div>
        </div>
      </header>

      <main className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link href="/admin/dashboard/all-clients">
            <div className="group h-full">
              <Card className="border-2 rounded-3xl overflow-hidden cursor-pointer group-hover:shadow-lg group-hover:border-[#1e4b9a] transition-all h-full">
                <CardContent className="p-6 flex flex-col items-center justify-center min-h-[150px]">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                    <Users className="h-8 w-8 text-[#1e4b9a]" />
                  </div>
                  <h2 className="text-2xl font-semibold text-center">Total Clients</h2>
                  <p className="text-4xl font-bold mt-2 text-[#1e4b9a]">{stats.clients}</p>
                  <p className="text-sm text-blue-600 mt-2 group-hover:underline">View all clients →</p>
                </CardContent>
              </Card>
            </div>
          </Link>

          <Link href="/admin/dashboard/agents">
            <div className="group h-full">
              <Card className="border-2 rounded-3xl overflow-hidden cursor-pointer group-hover:shadow-lg group-hover:border-[#1e4b9a] transition-all h-full">
                <CardContent className="p-6 flex flex-col items-center justify-center min-h-[150px]">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                    <UserCheck className="h-8 w-8 text-[#1e4b9a]" />
                  </div>
                  <h2 className="text-2xl font-semibold text-center">Active Sales Agents</h2>
                  <p className="text-4xl font-bold mt-2 text-[#1e4b9a]">{stats.agents}</p>
                  <p className="text-sm text-blue-600 mt-2 group-hover:underline">View all agents →</p>
                </CardContent>
              </Card>
            </div>
          </Link>

          <Link href="/admin/dashboard/products">
            <div className="group h-full">
              <Card className="border-2 rounded-3xl overflow-hidden cursor-pointer group-hover:shadow-lg group-hover:border-[#1e4b9a] transition-all h-full">
                <CardContent className="p-6 flex flex-col items-center justify-center min-h-[150px]">
                  <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                    <Package className="h-8 w-8 text-[#1e4b9a]" />
                  </div>
                  <h2 className="text-2xl font-semibold text-center">Products Available</h2>
                  <p className="text-4xl font-bold mt-2 text-[#1e4b9a]">{stats.products}</p>
                  <p className="text-sm text-blue-600 mt-2 group-hover:underline">View all products →</p>
                </CardContent>
              </Card>
            </div>
          </Link>

          <Link href="/admin/dashboard/followups">
            <div className="group h-full">
              <Card className="border-2 rounded-3xl overflow-hidden cursor-pointer group-hover:shadow-lg group-hover:border-[#1e4b9a] transition-all h-full">
                <CardContent className="p-6 flex flex-col items-center justify-center min-h-[150px]">
                  <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4 group-hover:bg-amber-200 transition-colors">
                    <Clock className="h-8 w-8 text-[#1e4b9a]" />
                  </div>
                  <h2 className="text-2xl font-semibold text-center">Pending Follow-ups</h2>
                  <p className="text-4xl font-bold mt-2 text-[#1e4b9a]">{stats.followups}</p>
                  <p className="text-sm text-blue-600 mt-2 group-hover:underline">View all follow-ups →</p>
                </CardContent>
              </Card>
            </div>
          </Link>
        </div>

        {/* Action Buttons - First Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Link href="/admin/dashboard/agents" className="w-full">
            <Button className="bg-[#1e4b9a] hover:bg-[#1e4b9a]/90 text-white h-12 text-lg font-normal w-full rounded-md">
              Consultants
            </Button>
          </Link>

          <Link href="/admin/dashboard/all-clients" className="w-full">
            <Button className="bg-[#1e4b9a] hover:bg-[#1e4b9a]/90 text-white h-12 text-lg font-normal w-full rounded-md">
              Client List
            </Button>
          </Link>

          <Link href="/scan-qr" className="w-full">
            <Button className="bg-[#1e4b9a] hover:bg-[#1e4b9a]/90 text-white h-12 text-lg font-normal w-full rounded-md">
              Scan QR Code
            </Button>
          </Link>
        </div>

        {/* Action Buttons - Second Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link href="/admin/dashboard/followups" className="w-full">
            <Button className="bg-[#1e4b9a] hover:bg-[#1e4b9a]/90 text-white h-12 text-lg font-normal w-full rounded-md">
              Follow-up Reminders
            </Button>
          </Link>

          <Link href="/admin/products/pricing" className="w-full">
            <Button className="bg-[#1e4b9a] hover:bg-[#1e4b9a]/90 text-white h-12 text-lg font-normal w-full rounded-md">
              Change Standard Price
            </Button>
          </Link>

          <Link href="../register-client" className="w-full">
            <Button className="bg-[#1e4b9a] hover:bg-[#1e4b9a]/90 text-white h-12 text-lg font-normal w-full rounded-md">
              Register New Client
            </Button>
          </Link>
        </div>

        {/* Erase All Data Button */}
        <div className="flex justify-center">
          <Button className="bg-red-600 hover:bg-red-700 text-white h-12 w-full max-w-md text-lg font-normal rounded-md">
            Erase All Data
          </Button>
        </div>
      </main>
    </div>
  )
}
