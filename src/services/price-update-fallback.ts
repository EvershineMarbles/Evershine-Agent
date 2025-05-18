/**
 * Fallback service for price updates using polling
 */
class PriceUpdateFallbackService {
  private clientId: string | null = null
  private pollingInterval: NodeJS.Timeout | null = null
  private pollingTime = 60000 // 1 minute

  // Initialize the service with client ID
  initialize(clientId: string) {
    // Check if we're in a browser environment
    if (typeof window === "undefined") {
      console.log("Not in browser environment, skipping polling initialization")
      return this
    }

    this.clientId = clientId
    this.startPolling()
    return this
  }

  // Start polling for price updates
  private startPolling() {
    // Clear any existing interval
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
    }

    // Check for updates immediately
    this.checkForPriceUpdates()

    // Set up polling interval
    this.pollingInterval = setInterval(() => {
      this.checkForPriceUpdates()
    }, this.pollingTime)
  }

  // Check for price updates
  private async checkForPriceUpdates() {
    try {
      // Check if we're in a browser environment
      if (typeof window === "undefined") return

      const token = localStorage.getItem("clientImpersonationToken") || localStorage.getItem("token")
      if (!token) {
        console.error("No authentication token found for price update check")
        return
      }

      const lastChecked = localStorage.getItem("lastPriceCheck") || null
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://evershinebackend-2.onrender.com"

      const response = await fetch(`${apiUrl}/api/prices/check-updates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          lastChecked,
          clientId: this.clientId,
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (data.pricesUpdated) {
        console.log("Prices have been updated via polling!")

        // Update the last checked timestamp
        localStorage.setItem("lastPriceCheck", data.lastUpdated)

        // Dispatch the same event as the WebSocket service for consistency
        window.dispatchEvent(
          new CustomEvent("prices-updated", {
            detail: {
              type: "price_update",
              message: "Prices have been updated",
              timestamp: data.lastUpdated,
            },
          }),
        )
      }
    } catch (error) {
      console.error("Error checking price updates:", error)
    }
  }

  // Clean up on service destruction
  destroy() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
      this.pollingInterval = null
    }
    this.clientId = null
  }
}

// Create singleton instance
export const priceUpdateFallbackService = new PriceUpdateFallbackService()

// Also export as priceUpdateService for compatibility with some imports
export const priceUpdateService = priceUpdateFallbackService
