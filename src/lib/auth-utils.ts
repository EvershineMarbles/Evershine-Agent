export const isAgentAuthenticated = () => {
  if (typeof window === "undefined") {
    return false
  }
  return !!localStorage.getItem("agentToken")
}

export const storeClientImpersonationToken = (clientId: string, token: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("clientImpersonationToken", token)
    localStorage.setItem("impersonatedClientId", clientId)
  }
}

export const clearAllTokens = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("agentToken")
    localStorage.removeItem("clientImpersonationToken")
    localStorage.removeItem("impersonatedClientId")
    localStorage.removeItem("agentEmail")
  }
}

export const storeAgentTokens = (accessToken: string, refreshToken: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("agentToken", accessToken)
    localStorage.setItem("refreshToken", refreshToken)
  }
}

export const hasClientImpersonation = () => {
  if (typeof window === "undefined") {
    return false
  }
  return !!localStorage.getItem("clientImpersonationToken")
}

/**
 * Checks if the current user is an admin
 * @returns boolean indicating if user is an admin
 */
export const isAdmin = (): boolean => {
  if (typeof window === "undefined") return false
  return localStorage.getItem("admin_token") !== null
}

/**
 * Checks if the current user is an agent
 * @returns boolean indicating if user is an agent
 */
export const isAgent = (): boolean => {
  if (typeof window === "undefined") return false
  return localStorage.getItem("accessToken") !== null || sessionStorage.getItem("accessToken") !== null
}

/**
 * Gets the current client ID for an agent
 * @returns string | null - The client ID or null if not found
 */
export const getCurrentClientId = (): string | null => {
  if (typeof window === "undefined") return null

  // Try to get from URL first (most reliable)
  const pathParts = window.location.pathname.split("/")
  const clientDashboardIndex = pathParts.indexOf("client-dashboard")

  if (clientDashboardIndex !== -1 && pathParts.length > clientDashboardIndex + 1) {
    return pathParts[clientDashboardIndex + 1]
  }

  // Fall back to localStorage
  return localStorage.getItem("currentClientId")
}

/**
 * Determines the appropriate product URL based on user role
 * @param productId - The ID of the product
 * @returns string - The appropriate URL for the product
 */
export const getProductUrlByRole = (productId: string): string => {
  if (isAdmin()) {
    return `/admin/dashboard/product/${productId}`
  } else if (isAgent()) {
    const clientId = getCurrentClientId()
    if (clientId) {
      return `/client-dashboard/${clientId}/product/${productId}`
    } else {
      // Default to dashboard if no client context
      return "/dashboard"
    }
  } else {
    // For unauthorized users, return login page
    return "/login"
  }
}
