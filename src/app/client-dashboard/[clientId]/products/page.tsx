"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"

// Simplified version with console logs for debugging
export default function ProductsPage() {
  const params = useParams()
  const clientId = params.clientId as string
  const [agentCommissionRate, setAgentCommissionRate] = useState<number | null>(null)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Function to extract data from JWT token
  const parseJwt = (token: string) => {
    try {
      const base64Url = token.split(".")[1]
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join(""),
      )
      return JSON.parse(jsonPayload)
    } catch (error) {
      console.error("Error parsing JWT:", error)
      return null
    }
  }

  // Fetch agent commission rate
  const fetchAgentCommissionRate = useCallback(async () => {
    console.log("🔍 Starting agent commission rate fetch...")

    try {
      // Get the token
      const token = localStorage.getItem("clientImpersonationToken")
      console.log("🔑 Token found:", token ? "Yes" : "No")

      if (!token) {
        console.error("❌ No token found in localStorage")
        return null
      }

      // Try to extract agent info from token
      const payload = parseJwt(token)
      console.log("📄 Token payload:", payload)

      if (payload?.isImpersonating && payload?.agentId) {
        console.log("✅ Found agent ID in token:", payload.agentId)

        // Method 1: Try to get agent data from backend using agentId
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://evershinebackend-2.onrender.com"
          console.log(`🌐 Trying to fetch agent data from ${apiUrl}/api/agent/profile`)

          const response = await fetch(`${apiUrl}/api/agent/profile`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            signal: AbortSignal.timeout(5000),
          })

          if (response.ok) {
            const data = await response.json()
            console.log("✅ Agent profile data:", data)

            if (data.success && data.data?.commissionRate !== undefined) {
              console.log("💰 Found commission rate:", data.data.commissionRate)
              setAgentCommissionRate(data.data.commissionRate)
              return data.data.commissionRate
            }
          } else {
            console.log("❌ Agent profile endpoint failed with status:", response.status)
          }
        } catch (error) {
          console.error("❌ Error fetching agent profile:", error)
        }

        // Method 2: Try to get agent data from client's associated agent
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://evershinebackend-2.onrender.com"
          console.log(`🌐 Trying to fetch client details from ${apiUrl}/api/getClientDetails/${clientId}`)

          const clientResponse = await fetch(`${apiUrl}/api/getClientDetails/${clientId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            signal: AbortSignal.timeout(5000),
          })

          if (clientResponse.ok) {
            const clientData = await clientResponse.json()
            console.log("✅ Client data:", clientData)

            if (clientData.success && clientData.data?.agentAffiliated) {
              const agentEmail = clientData.data.agentAffiliated
              console.log("📧 Found agent email:", agentEmail)

              // Now try to get agent data using email
              console.log(`🌐 Trying to fetch agent data using email from ${apiUrl}/api/admin/agents`)

              // This is a workaround since we don't have a direct endpoint to get agent by email
              // You might need to implement a proper endpoint for this
              const agentsResponse = await fetch(`${apiUrl}/api/getAllAgents`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                signal: AbortSignal.timeout(5000),
              })

              if (agentsResponse.ok) {
                const agentsData = await agentsResponse.json()
                console.log("✅ All agents data:", agentsData)

                if (agentsData.success && Array.isArray(agentsData.data)) {
                  // Find the agent with matching email
                  const agent = agentsData.data.find((a: any) => a.email === agentEmail)

                  if (agent) {
                    console.log("✅ Found agent with matching email:", agent)
                    console.log("💰 Commission rate:", agent.commissionRate || 0)
                    setAgentCommissionRate(agent.commissionRate || 0)
                    return agent.commissionRate || 0
                  }
                }
              } else {
                console.log("❌ Get all agents endpoint failed with status:", agentsResponse.status)
              }
            }
          } else {
            console.log("❌ Client details endpoint failed with status:", clientResponse.status)
          }
        } catch (error) {
          console.error("❌ Error fetching client details:", error)
        }
      }

      // Method 3: Try direct API endpoint for client's agent info
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://evershinebackend-2.onrender.com"
        console.log(`🌐 Trying dedicated endpoint ${apiUrl}/api/client/agent-info`)

        const response = await fetch(`${apiUrl}/api/client/agent-info`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          signal: AbortSignal.timeout(5000),
        })

        console.log("📡 Response status:", response.status)

        if (response.ok) {
          const data = await response.json()
          console.log("✅ Agent info response:", data)

          if (data.success && data.data?.commissionRate !== undefined) {
            console.log("💰 Found commission rate:", data.data.commissionRate)
            setAgentCommissionRate(data.data.commissionRate)
            return data.data.commissionRate
          }
        } else {
          console.log("❌ Agent info endpoint failed with status:", response.status)
        }
      } catch (error) {
        console.error("❌ Error fetching agent info:", error)
      }

      // Fallback: Use hardcoded value
      console.log("⚠️ Using fallback hardcoded commission rate")
      setAgentCommissionRate(10) // Default fallback value
      return 10
    } catch (error) {
      console.error("❌ Error in fetchAgentCommissionRate:", error)
      setAgentCommissionRate(10) // Default fallback value
      return 10
    }
  }, [clientId])

  // Fetch products with commission applied
  const fetchProducts = useCallback(async () => {
    console.log("🔍 Starting products fetch...")
    setLoading(true)

    try {
      const token = localStorage.getItem("clientImpersonationToken")
      if (!token) {
        throw new Error("No token found")
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://evershinebackend-2.onrender.com"

      // Method 1: Try client/products endpoint (should have commission already applied)
      console.log(`🌐 Trying ${apiUrl}/api/client/products endpoint`)

      try {
        const response = await fetch(`${apiUrl}/api/client/products`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          signal: AbortSignal.timeout(5000),
        })

        console.log("📡 Response status:", response.status)

        if (response.ok) {
          const data = await response.json()
          console.log("✅ Client products response:", data)

          if (data.success && Array.isArray(data.data)) {
            console.log("✅ Products with commission already applied:", data.data)
            setProducts(data.data)
            return
          }
        } else {
          console.log("❌ Client products endpoint failed with status:", response.status)
        }
      } catch (error) {
        console.error("❌ Error fetching from client/products:", error)
      }

      // Method 2: Try general products endpoint and apply commission manually
      console.log(`🌐 Trying ${apiUrl}/api/getAllProducts endpoint`)

      const response = await fetch(`${apiUrl}/api/getAllProducts`, {
        headers: {
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(5000),
      })

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`)
      }

      const data = await response.json()
      console.log("✅ General products response:", data)

      if (data.success && Array.isArray(data.data)) {
        // Get commission rate
        const commissionRate = (await fetchAgentCommissionRate()) || 0
        console.log("💰 Using commission rate for manual calculation:", commissionRate)

        // Apply commission manually
        const productsWithCommission = data.data.map((product: any) => {
          const basePrice = product.price
          const priceWithCommission = basePrice * (1 + commissionRate / 100)

          return {
            ...product,
            basePrice,
            price: priceWithCommission,
          }
        })

        console.log("✅ Products with manually applied commission:", productsWithCommission)
        setProducts(productsWithCommission)
      } else {
        throw new Error("Invalid API response format")
      }
    } catch (error: any) {
      console.error("❌ Error fetching products:", error)
      setError(error.message || "Failed to load products")
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [fetchAgentCommissionRate])

  // Fetch data on component mount
  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Debug display
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Products Debug Page</h1>

      <div className="mb-6 p-4 bg-gray-100 rounded-md">
        <h2 className="text-lg font-semibold mb-2">Agent Commission Info</h2>
        <p>Commission Rate: {agentCommissionRate !== null ? `${agentCommissionRate}%` : "Loading..."}</p>
        <p>Client ID: {clientId}</p>
        <p>Products Loaded: {products.length}</p>
        {error && <p className="text-red-500">Error: {error}</p>}
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">First Product Preview</h2>
        {loading ? (
          <p>Loading products...</p>
        ) : products.length > 0 ? (
          <div className="p-4 border rounded-md">
            <p>
              <strong>Name:</strong> {products[0].name}
            </p>
            <p>
              <strong>Base Price:</strong> ₹
              {products[0].basePrice?.toLocaleString() || products[0].price.toLocaleString()}
            </p>
            <p>
              <strong>Price with Commission:</strong> ₹{products[0].price.toLocaleString()}
            </p>
            {products[0].basePrice && (
              <p>
                <strong>Commission Amount:</strong> ₹{(products[0].price - products[0].basePrice).toLocaleString()}
              </p>
            )}
          </div>
        ) : (
          <p>No products found</p>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">Debug Instructions</h2>
        <p>Open your browser console (F12) to see detailed logs about the commission rate fetching process.</p>
      </div>
    </div>
  )
}
