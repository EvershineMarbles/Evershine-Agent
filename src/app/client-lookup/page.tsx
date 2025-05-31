"use client"

import { Suspense } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

// Import the client access component
function ClientLookupContent() {
  const router = useRouter()

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")} className="rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Client Lookup</h1>
        <p className="text-gray-600 mt-2">Search for existing clients or register new ones</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <h2 className="text-xl font-semibold mb-4">Quick Access</h2>
          <p className="text-gray-600 mb-4">Access client dashboard or register new clients</p>

          <div className="space-y-3">
            <Button className="w-full justify-start" variant="outline" onClick={() => router.push("/register-client")}>
              Register New Client
            </Button>

            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => router.push("/dashboard/client-list")}
            >
              View All Clients
            </Button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <h2 className="text-xl font-semibold mb-4">Recent Clients</h2>
          <p className="text-gray-600 mb-4">Your recently accessed clients</p>

          <div className="text-center py-8 text-gray-500">
            <p>Recent clients will appear here</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function ClientLookupLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading client lookup...</p>
      </div>
    </div>
  )
}

export default function ClientLookupPage() {
  return (
    <Suspense fallback={<ClientLookupLoading />}>
      <ClientLookupContent />
    </Suspense>
  )
}
