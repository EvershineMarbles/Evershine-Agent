"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // In a real app, you would make an API call to authenticate
      // For demo purposes, we'll just simulate a delay and check hardcoded credentials
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Simple validation for demo
      if (formData.username === "agent" && formData.password === "password") {
        // Store authentication state in localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem("isAuthenticated", "true")
          localStorage.setItem("agentName", "Rahul")
        }

        toast({
          title: "Login successful",
          description: "Welcome back, Rahul!",
          variant: "default",
        })

        // Redirect to home page
        router.push("/")
      } else {
        toast({
          title: "Login failed",
          description: "Invalid username or password. Try agent/password.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Login error:", error)
      toast({
        title: "Login failed",
        description: "An error occurred during login. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-6">
            <Image src="/logo.png" alt="Evershine Logo" width={180} height={100} priority />
          </div>
          <CardTitle className="text-2xl font-bold text-blue">Consultant Login</CardTitle>
          <CardDescription>Enter your credentials to access the dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                placeholder="Enter your username"
                value={formData.username}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Button variant="link" className="p-0 h-auto text-xs text-blue" type="button">
                  Forgot password?
                </Button>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full bg-blue hover:bg-blue/90 text-white" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            For demo, use username: <span className="font-medium">agent</span> and password:{" "}
            <span className="font-medium">password</span>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

