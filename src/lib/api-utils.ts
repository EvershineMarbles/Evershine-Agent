export const agentAPI = {
  login: async (email: string, password: string) => {
    try {
      console.log("Logging in agent:", { email })
      const response = await fetch("https://evershinebackend-2.onrender.com/api/agentLogin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("Login response:", data)

      if (data.success) {
        // Store agent email for display in dashboard
        localStorage.setItem("agentEmail", email)
        // Store the agent token with the correct key
        localStorage.setItem("agentToken", data.accessToken)

        return {
          success: true,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          message: data.message || "Agent logged in successfully",
        }
      } else {
        throw new Error(data.message || "Failed to login")
      }
    } catch (error: any) {
      console.error("Login error:", error)
      return {
        success: false,
        message: error instanceof Error ? error.message : "An error occurred during login",
      }
    }
  },
  register: async (name: string, email: string, password: string) => {
    try {
      const response = await fetch("https://evershinebackend-2.onrender.com/api/create-agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("API error:", response.status, response.statusText, errorText)
        return {
          success: false,
          message: `API error: ${response.status} ${response.statusText} - ${errorText}`,
        }
      }

      const data = await response.json()
      if (data.success) {
        localStorage.setItem("agentEmail", email)
        return {
          success: true,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          message: data.message,
        }
      } else {
        return { success: false, message: data.message }
      }
    } catch (error: any) {
      console.error("API Error:", error)
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to register",
      }
    }
  },
  getClients: async () => {
    try {
      const token = localStorage.getItem("agentToken")

      if (!token) {
        console.error("No agent token found in localStorage")
        return { success: false, message: "No authentication token found" }
      }

      // Change this URL to match your backend route
      const response = await fetch("https://evershinebackend-2.onrender.com/api/agent/clients", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        console.error("API error:", response.status, response.statusText)
        return {
          success: false,
          message: `API error: ${response.status} ${response.statusText}`,
        }
      }

      const data = await response.json()
      return { success: true, data: data.data, message: data.message }
    } catch (error) {
      console.error("API Error:", error)
      return { success: false, message: "Failed to fetch clients" }
    }
  },
  impersonateClient: async (clientId: string) => {
    try {
      // Get token from localStorage - use the correct key
      const token = localStorage.getItem("agentToken")

      if (!token) {
        console.error("No agent token found in localStorage")
        return { success: false, message: "No authentication token found" }
      }

      console.log(`Making API request to impersonate client ${clientId}`)

      // Change the endpoint to match your backend route
      const response = await fetch(`https://evershinebackend-2.onrender.com/api/agent/impersonate/${clientId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        console.error("API error:", response.status, response.statusText)
        return {
          success: false,
          message: `API error: ${response.status} ${response.statusText}`,
        }
      }

      const data = await response.json()
      console.log("Impersonation API response:", data)

      // Check if we have the expected data structure
      if (data.data && data.data.impersonationToken) {
        console.log("Successfully received impersonation token")
        console.log("Token preview:", data.data.impersonationToken.substring(0, 15) + "...")

        return {
          success: true,
          data: data.data,
          message: data.message || "Successfully generated impersonation token",
        }
      } else {
        console.error("Invalid response format:", data)
        return {
          success: false,
          message: "Invalid response format from server",
        }
      }
    } catch (error) {
      console.error("API Error:", error)
      return { success: false, message: "Failed to impersonate client" }
    }
  },
  // Add the getAgentOrders function here
  getAgentOrders: async () => {
    try {
      const token = localStorage.getItem("agentToken")

      if (!token) {
        console.error("No agent token found in localStorage")
        return { success: false, message: "No authentication token found" }
      }

      // Use the same URL pattern as your other API calls
      const response = await fetch("https://evershinebackend-2.onrender.com/api/agent/orders", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        console.error("API error:", response.status, response.statusText)
        return {
          success: false,
          message: `API error: ${response.status} ${response.statusText}`,
        }
      }

      const data = await response.json()
      console.log("Agent orders response:", data)

      return {
        success: true,
        data: data.data,
        message: data.message,
      }
    } catch (error) {
      console.error("Error fetching agent orders:", error)
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch orders",
      }
    }
  },
}

const getWishlist = async () => {
  try {
    const token = localStorage.getItem("clientImpersonationToken")
    if (!token) {
      console.error("No client token found in localStorage")
      return { success: false, message: "No authentication token found" }
    }

    const response = await fetch("https://evershinebackend-2.onrender.com/api/getUserWishlist", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      console.error("API error:", response.status, response.statusText)
      return {
        success: false,
        message: `API error: ${response.status} ${response.statusText}`,
      }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("API Error:", error)
    return { success: false, message: "Failed to fetch wishlist" }
  }
}

const removeFromWishlist = async (productId: string) => {
  try {
    const token = localStorage.getItem("clientImpersonationToken")
    if (!token) {
      console.error("No client token found in localStorage")
      return { success: false, message: "No authentication token found" }
    }

    const response = await fetch("https://evershinebackend-2.onrender.com/api/deleteUserWishlistItem", {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ productId }),
    })

    if (!response.ok) {
      console.error("API error:", response.status, response.statusText)
      return {
        success: false,
        message: `API error: ${response.status} ${response.statusText}`,
      }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("API Error:", error)
    return { success: false, message: "Failed to remove from wishlist" }
  }
}

const addToCart = async (productId: string) => {
  try {
    const token = localStorage.getItem("clientImpersonationToken")
    if (!token) {
      console.error("No client token found in localStorage")
      return { success: false, message: "No authentication token found" }
    }

    const response = await fetch("https://evershinebackend-2.onrender.com/api/addToCart", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ productId }),
    })

    if (!response.ok) {
      console.error("API error:", response.status, response.statusText)
      return {
        success: false,
        message: `API error: ${response.status} ${response.statusText}`,
      }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("API Error:", error)
    return { success: false, message: "Failed to add to cart" }
  }
}

const updateWishlistPrices = async (commissionRate: number) => {
  try {
    const token = localStorage.getItem("clientImpersonationToken")
    if (!token) {
      console.error("No client token found in localStorage")
      return { success: false, message: "No authentication token found" }
    }

    const response = await fetch("https://evershinebackend-2.onrender.com/api/updateWishlistPrices", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ commissionRate }),
    })

    if (!response.ok) {
      console.error("API error:", response.status, response.statusText)
      return {
        success: false,
        message: `API error: ${response.status} ${response.statusText}`,
      }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("API Error:", error)
    return { success: false, message: "Failed to update wishlist prices" }
  }
}

export { getWishlist, removeFromWishlist, addToCart, updateWishlistPrices }
