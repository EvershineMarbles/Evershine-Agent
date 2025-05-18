/**
 * Fallback service for price updates using polling
 * This is used when WebSocket connection fails
 */

class PriceUpdateFallbackService {
    private clientId: string | null = null
    private pollInterval = 30000 // 30 seconds
    private intervalId: NodeJS.Timeout | null = null
    private lastPriceCheck: Date = new Date()
  
    initialize(clientId: string) {
      this.clientId = clientId
      this.lastPriceCheck = new Date()
      this.startPolling()
      return this
    }
  
    private startPolling() {
      // Clear any existing interval
      this.stopPolling()
  
      // Start new polling interval
      this.intervalId = setInterval(() => {
        this.checkForPriceUpdates()
      }, this.pollInterval)
  
      console.log("Price update polling started as WebSocket fallback")
    }
  
    private stopPolling() {
      if (this.intervalId) {
        clearInterval(this.intervalId)
        this.intervalId = null
      }
    }
  
    private async checkForPriceUpdates() {
      try {
        if (!this.clientId) return
  
        const token = localStorage.getItem("clientImpersonationToken") || localStorage.getItem("token")
        if (!token) return
  
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://evershinebackend-2.onrender.com"
  
        const response = await fetch(`${apiUrl}/api/checkPriceUpdates/${this.clientId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
  
        if (response.ok) {
          const data = await response.json()
  
          // If prices have been updated since our last check
          if (data.pricesUpdated && new Date(data.lastUpdated) > this.lastPriceCheck) {
            console.log("Prices have been updated (polling fallback), refreshing data")
            this.lastPriceCheck = new Date()
  
            // Dispatch the same event as the WebSocket service would
            window.dispatchEvent(new CustomEvent("prices-updated", { detail: data }))
          }
        }
      } catch (error) {
        console.error("Error checking for price updates (polling fallback):", error)
      }
    }
  
    destroy() {
      this.stopPolling()
      this.clientId = null
    }
  }
  
  // Create singleton instance
  export const priceUpdateFallbackService = new PriceUpdateFallbackService()
  export const priceUpdateService = priceUpdateFallbackService
  