"use client"

import { useState, useEffect } from "react"
import { Loader2, RefreshCw } from "lucide-react"

// Simple interface for commission data
interface CommissionData {
  agentId: string
  name: string
  email: string
  commissionRate: number
  categoryCommissions?: Record<string, number>
}

export default function ProductsPage() {
  const [loading, setLoading] = useState(true)
  const [commissionData, setCommissionData] = useState<CommissionData | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Function to fetch agent commission data
  const fetchCommissionData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Get the token for authorization
      const token = localStorage.getItem("clientImpersonationToken")
      if (!token) {
        setError("No authentication token found")
        setLoading(false)
        return
      }

      // Fetch agent commission from the endpoint
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://evershinebackend-2.onrender.com"
      const response = await fetch(`${apiUrl}/api/client/agent-commission`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()

      if (data.success && data.data) {
        setCommissionData(data.data)
      } else {
        throw new Error("Invalid response format")
      }
    } catch (error: any) {
      setError(error.message || "Failed to fetch commission data")
      console.error("Error fetching commission data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch data on component mount
  useEffect(() => {
    fetchCommissionData()
  }, [])

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Agent Commission Information</h1>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mr-2" />
          <p>Loading commission data...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-700 font-medium">Error:</p>
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchCommissionData}
            className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            Try Again
          </button>
        </div>
      ) : commissionData ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-blue-800">Agent Details</h2>
            <p>
              <span className="font-medium">Name:</span> {commissionData.name}
            </p>
            <p>
              <span className="font-medium">Email:</span> {commissionData.email}
            </p>
            <p>
              <span className="font-medium">Agent ID:</span> {commissionData.agentId}
            </p>
          </div>

          <div className="mb-4">
            <h2 className="text-lg font-semibold text-green-800">Commission Rate</h2>
            <p className="text-2xl font-bold text-green-700">{commissionData.commissionRate}%</p>
          </div>

          {commissionData.categoryCommissions && Object.keys(commissionData.categoryCommissions).length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-blue-800">Category-specific Rates</h2>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {Object.entries(commissionData.categoryCommissions).map(([category, rate]) => (
                  <div key={category} className="bg-white p-2 rounded">
                    <p className="font-medium">{category}:</p>
                    <p className="text-green-700 font-bold">{rate}%</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={fetchCommissionData}
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Data
          </button>
        </div>
      ) : (
        <p>No commission data available</p>
      )}
    </div>
  )
}
