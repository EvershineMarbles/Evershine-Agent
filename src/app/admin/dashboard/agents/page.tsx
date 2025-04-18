"use client"

import { Button } from "@/components/ui/button"
import AgentTable from "@/components/agent-table"
import { Plus } from "lucide-react"

export default function AgentsPage() {
  return (
    <div className="space-y-6">
      <AgentTable />
    </div>
  )
}
