"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Search, User, Phone } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Image from "next/image"

// Mock client data
const clients = [
  { id: 1, name: "Rahul Sharma", mobile: "9876543210", lastOrder: "2023-03-15" },
  { id: 2, name: "Priya Patel", mobile: "8765432109", lastOrder: "2023-03-10" },
  { id: 3, name: "Amit Singh", mobile: "7654321098", lastOrder: "2023-03-05" },
  { id: 4, name: "Neha Gupta", mobile: "6543210987", lastOrder: "2023-02-28" },
  { id: 5, name: "Vikram Mehta", mobile: "5432109876", lastOrder: "2023-02-20" },
  { id: 6, name: "Ananya Reddy", mobile: "4321098765", lastOrder: "2023-02-15" },
  { id: 7, name: "Rajesh Kumar", mobile: "3210987654", lastOrder: "2023-02-10" },
  { id: 8, name: "Sunita Joshi", mobile: "2109876543", lastOrder: "2023-02-05" },
]

export default function ClientListPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")

  const filteredClients = clients.filter(
    (client) => client.name.toLowerCase().includes(searchTerm.toLowerCase()) || client.mobile.includes(searchTerm),
  )

  const handleClientSelect = (clientName: string) => {
    // Convert client name to URL-friendly format
    const clientId = clientName.toLowerCase().replace(/\s+/g, "-")
    router.push(`/client-dashboard/${clientId}`)
  }

  return (
    <div className="min-h-screen p-6 md:p-12 bg-gray-50">
      <div className="flex flex-col items-center relative mb-8">
        <Link href="/" className="absolute left-6 md:left-12 top-6 inline-flex items-center text-dark hover:underline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
        <Image src="/logo.png" alt="Evershine Logo" width={180} height={100} priority className="mt-8" />
      </div>

      <h2 className="text-3xl font-bold mb-6 text-center">All Clients</h2>

      <div className="relative max-w-md mx-auto mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search clients by name or mobile number"
          className="pl-10 h-12"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {filteredClients.map((client) => (
          <Card
            key={client.id}
            className="cursor-pointer hover:border-blue transition-colors"
            onClick={() => handleClientSelect(client.name)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{client.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-muted-foreground mb-2">
                <Phone className="h-4 w-4 mr-2" />
                {client.mobile}
              </div>
              <div className="flex items-center text-muted-foreground">
                <User className="h-4 w-4 mr-2" />
                Last Order: {new Date(client.lastOrder).toLocaleDateString()}
              </div>
              <Button className="w-full mt-4 bg-blue hover:bg-blue/90">View Dashboard</Button>
            </CardContent>
          </Card>
        ))}

        {filteredClients.length === 0 && (
          <div className="col-span-full text-center py-12">
            <h2 className="text-xl font-medium mb-4">No clients found</h2>
            <p className="text-muted-foreground mb-6">Try a different search term or register a new client</p>
            <Link href="/register-client">
              <Button className="bg-coral hover:bg-coral/90">Register New Client</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

