// Admin authentication utilities

// Base API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// Admin token storage keys
export const ADMIN_TOKEN_KEY = "admin_token"
export const ADMIN_REFRESH_TOKEN_KEY = "admin_refresh_token"

// Store admin tokens in localStorage
export const storeAdminTokens = (accessToken: string, refreshToken: string) => {
  if (typeof window === "undefined") return

  localStorage.setItem(ADMIN_TOKEN_KEY, accessToken)
  localStorage.setItem(ADMIN_REFRESH_TOKEN_KEY, refreshToken)
}

// Get admin token from localStorage
export const getAdminToken = (): string | null => {
  if (typeof window === "undefined") return null

  return localStorage.getItem(ADMIN_TOKEN_KEY)
}

// Check if admin is authenticated
export const isAdminAuthenticated = (): boolean => {
  if (typeof window === "undefined") return false

  return !!localStorage.getItem(ADMIN_TOKEN_KEY)
}

// Clear admin tokens (logout)
export const clearAdminTokens = () => {
  if (typeof window === "undefined") return

  localStorage.removeItem(ADMIN_TOKEN_KEY)
  localStorage.removeItem(ADMIN_REFRESH_TOKEN_KEY)
}

// Admin login function
export const loginAdmin = async (email: string, password: string) => {
  try {
    const response = await fetch(`${API_URL}/api/admin/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || `Error: ${response.status}`)
    }

    const data = await response.json()

    if (data.success && data.data) {
      // Store tokens
      storeAdminTokens(data.data.accessToken, data.data.refreshToken)

      return {
        success: true,
        admin: data.data.admin,
      }
    } else {
      throw new Error(data.message || "Login failed")
    }
  } catch (error: any) {
    console.error("Login error:", error)
    return {
      success: false,
      message: error.message || "An error occurred during login",
    }
  }
}

// Register initial super admin
export const registerSuperAdmin = async (name: string, email: string, password: string) => {
  try {
    const response = await fetch(`${API_URL}/api/admin/setup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || `Error: ${response.status}`)
    }

    const data = await response.json()

    return {
      success: true,
      message: data.message || "Super admin created successfully",
    }
  } catch (error: any) {
    console.error("Registration error:", error)
    return {
      success: false,
      message: error.message || "An error occurred during registration",
    }
  }
}

// Fetch with admin authentication
export const fetchWithAdminAuth = async (url: string, options: RequestInit = {}) => {
  const token = getAdminToken()

  if (!token) {
    throw new Error("No authentication token found")
  }

  const isAbsoluteUrl = url.startsWith("http://") || url.startsWith("https://")
  const fullUrl = isAbsoluteUrl ? url : `${API_URL}${url}`

  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }

  return fetch(fullUrl, {
    ...options,
    headers,
  })
}

// Get all agents (for admin dashboard)
export const getAllAgents = async () => {
  try {
    const response = await fetchWithAdminAuth("/api/admin/agents")

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || `Error: ${response.status}`)
    }

    const data = await response.json()

    if (data.success && data.data) {
      return {
        success: true,
        agents: data.data.agents || [],
      }
    } else {
      throw new Error(data.message || "Failed to fetch agents")
    }
  } catch (error: any) {
    console.error("Error fetching agents:", error)
    return {
      success: false,
      message: error.message || "An error occurred while fetching agents",
      agents: [],
    }
  }
}

// Get all clients (for admin dashboard)
export const getAllClients = async () => {
  try {
    const response = await fetchWithAdminAuth("/api/admin/clients")

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || `Error: ${response.status}`)
    }

    const data = await response.json()

    if (data.success && data.data) {
      return {
        success: true,
        clients: data.data.clients || [],
      }
    } else {
      throw new Error(data.message || "Failed to fetch clients")
    }
  } catch (error: any) {
    console.error("Error fetching clients:", error)
    return {
      success: false,
      message: error.message || "An error occurred while fetching clients",
      clients: [],
    }
  }
}

// Get clients by agent
export const getClientsByAgent = async (agentEmail: string) => {
  try {
    const response = await fetchWithAdminAuth(`/api/admin/clients?agentAffiliated=${encodeURIComponent(agentEmail)}`)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Error: ${response.status}`)
    }

    const data = await response.json()

    if (data.success && data.data) {
      return {
        success: true,
        clients: data.data.clients || [],
      }
    } else {
      throw new Error(data.message || "Failed to fetch clients")
    }
  } catch (error: any) {
    console.error("Error fetching clients by agent:", error)
    return {
      success: false,
      message: error.message || "An error occurred while fetching clients",
      clients: [],
    }
  }
}
