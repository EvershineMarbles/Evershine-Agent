"use client"

import { useParams } from "next/navigation"
import ClientDetails from "@/components/client-details"

export default function ClientDetailsPage() {
  const params = useParams()
  const clientId = params.clientId as string

  return (
    <div className="p-6">
      <ClientDetails clientId={clientId} />
    </div>
  )
}
