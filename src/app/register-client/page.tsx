import { Suspense } from "react"
import RegisterClient from "@/components/register-client"

function RegisterClientContent() {
  return <RegisterClient />
}

function RegisterClientLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading registration form...</p>
      </div>
    </div>
  )
}

export default function RegisterClientPage() {
  return (
    <Suspense fallback={<RegisterClientLoading />}>
      <RegisterClientContent />
    </Suspense>
  )
}
