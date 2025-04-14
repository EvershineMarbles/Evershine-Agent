"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"

const ClientDashboard = () => {
  const { clientId } = useParams()
  const [clientName, setClientName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchClientData = async () => {
      setLoading(true)
      try {
        // Replace with your actual API endpoint
        const response = await fetch(`/api/clients/${clientId}`)

        if (!response.ok) {
          throw new Error(`Failed to fetch client data: ${response.status}`)
        }

        const data = await response.json()
        setClientName(data.name) // Assuming the API returns a 'name' field
      } catch (err: any) {
        setError(err.message || "An error occurred while fetching client data.")
      } finally {
        setLoading(false)
      }
    }

    if (clientId) {
      fetchClientData()
    } else {
      setError("Client ID is missing.")
      setLoading(false)
    }
  }, [clientId])

  if (loading) {
    return <div>Loading client data...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8">Welcome to {clientName || "Client"}&apos;s Dashboard</h1>
      <p>Client ID: {clientId}</p>
      {/* Add more client-specific content here */}
    </div>
  )
}

export default ClientDashboard
