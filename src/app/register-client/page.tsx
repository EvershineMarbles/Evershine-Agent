"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import RegisterClient from "@/components/register-client"

const RegisterClientPage = () => {
  const [formData, setFormData] = useState({
    mobile: "",
    // other form fields
  })

  // Add this near the top of your component, after any useState declarations
  const searchParams = useSearchParams()
  const mobileFromParams = searchParams.get("mobile")
  const isVerified = searchParams.get("verified") === "true"

  useEffect(() => {
    if (mobileFromParams && isVerified) {
      // Pre-fill the mobile number in your form
      // This depends on how your form state is managed
      setFormData((prev) => ({
        ...prev,
        mobile: mobileFromParams,
      }))

      // Optionally disable the mobile field since it's already verified
      // This depends on your form implementation
    }
  }, [mobileFromParams, isVerified])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission logic here
    console.log(formData)
  }

  return (
    <div>
      <RegisterClient />
    </div>
  )
}

export default RegisterClientPage
