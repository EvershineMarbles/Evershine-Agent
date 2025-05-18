import io from "socket.io-client"

class PriceUpdateService {
  private socket: ReturnType<typeof io> | null = null
  private clientId: string | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 3000 // 3 seconds

  // Initialize the service with client ID
  initialize(clientId: string) {
    this.clientId = clientId

    // Create socket connection
    this.socket = io(process.env.NEXT_PUBLIC_API_URL || "https://evershinebackend-2.onrender.com", {
      withCredentials: true,
      autoConnect: true,
      // Add auth token if needed
      auth: {
        token: localStorage.getItem("clientImpersonationToken") || localStorage.getItem("token"),
      },
    })

    // Set up event listeners
    this.setupEventListeners()

    return this
  }

  // Set up socket event listeners
  private setupEventListeners() {
    if (!this.socket) return

    this.socket.on("connect", this.handleConnect.bind(this))
    this.socket.on("disconnect", this.handleDisconnect.bind(this))
    this.socket.on("prices-updated", this.handlePriceUpdate.bind(this))
    this.socket.on("connect_error", this.handleConnectionError.bind(this))
  }

  // Handle successful connection
  private handleConnect() {
    console.log("Connected to price updates service")
    this.reconnectAttempts = 0

    // Join client-specific room
    if (this.clientId && this.socket) {
      this.socket.emit("join-client-room", this.clientId)
    }
  }

  // Handle disconnection
  private handleDisconnect() {
    console.log("Disconnected from price updates service")
    this.attemptReconnect()
  }

  // Handle connection errors
  private handleConnectionError(error: Error) {
    console.error("WebSocket connection error:", error)
    this.attemptReconnect()
  }

  // Attempt to reconnect
  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)

      setTimeout(() => {
        if (this.socket) {
          this.socket.connect()
        }
      }, this.reconnectDelay)
    } else {
      console.error("Max reconnection attempts reached. Falling back to polling.")
      // Dispatch event to activate polling fallback
      window.dispatchEvent(new CustomEvent("websocket-failed"))
    }
  }

  // Handle price update events
  private handlePriceUpdate(data: any) {
    console.log("Received price update notification:", data)

    // No toast notification - silently update prices

    // Dispatch custom event for components to listen to
    window.dispatchEvent(new CustomEvent("prices-updated", { detail: data }))
  }

  // Clean up on service destruction
  destroy() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    this.clientId = null
  }
}

// Create singleton instance
export const priceUpdateService = new PriceUpdateService()
