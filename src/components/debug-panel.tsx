"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface DebugPanelProps {
  clientId?: string
  onRefreshSuccess?: () => void
}

interface TokenDebugInfo {
  agentToken: string | null
  clientImpersonationToken: string | null
  currentClientId: string | null
}

export default function DebugPanel({ clientId = "", onRefreshSuccess }: DebugPanelProps) {
  const { toast } = useToast()
  const [localClientId, setLocalClientId] = useState(clientId)
  const [debugInfo, setDebugInfo] = useState<TokenDebugInfo>({
    agentToken: null,
    clientImpersonationToken: null,
    currentClientId: null,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [requestLog, setRequestLog] = useState<string[]>([])
  const [showLog, setShowLog] = useState(false)

  useEffect(() => {
    if (clientId) {
      setLocalClientId(clientId)
    }

    // Update debug info
    updateDebugInfo()
  }, [clientId])

  const updateDebugInfo = () => {
    setDebugInfo({
      agentToken: localStorage.getItem("agentToken"),
      clientImpersonationToken: localStorage.getItem("clientImpersonationToken"),
      currentClientId: localStorage.getItem("currentClientId"),
    })
  }

  // Function to add a message to the log
  const addToLog = (message: string) => {
    setRequestLog((prev) => [...prev, `[${new Date().toISOString()}] ${message}`])
  }

  // Function to refresh the token
  const handleRefreshToken = async () => {
    setIsLoading(true)
    addToLog("Starting token refresh...")

    try {
      // Clear the current token
      localStorage.removeItem("clientImpersonationToken")
      addToLog("Cleared existing impersonation token")

      // Get the agent token
      const agentToken = localStorage.getItem("agentToken")
      addToLog(`Agent token available: ${agentToken ? "Yes" : "No"}`)

      if (!agentToken) {
        throw new Error("No agent token found")
      }

      // Try the primary endpoint first
      addToLog(`Making request to /api/agent/impersonate/${localClientId}`)
      const response = await fetch(`http://localhost:8000/api/agent/impersonate/${localClientId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${agentToken}`,
          "Content-Type": "application/json",
        },
      })

      addToLog(`Response status: ${response.status} ${response.statusText}`)

      if (!response.ok) {
        const errorText = await response.text()
        addToLog(`Error response: ${errorText}`)
        throw new Error(`Failed to refresh token: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      addToLog(`Response data: ${JSON.stringify(data, null, 2)}`)

      if (data.data && data.data.impersonationToken) {
        // Store the new token
        const token = data.data.impersonationToken
        addToLog(`Received token: ${token.substring(0, 20)}...`)
        localStorage.setItem("clientImpersonationToken", token)
        localStorage.setItem("currentClientId", localClientId)

        toast({
          title: "Token Refreshed",
          description: "Successfully refreshed authentication token",
          variant: "default",
        })

        // Update debug info
        updateDebugInfo()

        // Call success callback if provided
        if (onRefreshSuccess) {
          onRefreshSuccess()
        }
      } else {
        addToLog("Invalid response format - no token found in response")
        throw new Error("Invalid response format from server")
      }
    } catch (error: any) {
      console.error("Error refreshing token:", error)
      addToLog(`Error: ${error.message}`)
      toast({
        title: "Error",
        description: "Failed to refresh token. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Function to test the token
  const testToken = async () => {
    setIsLoading(true)
    addToLog("Testing token with a simple API request...")

    try {
      const token = localStorage.getItem("clientImpersonationToken")

      if (!token) {
        addToLog("No token found in localStorage")
        throw new Error("No token found")
      }

      addToLog(`Using token: ${token.substring(0, 20)}...`)

      // Make a simple request to test the token
      const response = await fetch("http://localhost:8000/api/getUserCart", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      addToLog(`Response status: ${response.status} ${response.statusText}`)

      if (!response.ok) {
        const errorText = await response.text()
        addToLog(`Error response: ${errorText}`)
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      addToLog(`Success! Response: ${JSON.stringify(data, null, 2).substring(0, 100)}...`)

      toast({
        title: "Token Test Successful",
        description: "Your authentication token is working correctly",
        variant: "default",
      })
    } catch (error: any) {
      console.error("Token test failed:", error)
      addToLog(`Error: ${error.message}`)
      toast({
        title: "Token Test Failed",
        description: error.message || "Your authentication token is not working",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Function to clear all tokens and reload
  const handleClearTokens = () => {
    localStorage.removeItem("clientImpersonationToken")
    localStorage.removeItem("currentClientId")
    toast({
      title: "Tokens Cleared",
      description: "Client impersonation tokens have been cleared",
      variant: "default",
    })
    updateDebugInfo()
    addToLog("Client impersonation tokens cleared")
  }

  // Function to set agent token manually
  const handleSetAgentToken = () => {
    const token = prompt("Enter Agent Token:")
    if (token) {
      localStorage.setItem("agentToken", token)
      updateDebugInfo()
      toast({
        title: "Agent Token Set",
        description: "Agent token has been successfully set.",
        variant: "default",
      })
      addToLog(`Agent token set: ${token.substring(0, 20)}...`)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Debug Panel</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="clientId">Client ID</Label>
          <Input id="clientId" value={localClientId} onChange={(e) => setLocalClientId(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <p>
              <strong>Agent Token:</strong>{" "}
              {debugInfo.agentToken ? `${debugInfo.agentToken.substring(0, 20)}...` : "Not set"}
            </p>
            <p>
              <strong>Client Impersonation Token:</strong>{" "}
              {debugInfo.clientImpersonationToken
                ? `${debugInfo.clientImpersonationToken.substring(0, 20)}...`
                : "Not set"}
            </p>
          </div>
          <div>
            <p>
              <strong>Current Client ID:</strong> {debugInfo.currentClientId || "Not set"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleRefreshToken} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Refresh Token
          </Button>
          <Button variant="outline" onClick={testToken} disabled={isLoading}>
            Test Token
          </Button>
          <Button variant="destructive" onClick={handleClearTokens}>
            Clear Tokens
          </Button>
          <Button variant="secondary" onClick={handleSetAgentToken}>
            Set Agent Token
          </Button>
          <Button variant="ghost" onClick={() => setShowLog(!showLog)}>
            {showLog ? "Hide Log" : "Show Log"}
          </Button>
        </div>
        {showLog && (
          <div>
            <Label>Log:</Label>
            <Textarea readOnly value={requestLog.join("\n")} className="h-40 mt-2 text-xs font-mono" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
