"use client"

import { useEffect } from "react"
import { priceUpdateService } from "@/services/websocket-service"
import { priceUpdateFallbackService } from "@/services/price-update-fallback"

/**
 * Hook to manage price update connections and events
 * @param clientId The client ID to use for price updates
 * @param onPriceUpdate Callback function to execute when prices are updated
 */
export function usePriceUpdates(clientId: string, onPriceUpdate: () => void) {
  useEffect(() => {
    if (!clientId) return

    // Initialize WebSocket service
    priceUpdateService.initialize(clientId)

    // Function to handle price updates
    const handlePriceUpdate = () => {
      console.log("Price update detected, refreshing data")
      onPriceUpdate()
    }

    // Function to handle WebSocket failure
    const handleWebSocketFailure = () => {
      console.log("WebSocket failed, activating polling fallback")
      priceUpdateFallbackService.initialize(clientId)
    }

    // Add event listeners
    window.addEventListener("prices-updated", handlePriceUpdate)
    window.addEventListener("websocket-failed", handleWebSocketFailure)

    // Clean up on unmount
    return () => {
      priceUpdateService.destroy()
      priceUpdateFallbackService.destroy()
      window.removeEventListener("prices-updated", handlePriceUpdate)
      window.removeEventListener("websocket-failed", handleWebSocketFailure)
    }
  }, [clientId, onPriceUpdate])
}
