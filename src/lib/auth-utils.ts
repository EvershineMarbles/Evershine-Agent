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
