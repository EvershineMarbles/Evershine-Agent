"use client"

import AgentClientsTable from "@/components/agent-clients-table"
import { useSearchParams } from "next/navigation"

interface AgentClientsPageProps {
  params: { agentId: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export default function AgentClientsPage({ params }: AgentClientsPageProps) {
  const searchParams = useSearchParams()
  const agentEmail = searchParams.get("email") as string
  const agentName = searchParams.get("name") as string

  return (
    <div>
      <AgentClientsTable agentEmail={agentEmail} agentName={agentName} />
    </div>
  )
}
