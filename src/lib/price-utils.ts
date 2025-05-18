// Utility functions for handling product pricing

/**
 * Gets the current client ID from the URL or localStorage
 */
export const getCurrentClientId = (): string | null => {
    // Try to get from URL first (if in client dashboard)
    if (typeof window !== "undefined") {
      const pathParts = window.location.pathname.split("/")
      const clientDashboardIndex = pathParts.findIndex((part) => part === "client-dashboard")
  
      if (clientDashboardIndex !== -1 && pathParts.length > clientDashboardIndex + 1) {
        return pathParts[clientDashboardIndex + 1]
      }
  
      // If not in URL, try localStorage
      return localStorage.getItem("currentClientId")
    }
  
    return null
  }
  
  /**
   * Gets the authentication token
   */
  export const getAuthToken = (): string | null => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("clientImpersonationToken") || localStorage.getItem("agentToken")
    }
    return null
  }
  
  /**
   * Format price for display
   */
  export const formatPrice = (price: number | null | undefined): string => {
    if (price === null || price === undefined) return "₹--"
    return `₹${price.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
      minimumFractionDigits: price % 1 === 0 ? 0 : 2,
    })}`
  }
  
  /**
   * Get product ID (handles missing postId)
   */
  export const getProductId = (product: { postId?: string; _id: string }): string => {
    return product.postId || product._id
  }
  
  /**
   * Show notification to user
   */
  export const showNotification = (message: string): void => {
    // This could be implemented with toast or a custom notification system
    console.log("NOTIFICATION:", message)
    // If using toast:
    // toast({ title: "Update", description: message })
  }
  
  /**
   * Connect to WebSocket for real-time price updates
   */
  export const connectToPriceUpdates = (onPriceUpdate: () => void, onConnectionChange?: (connected: boolean) => void) => {
    const clientId = getCurrentClientId()
    const token = getAuthToken()
  
    if (!clientId || !token) {
      console.warn("Cannot connect to price updates: missing clientId or token")
      return null
    }
  
    // Get the WebSocket host (use secure WebSocket if on HTTPS)
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
    const host = process.env.NEXT_PUBLIC_WS_HOST || window.location.host
  
    // Create WebSocket connection with authentication
    const ws = new WebSocket(`${protocol}//${host}/ws/prices?clientId=${clientId}&token=${token}`)
  
    ws.onopen = () => {
      console.log("Connected to price updates service")
      onConnectionChange?.(true)
    }
  
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
  
      if (data.type === "price_update") {
        console.log("Price update received:", data)
  
        // Show notification to user
        showNotification("Prices have been updated. Refreshing data...")
  
        // Call the callback to refresh data
        onPriceUpdate()
      } else if (data.type === "connection") {
        console.log("Connection message:", data.message)
      } else if (data.type === "pong") {
        // Handle ping-pong for keeping connection alive
        console.log("Received pong at:", data.timestamp)
      }
    }
  
    ws.onerror = (error) => {
      console.error("WebSocket error:", error)
      onConnectionChange?.(false)
    }
  
    ws.onclose = () => {
      console.log("WebSocket connection closed")
      onConnectionChange?.(false)
  
      // Attempt to reconnect after a delay
      setTimeout(() => {
        connectToPriceUpdates(onPriceUpdate, onConnectionChange)
      }, 5000)
    }
  
    // Set up ping interval to keep connection alive
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "ping" }))
      }
    }, 30000) // Send ping every 30 seconds
  
    // Clear interval when connection closes
    ws.addEventListener("close", () => {
      clearInterval(pingInterval)
    })
  
    return {
      connection: ws,
      disconnect: () => {
        clearInterval(pingInterval)
        ws.close()
      },
    }
  }
  
  /**
   * Check if prices have been updated since last check
   */
  export const checkPriceUpdates = async (): Promise<boolean> => {
    const lastChecked = localStorage.getItem("lastPriceCheck")
    const token = getAuthToken()
  
    if (!token) {
      console.warn("Cannot check price updates: missing token")
      return false
    }
  
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://evershinebackend-2.onrender.com"
      const response = await fetch(`${apiUrl}/api/prices/check-updates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ lastChecked }),
      })
  
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }
  
      const data = await response.json()
  
      if (data.pricesUpdated) {
        // Show notification to user
        showNotification("Prices have been updated")
  
        // Update last checked timestamp
        localStorage.setItem("lastPriceCheck", data.lastUpdated)
      }
  
      return data.pricesUpdated
    } catch (error) {
      console.error("Error checking price updates:", error)
      return false
    }
  }
  