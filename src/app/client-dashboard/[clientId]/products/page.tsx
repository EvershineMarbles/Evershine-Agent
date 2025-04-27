"use client"

// products-page.tsx

import { useState, useEffect, useCallback } from "react"

const ProductsPage = () => {
  const [agentData, setAgentData] = useState({
    _id: "",
    name: "",
    email: "",
    commissionRate: 0,
    agentId: "",
  })
  const [clientId, setClientId] = useState("your_client_id") // Replace with actual client ID

  useEffect(() => {
    // Simulate fetching client ID (replace with actual logic)
    const storedClientId = localStorage.getItem("clientId")
    if (storedClientId) {
      setClientId(storedClientId)
    } else {
      // Generate a random client ID for demonstration purposes
      const newClientId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      setClientId(newClientId)
      localStorage.setItem("clientId", newClientId)
    }
  }, [])

  useEffect(() => {
    if (clientId) {
      fetchAgentData()
    }
  }, [clientId, fetchAgentData])

  // Fetch agent data from the backend
  const fetchAgentData = useCallback(async () => {
    try {
      // Get the token to extract agent info from it
      const token = localStorage.getItem("clientImpersonationToken")
      if (!token) {
        throw new Error("No authentication token found")
      }

      // Try to decode the JWT token to get agent information
      // JWT tokens are in the format: header.payload.signature
      const tokenParts = token.split(".")
      if (tokenParts.length !== 3) {
        throw new Error("Invalid token format")
      }

      try {
        // Decode the payload part (second part) of the JWT
        const payload = JSON.parse(atob(tokenParts[1]))
        console.log("Token payload:", payload)

        // Extract agent info from the token
        const agentInfo = {
          _id: payload.agentId || "unknown",
          name: payload.agentEmail ? payload.agentEmail.split("@")[0] : "Unknown Agent",
          email: payload.agentEmail || "unknown@example.com",
          commissionRate: 10, // Hardcoded commission rate
          agentId: payload.agentId || "unknown",
        }

        setAgentData(agentInfo)
        console.log(`Using agent data with commission rate: ${agentInfo.commissionRate}%`)

        // Save to localStorage as cache
        localStorage.setItem(`agentData_${clientId}`, JSON.stringify(agentInfo))
      } catch (e) {
        console.error("Error decoding token:", e)
        throw e
      }
    } catch (error) {
      console.error("Error getting agent data:", error)

      // Try to use cached data from localStorage
      const savedAgentData = localStorage.getItem(`agentData_${clientId}`)
      if (savedAgentData) {
        try {
          const parsedData = JSON.parse(savedAgentData)
          setAgentData(parsedData)
          console.log(`Using cached agent data with commission rate: ${parsedData.commissionRate}%`)
          return
        } catch (e) {
          console.error("Error parsing cached agent data:", e)
        }
      }

      // As a last resort, use default agent data
      console.log("Using default agent data with 10% commission rate")
      setAgentData({
        _id: "default",
        name: "Unknown Agent",
        email: "unknown@example.com",
        commissionRate: 10, // Default commission rate
        agentId: "default",
      })
    }
  }, [clientId])

  return (
    <div>
      <h1>Products Page</h1>
      <p>Agent Name: {agentData.name}</p>
      <p>Agent Email: {agentData.email}</p>
      <p>Commission Rate: {agentData.commissionRate}%</p>
      <p>Client ID: {clientId}</p>
    </div>
  )
}

export default ProductsPage
