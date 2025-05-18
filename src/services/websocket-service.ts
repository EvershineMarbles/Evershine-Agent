/**
 * WebSocket service for real-time price updates
 */
class PriceUpdateService {
  private socket: WebSocket | null = null
  private clientId: string | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 3000 // 3 seconds
  private pingInterval: NodeJS.Timeout | null = null
  private pingIntervalTime = 30000 // 30 seconds

  // Initialize the service with client ID
  initialize(clientId: string) {
    this.clientId = clientId
    this.connectWebSocket()
    return this
  }

  // Connect to WebSocket server
  private connectWebSocket() {
    try {
      const token = localStorage.getItem("clientImpersonationToken") || localStorage.getItem("token")
      if (!token) {
        console.error("No authentication token found for WebSocket connection")
        this.fallbackToPolling()
        return
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://evershinebackend-2.onrender.com"
      // Convert http/https to ws/wss
      const wsUrl = apiUrl.replace(/^http/, "ws")

      // Create WebSocket connection with client ID and token
      this.socket = new WebSocket(`${wsUrl}/ws/prices/${this.clientId}?token=${token}`)

      // Set up event listeners
      this.socket.onopen = this.handleConnect.bind(this)
      this.socket.onclose = this.handleDisconnect.bind(this)
      this.socket.onerror = this.handleConnectionError.bind(this)
      this.socket.onmessage = this.handleMessage.bind(this)

      // Set up ping interval to keep connection alive
      this.setupPingInterval()
    } catch (error) {
      console.error("Error creating WebSocket connection:", error)
      this.fallbackToPolling()
    }
  }

  // Set up ping interval to keep connection alive
  private setupPingInterval() {
    // Clear any existing interval
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
    }

    // Set up new interval
    this.pingInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        // Send ping message
        this.socket.send(JSON.stringify({ type: "ping" }))
      }
    }, this.pingIntervalTime)
  }

  // Handle successful connection
  private handleConnect() {
    console.log("Connected to price updates WebSocket service")
    this.reconnectAttempts = 0
  }

  // Handle disconnection
  private handleDisconnect() {
    console.log("Disconnected from price updates WebSocket service")
    this.clearPingInterval()
    this.attemptReconnect()
  }

  // Handle connection errors
  private handleConnectionError(event: Event) {
    console.error("WebSocket connection error:", event)
    this.attemptReconnect()
  }

  // Handle incoming messages
  private handleMessage(event: MessageEvent) {
    try {
      const data = JSON.parse(event.data)

      // Handle different message types
      switch (data.type) {
        case "price_update":
          console.log("Received price update notification:", data)
          // Dispatch custom event for components to listen to
          window.dispatchEvent(new CustomEvent("prices-updated", { detail: data }))
          break

        case "pong":
          // Connection health check response
          break

        case "connection":
          console.log("WebSocket connection established:", data)
          break

        default:
          console.log("Received unknown message type:", data)
      }
    } catch (error) {
      console.error("Error processing WebSocket message:", error)
    }
  }

  // Clear ping interval
  private clearPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
  }

  // Attempt to reconnect
  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)

      setTimeout(() => {
        this.connectWebSocket()
      }, this.reconnectDelay * this.reconnectAttempts) // Exponential backoff
    } else {
      console.error("Max reconnection attempts reached. Falling back to polling.")
      this.fallbackToPolling()
    }
  }

  // Fall back to polling mechanism
  private fallbackToPolling() {
    // Dispatch event to activate polling fallback
    window.dispatchEvent(new CustomEvent("websocket-failed"))
  }

  // Clean up on service destruction
  destroy() {
    if (this.socket) {
      this.socket.close()
      this.socket = null
    }
    this.clearPingInterval()
    this.clientId = null
  }
}

// Create singleton instance
export const priceUpdateService = new PriceUpdateService()
