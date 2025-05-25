"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function CheckoutSuccessPage() {
  const router = useRouter()

  // Move the random order number generation inside useEffect to avoid hydration mismatch
  const [orderNumber, setOrderNumber] = useState("")

  useEffect(() => {
    // Generate a random order number - only on client side
    setOrderNumber(`ORD-${Math.floor(100000 + Math.random() * 900000)}`)

    // Redirect to home after 10 seconds
    const timer = setTimeout(() => {
      router.push("/")
    }, 10000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-green-100 p-3">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">Order Confirmed!</h1>

        <p className="text-gray-600 mb-6">
          Thank you for your purchase. Your order has been received and is being processed.
        </p>

        <div className="bg-gray-50 rounded-lg p-4 mb-8">
          <p className="text-sm text-gray-500 mb-2">Order Number</p>
          <p className="text-xl font-bold text-gray-900">{orderNumber}</p>
        </div>

        <p className="text-sm text-gray-500 mb-8">
          A confirmation email has been sent to your registered email address.
        </p>

        <Link href="/">
          <button
            className="inline-flex items-center justify-center px-6 py-3 bg-[#194a95] text-white rounded-lg
                           hover:bg-[#0f3a7a] transition-colors"
          >
            Continue Shopping
            <ArrowRight className="ml-2 h-4 w-4" />
          </button>
        </Link>

        <p className="text-xs text-gray-400 mt-8">You will be redirected to the home page in a few seconds...</p>
      </div>
    </div>
  )
}
