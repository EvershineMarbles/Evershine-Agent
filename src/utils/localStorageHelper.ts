/**
 * Helper functions for working with localStorage
 * Used by wishlist and cart components
 */

// Type definitions
export interface StorageItem {
    id: string
    timestamp: number
  }
  
  /**
   * Get items from localStorage with a specific key prefix
   * @param key The localStorage key
   * @param defaultValue Default value if key doesn't exist
   * @returns The parsed value from localStorage or the default value
   */
  export function getFromStorage<T>(key: string, defaultValue: T): T {
    if (typeof window === "undefined") {
      return defaultValue
    }
  
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.error(`Error getting ${key} from localStorage:`, error)
      return defaultValue
    }
  }
  
  /**
   * Save items to localStorage
   * @param key The localStorage key
   * @param value The value to save
   */
  export function saveToStorage<T>(key: string, value: T): void {
    if (typeof window === "undefined") {
      return
    }
  
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error)
    }
  }
  
  /**
   * Get wishlist items for a specific client
   * @param clientId The client ID
   * @returns Array of wishlist item IDs
   */
  export function getWishlistItems(clientId: string): string[] {
    return getFromStorage<string[]>(`wishlist-${clientId}`, [])
  }
  
  /**
   * Save wishlist items for a specific client
   * @param clientId The client ID
   * @param items Array of wishlist item IDs
   */
  export function saveWishlistItems(clientId: string, items: string[]): void {
    saveToStorage(`wishlist-${clientId}`, items)
  }
  
  /**
   * Get cart items for a specific client
   * @param clientId The client ID
   * @returns Array of cart item IDs
   */
  export function getCartItems(clientId: string): string[] {
    return getFromStorage<string[]>(`cart-${clientId}`, [])
  }
  
  /**
   * Save cart items for a specific client
   * @param clientId The client ID
   * @param items Array of cart item IDs
   */
  export function saveCartItems(clientId: string, items: string[]): void {
    saveToStorage(`cart-${clientId}`, items)
  }
  
  /**
   * Get commission override rate for a specific client
   * @param clientId The client ID
   * @returns The commission override rate or null if not set
   */
  export function getCommissionOverride(clientId: string): number | null {
    const value = getFromStorage<string | null>(`commission-override-${clientId}`, null)
    return value !== null ? Number(value) : null
  }
  
  /**
   * Save commission override rate for a specific client
   * @param clientId The client ID
   * @param rate The commission override rate or null to clear
   */
  export function saveCommissionOverride(clientId: string, rate: number | null): void {
    if (rate === null) {
      if (typeof window !== "undefined") {
        localStorage.removeItem(`commission-override-${clientId}`)
      }
    } else {
      saveToStorage(`commission-override-${clientId}`, rate.toString())
    }
  }
  
  /**
   * Clear all client-specific data from localStorage
   * @param clientId The client ID
   */
  export function clearClientData(clientId: string): void {
    if (typeof window === "undefined") {
      return
    }
  
    try {
      localStorage.removeItem(`wishlist-${clientId}`)
      localStorage.removeItem(`cart-${clientId}`)
      localStorage.removeItem(`commission-override-${clientId}`)
    } catch (error) {
      console.error(`Error clearing data for client ${clientId}:`, error)
    }
  }
  