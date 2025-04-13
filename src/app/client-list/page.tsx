'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fetchWithAuth } from '@/lib/auth'

interface Client {
  _id: string
  name: string
  mobile: string
  clientId: string
  quantityRequired: number
  profession: string
  purpose: string
  city: string
  email: string
  agentAffiliated: string
}

export default function ClientList() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const getClients = async () => {
      try {
        setLoading(true)
        const response = await fetchWithAuth('/api/agent/clients')
        const data = await response.json()
        
        if (data.data && Array.isArray(data.data)) {
          setClients(data.data)
        } else {
          setClients([])
        }
      } catch (err) {
        console.error('Error fetching clients:', err)
        setError('Failed to load clients. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    getClients()
  }, [])

  const handleCreateClient = () => {
    // Navigate to client creation page
    window.location.href = '/create-client'
  }

  const handleViewClient = (clientId: string) => {
    // Navigate to client details page
    window.location.href = `/client/${clientId}`
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <p>Loading clients...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[200px]">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Clients</h1>
        <Button onClick={handleCreateClient}>Create New Client</Button>
      </div>

      {clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">No clients found</p>
          <Button onClick={handleCreateClient}>Create Your First Client</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => (
            <Card key={client._id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle>{client.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><span className="font-medium">Mobile:</span> {client.mobile}</p>
                  {client.email && <p><span className="font-medium">Email:</span> {client.email}</p>}
                  {client.city && <p><span className="font-medium">City:</span> {client.city}</p>}
                  {client.profession && <p><span className="font-medium">Profession:</span> {client.profession}</p>}
                  <Button 
                    variant="outline" 
                    className="w-full mt-4"
                    onClick={() => handleViewClient(client.clientId)}
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
