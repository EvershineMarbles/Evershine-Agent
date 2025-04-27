"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"

// Define interfaces
interface CommissionData {
  agentId: string
  name: string
  email: string
  commissionRate: number
  categoryCommissions?: Record<string, number>
}

interface Product {
  _id: string
  name: string
  price: number
  category: string
  image: string[]
  postId: string
  description: string
}

// Add these interfaces after the Product interface
interface Agent {
  agentId: string
  name: string
  email: string
  commissionRate: number
  categoryCommissions?: Record<string, number>
}

export default function ProductsPage() {
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  // Add this state after the other state declarations
  const [commissionData, setCommissionData] = useState<CommissionData | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Add this function to fetch agent commission data
  const fetchCommissionData = async () => {
    console.log("1. Starting to fetch agent commission data...")
    try {
      const token = localStorage.getItem("clientImpersonationToken")
      if (!token) {
        console.log("2. No authentication token found")
        setError("No authentication token found")
        return null
      }

      console.log("3. Token found, fetching commission data...")
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://evershinebackend-2.onrender.com"
      const response = await fetch(`${apiUrl}/api/client/agent-commission`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      console.log("4. Commission API response status:", response.status)
      if (!response.ok) {
        const errorText = await response.text()
        console.log("5. API error response:", errorText)
        throw new Error(`API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log("6. Commission data received:", data)

      if (data.success && data.data) {
        console.log("7. Agent commission rate:", data.data.commissionRate + "%")
        console.log("8. Agent ID:", data.data.agentId)
        setCommissionData(data.data)
        return data.data
      } else {
        throw new Error("Invalid response format")
      }
    } catch (error: any) {
      console.log("9. Error fetching commission data:", error.message)
      setError(error.message || "Failed to fetch commission data")
      return null
    }
  }

  // Function to fetch products
  const fetchProducts = async (commission: CommissionData | null) => {
    console.log("10. Fetching products...")
    try {
      const token = localStorage.getItem("clientImpersonationToken")
      if (!token) {
        setError("No authentication token found")
        return
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://evershinebackend-2.onrender.com"
      const response = await fetch(`${apiUrl}/api/getAllProducts`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      if (data.success && Array.isArray(data.data)) {
        setProducts(data.data)
      } else {
        throw new Error("Invalid product data format")
      }
    } catch (error: any) {
      setError(error.message || "Failed to fetch products")
    } finally {
      setLoading(false)
    }
  }

  // Add this function to calculate adjusted price
  const calculateAdjustedPrice = (product: Product) => {
    if (!commissionData) return product.price

    // Get commission rate (use category-specific if available)
    let rate = commissionData.commissionRate
    if (commissionData.categoryCommissions && commissionData.categoryCommissions[product.category]) {
      rate = commissionData.categoryCommissions[product.category]
    }

    // Calculate adjusted price
    const adjustedPrice = product.price * (1 + rate / 100)
    return adjustedPrice
  }

  // Calculate percentage increase
  const calculateIncrease = (original: number, adjusted: number) => {
    const increase = ((adjusted - original) / original) * 100
    return `${increase.toFixed(2)}%`
  }

  // Format price for display
  const formatPrice = (price: number) => {
    return `₹${price.toFixed(2)}`
  }

  // Fetch data on component mount
  useEffect(() => {
    const loadData = async () => {
      const commission = await fetchCommissionData()
      await fetchProducts(commission)
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mr-2" />
        <p>Loading data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">Error: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Commission Info */}
      {commissionData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h2 className="text-xl font-bold mb-2">Agent Commission Information</h2>
          <p>
            <span className="font-medium">Agent:</span> {commissionData.name} ({commissionData.email})
          </p>
          <p>
            <span className="font-medium">Agent ID:</span> {commissionData.agentId}
          </p>
          <p>
            <span className="font-medium">Default Commission Rate:</span> {commissionData.commissionRate}%
          </p>

          {commissionData.categoryCommissions && Object.keys(commissionData.categoryCommissions).length > 0 && (
            <div className="mt-2">
              <p className="font-medium">Category-specific Rates:</p>
              <ul className="list-disc pl-5">
                {Object.entries(commissionData.categoryCommissions).map(([category, rate]) => (
                  <li key={category}>
                    {category}: {rate}%
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Products */}
      <h2 className="text-2xl font-bold mb-4">Products with Adjusted Prices</h2>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Product Name</th>
              <th className="border p-2 text-right">Original Price</th>
              <th className="border p-2 text-right">Adjusted Price</th>
              <th className="border p-2 text-right">Increase</th>
            </tr>
          </thead>
          <tbody>
            {products.slice(0, 5).map((product) => {
              const originalPrice = product.price
              const adjustedPrice = calculateAdjustedPrice(product)
              const increase = calculateIncrease(originalPrice, adjustedPrice)

              return (
                <tr key={product._id} className="hover:bg-gray-50">
                  <td className="border p-2">{product.name}</td>
                  <td className="border p-2 text-right">{formatPrice(originalPrice)}</td>
                  <td className="border p-2 text-right font-medium text-green-700">{formatPrice(adjustedPrice)}</td>
                  <td className="border p-2 text-right text-blue-600">{increase}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {products.length === 0 && <p className="text-gray-500 italic">No products found</p>}
    </div>
  )
}
