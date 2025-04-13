// Define token keys
export const TOKEN_KEYS = {
    AGENT_TOKEN: "agentToken",
    AGENT_REFRESH_TOKEN: "agentRefreshToken",
    CLIENT_IMPERSONATION: "clientImpersonationToken", // Changed to match direct localStorage key
    CURRENT_CLIENT_ID: "currentClientId",
  }
  
  // Check if code is running in browser
  const isBrowser = typeof window !== "undefined"
  
  // Store agent tokens
  export const storeAgentTokens = (accessToken: string, refreshToken: string) => {
    if (!isBrowser) return
  
    localStorage.setItem(TOKEN_KEYS.AGENT_TOKEN, accessToken)
    localStorage.setItem(TOKEN_KEYS.AGENT_REFRESH_TOKEN, refreshToken)
    console.log("Agent tokens stored successfully")
  }
  
  // Store client impersonation token
  export const storeClientImpersonationToken = (clientId: string, token: string) => {
    if (!isBrowser) return
  
    console.log("Storing impersonation token for client:", clientId)
    console.log("Token:", token.substring(0, 20) + "...")
  
    localStorage.setItem(TOKEN_KEYS.CLIENT_IMPERSONATION, token)
    localStorage.setItem(TOKEN_KEYS.CURRENT_CLIENT_ID, clientId)
  
    // Verify storage was successful
    const storedToken = localStorage.getItem(TOKEN_KEYS.CLIENT_IMPERSONATION)
    const storedClientId = localStorage.getItem(TOKEN_KEYS.CURRENT_CLIENT_ID)
    console.log("Verification - Stored token:", storedToken ? storedToken.substring(0, 20) + "..." : "missing")
    console.log("Verification - Stored clientId:", storedClientId)
  }
  
  // Get auth token based on context (agent or client)
  export const getAuthToken = (forClient = false) => {
    if (!isBrowser) return null
  
    const token = forClient
      ? localStorage.getItem(TOKEN_KEYS.CLIENT_IMPERSONATION)
      : localStorage.getItem(TOKEN_KEYS.AGENT_TOKEN)
  
    if (forClient) {
      console.log("Getting client impersonation token:", token ? token.substring(0, 20) + "..." : "missing")
    }
  
    return token
  }
  
  // Check if agent is authenticated
  export const isAgentAuthenticated = () => {
    if (!isBrowser) return false
  
    const token = localStorage.getItem(TOKEN_KEYS.AGENT_TOKEN)
    return !!token
  }
  
  // Check if agent has impersonation token for a client
  export const hasClientImpersonation = () => {
    if (!isBrowser) return false
  
    const token = localStorage.getItem(TOKEN_KEYS.CLIENT_IMPERSONATION)
    console.log("Checking client impersonation token:", token ? token.substring(0, 20) + "..." : "missing")
    return !!token
  }
  
  // Get current impersonated client ID
  export const getCurrentClientId = () => {
    if (!isBrowser) return null
  
    return localStorage.getItem(TOKEN_KEYS.CURRENT_CLIENT_ID)
  }
  
  // Clear all tokens (logout)
  export const clearAllTokens = () => {
    if (!isBrowser) return
  
    localStorage.removeItem(TOKEN_KEYS.AGENT_TOKEN)
    localStorage.removeItem(TOKEN_KEYS.AGENT_REFRESH_TOKEN)
    localStorage.removeItem(TOKEN_KEYS.CLIENT_IMPERSONATION)
    localStorage.removeItem(TOKEN_KEYS.CURRENT_CLIENT_ID)
    console.log("All tokens cleared")
  }
  
  // For debugging - check all stored tokens
  export const debugTokens = () => {
    if (!isBrowser) return "Server-side rendering"
  
    const agentToken = localStorage.getItem(TOKEN_KEYS.AGENT_TOKEN)
    const refreshToken = localStorage.getItem(TOKEN_KEYS.AGENT_REFRESH_TOKEN)
    const impersonationToken = localStorage.getItem(TOKEN_KEYS.CLIENT_IMPERSONATION)
    const clientId = localStorage.getItem(TOKEN_KEYS.CURRENT_CLIENT_ID)
  
    // Check if the token looks like a JWT (contains two periods)
    const isJwtFormat = impersonationToken && impersonationToken.split(".").length === 3
  
    // Try to decode the token if it exists and looks like a JWT
    let decodedToken = null
    if (impersonationToken && isJwtFormat) {
      try {
        const base64Url = impersonationToken.split(".")[1]
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join(""),
        )
        decodedToken = JSON.parse(jsonPayload)
        console.log("Decoded token:", decodedToken)
      } catch (e) {
        console.error("Error decoding token:", e)
      }
    }
  
    return {
      agentToken: agentToken ? "exists" : "missing",
      refreshToken: refreshToken ? "exists" : "missing",
      impersonationToken: impersonationToken ? "exists" : "missing",
      clientId: clientId || null,
      tokenPreview: impersonationToken ? impersonationToken.substring(0, 20) + "..." : "N/A",
      isJwtFormat: isJwtFormat ? "Yes" : "No",
      tokenExpiry: decodedToken?.exp ? new Date(decodedToken.exp * 1000).toLocaleString() : "Unknown",
      tokenSubject: decodedToken?.sub || "Unknown",
    }
  }
  
  // Add a function to manually set a token for testing
  export const setTestToken = (token: string) => {
    if (!isBrowser) return false
  
    localStorage.setItem(TOKEN_KEYS.CLIENT_IMPERSONATION, token)
    console.log("Test token set:", token.substring(0, 20) + "...")
    return true
  }
  