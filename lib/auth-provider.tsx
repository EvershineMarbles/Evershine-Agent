"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"

type AuthContextType = {
  isAuthenticated: boolean
  agentName: string | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [agentName, setAgentName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if the user is authenticated on initial load
    const storedIsAuthenticated = localStorage.getItem("isAuthenticated") === "true"
    const storedAgentName = localStorage.getItem("agentName")

    setIsAuthenticated(storedIsAuthenticated)
    setAgentName(storedAgentName)
    setIsLoading(false)
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    // In a real app, you would make an API call to authenticate
    // For demo purposes, we'll just check hardcoded credentials
    if (username === "agent" && password === "password") {
      setIsAuthenticated(true)
      setAgentName("Rahul")

      // Store authentication state in localStorage
      localStorage.setItem("isAuthenticated", "true")
      localStorage.setItem("agentName", "Rahul")

      return true
    }

    return false
  }

  const logout = () => {
    setIsAuthenticated(false)
    setAgentName(null)

    // Clear authentication state from localStorage
    localStorage.removeItem("isAuthenticated")
    localStorage.removeItem("agentName")

    // Redirect to login page
    router.push("/login")
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return <AuthContext.Provider value={{ isAuthenticated, agentName, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

