import axios from "axios"

// Create an axios instance with default configuration
const apiInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "https://evershinebackend-2.onrender.com",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
})

// Add a request interceptor to include the authorization token
apiInstance.interceptors.request.use(
  (config) => {
    // Check if we're in the browser
    if (typeof window === "undefined") {
      return config
    }

    // Get the client impersonation token from localStorage
    const token = localStorage.getItem("clientImpersonationToken")

    // Debug token
    console.log("API Request:", config.url)
    console.log("Token available:", token ? "Yes" : "No")

    // If token exists, add it to the request headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log("Authorization header set")
    } else {
      console.warn("No token found in localStorage")
    }

    return config
  },
  (error) => {
    console.error("Request interceptor error:", error)
    return Promise.reject(error)
  },
)

// Add a response interceptor to handle errors
apiInstance.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Handle authentication errors
    if (error.response && error.response.status === 401) {
      console.error("Authentication error:", error.response.data)

      // You might want to redirect to login or refresh the token here
      if (typeof window !== "undefined") {
        // Check if we have a token but it's invalid/expired
        const hasToken = localStorage.getItem("clientImpersonationToken")
        if (hasToken) {
          console.error("Token exists but is invalid or expired")
          // Clear the invalid token
          localStorage.removeItem("clientImpersonationToken")
        }
      }
    }

    return Promise.reject(error)
  },
)

export default apiInstance
