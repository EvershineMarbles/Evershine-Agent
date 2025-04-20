"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, UserPlus, Loader2, MoreHorizontal, Users } from "lucide-react"

interface Client {
  _id: string
  name: string
  mobile: string
  email?: string
  city?: string
  profession?: string
  agentName: string
  createdAt: string
}

export default function AllClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    // Fetch clients
    const fetchClients = async () => {
      try {
        // In a real app, you would fetch this data from your API
        // For now, we'll use mock data
        const mockClients: Client[] = [
          {
            _id: "1",
            name: "Vikram Mehta",
            mobile: "9876543210",
            email: "vikram.mehta@example.com",
            city: "Mumbai",
            profession: "Architect",
            agentName: "Rahul Sharma",
            createdAt: "2023-01-15",
          },
          {
            _id: "2",
            name: "Ananya Desai",
            mobile: "8765432109",
            email: "ananya.desai@example.com",
            city: "Delhi",
            profession: "Builder",
            agentName: "Priya Patel",
            createdAt: "2023-02-20",
          },
          {
            _id: "3",
            name: "Rajesh Kumar",
            mobile: "7654321098",
            city: "Bangalore",
            profession: "Contractor",
            agentName: "Amit Singh",
            createdAt: "2023-03-10",
          },
          {
            _id: "4",
            name: "Meera Joshi",
            mobile: "6543210987",
            email: "meera.joshi@example.com",
            city: "Pune",
            profession: "Interior Designer",
            agentName: "Neha Gupta",
            createdAt: "2023-01-05",
          },
        ]

        setClients(mockClients)
      } catch (error) {
        console.error("Error fetching clients:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchClients()
  }, [])

  // Filter clients based on search query
  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.mobile.includes(searchQuery) ||
      (client.email && client.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (client.city && client.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (client.profession && client.profession.toLowerCase().includes(searchQuery.toLowerCase())) ||
      client.agentName.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">All Clients</h1>
        <Button className="bg-blue hover:bg-blue/90">
          <UserPlus className="h-4 w-4 mr-2" />
          Add New Client
        </Button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          placeholder="Search clients by name, mobile, email, city, profession or advisor..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredClients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-xl font-medium mb-2">No clients found</p>
            <p className="text-muted-foreground mb-6">
              {searchQuery ? "Try a different search term" : "Add your first client to get started"}
            </p>
            <Button className="bg-blue hover:bg-blue/90">
              <UserPlus className="h-4 w-4 mr-2" />
              Add New Client
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Name</th>
                    <th className="text-left py-3 px-4">Mobile</th>
                    <th className="text-left py-3 px-4">Email</th>
                    <th className="text-left py-3 px-4">City</th>
                    <th className="text-left py-3 px-4">Profession</th>
                    <th className="text-left py-3 px-4">Advisor</th>
                    <th className="text-center py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => (
                    <tr key={client._id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{client.name}</td>
                      <td className="py-3 px-4">{client.mobile}</td>
                      <td className="py-3 px-4">{client.email || "-"}</td>
                      <td className="py-3 px-4">{client.city || "-"}</td>
                      <td className="py-3 px-4">{client.profession || "-"}</td>
                      <td className="py-3 px-4">{client.agentName}</td>
                      <td className="py-3 px-4 text-center">
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-5 w-5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
