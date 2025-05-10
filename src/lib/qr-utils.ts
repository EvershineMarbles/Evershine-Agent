/**
 * Utility functions for QR code handling
 */

/**
 * Determines if a scanned QR code is an Evershine product QR code
 * @param data The scanned QR code data
 * @returns Boolean indicating if it's an Evershine QR code
 */
export const isEvershineQR = (data: string): boolean => {
    return data.startsWith("ev://product/")
  }
  
  /**
   * Extracts the product ID from an Evershine QR code
   * @param data The scanned QR code data
   * @returns The product ID or null if invalid format
   */
  export const extractProductId = (data: string): string | null => {
    if (!isEvershineQR(data)) {
      // Try to extract from URL format (legacy support)
      try {
        const url = new URL(data)
        const pathParts = url.pathname.split("/")
        const productIndex = pathParts.findIndex((part) => part === "product")
        if (productIndex !== -1 && pathParts.length > productIndex + 1) {
          return pathParts[productIndex + 1]
        }
      } catch (e) {
        // Not a URL, continue with other checks
      }
      return null
    }
  
    // Extract from our special format: ev://product/{productId}
    return data.replace("ev://product/", "")
  }
  
  /**
   * Determines the appropriate redirect URL based on user role
   * @param productId The product ID
   * @param isAdmin Whether the user is an admin
   * @param clientId The client ID if applicable
   * @returns The URL to redirect to
   */
  export const getRedirectUrl = (productId: string, isAdmin: boolean, clientId?: string): string => {
    if (isAdmin) {
      return `/admin/dashboard/product/${productId}`
    } else if (clientId) {
      return `/client-dashboard/${clientId}/product/${productId}`
    } else {
      // Default case - should not happen if proper role checking is done
      return `/product/${productId}`
    }
  }
  
  /**
   * Checks if the current user is an admin based on localStorage
   * @returns Boolean indicating if user is an admin
   */
  export const isUserAdmin = (): boolean => {
    if (typeof window === "undefined") return false
    return !!localStorage.getItem("admin_token")
  }
  
  /**
   * Checks if the current user is an agent based on localStorage
   * @returns Boolean indicating if user is an agent
   */
  export const isUserAgent = (): boolean => {
    if (typeof window === "undefined") return false
    return !!localStorage.getItem("accessToken")
  }
  
  /**
   * Gets the current client ID for an agent
   * @returns The client ID or null if not found
   */
  export const getCurrentClientId = (): string | null => {
    if (typeof window === "undefined") return null
    return localStorage.getItem("currentClientId")
  }
  