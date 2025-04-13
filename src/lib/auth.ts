// Helper function to handle authenticated API requests
export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken")
  
    const headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    }
  
    const response = await fetch(url, {
      ...options,
      headers,
    })
  
    // Handle 401 errors (token expired)
    if (response.status === 401) {
      const refreshToken = localStorage.getItem("refreshToken") || sessionStorage.getItem("refreshToken")
  
      if (refreshToken) {
        try {
          const refreshResponse = await fetch("/api/refreshToken", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
          })
  
          const newTokens = await refreshResponse.json()
  
          if (newTokens.success) {
            localStorage.setItem("accessToken", newTokens.accessToken)
            localStorage.setItem("refreshToken", newTokens.refreshToken)
  
            // Retry the request with new token
            return fetch(url, {
              ...options,
              headers: {
                ...options.headers,
                Authorization: `Bearer ${newTokens.accessToken}`,
                "Content-Type": "application/json",
              },
            })
          }
        } catch (error) {
          console.error("Error refreshing token:", error)
        }
      }
  
      // Redirect to login if refresh token is invalid or not available
      window.location.href = "/login"
    }
  
    return response
  }
  
  // Function to check if user is authenticated
  export const isAuthenticated = () => {
    return !!(localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken"))
  }
  
  // Function to get user role from token
  export const getUserRole = () => {
    const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken")
  
    if (!token) return null
  
    try {
      // Decode JWT token (without verification)
      const base64Url = token.split(".")[1]
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join(""),
      )
  
      const payload = JSON.parse(jsonPayload)
      return payload.role
    } catch (error) {
      console.error("Error decoding token:", error)
      return null
    }
  }
  
  // Function to handle logout
  export const logout = () => {
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
    sessionStorage.removeItem("accessToken")
    sessionStorage.removeItem("refreshToken")
    window.location.href = "/login"
  }
  