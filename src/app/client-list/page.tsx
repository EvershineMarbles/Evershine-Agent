"use client"

import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "@/components/ui/use-toast"
import { agentAPI } from "@/lib/agent-api"

interface Client {
  id: string
  name: string
  email: string
  phone: string
}

interface ClientListProps {
  clients: Client[]
}

export function ClientList({ clients }: ClientListProps) {
  const router = useRouter()
  const [accessingClient, setAccessingClient] = useState<string | null>(null)

  const columns: ColumnDef<Client>[] = [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "phone",
      header: "Phone",
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const client = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleClientSelect(client.id)} disabled={accessingClient !== null}>
                {accessingClient === client.id ? "Accessing..." : "Access Client"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>View Details</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data: clients,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const handleClientSelect = async (clientId: string) => {
    if (!clientId) {
      toast({
        title: "Error",
        description: "Invalid client ID",
        variant: "destructive",
      })
      return
    }

    setAccessingClient(clientId)

    try {
      console.log("Attempting to impersonate client:", clientId)
      const response = await agentAPI.impersonateClient(clientId)
      console.log("Impersonation response:", response)

      if (response.success && response.data && response.data.impersonationToken) {
        // Store the impersonation token
        localStorage.setItem("clientImpersonationToken", response.data.impersonationToken)
        localStorage.setItem("impersonatedClientId", clientId)
        console.log("Impersonation token stored, redirecting to client dashboard")

        // Add a small delay to ensure token is stored before navigation
        setTimeout(() => {
          router.push(`/client-dashboard/${clientId}`)
        }, 100)
      } else {
        console.error("Failed to get impersonation token:", response)
        toast({
          title: "Error",
          description: response.message || "Failed to access client dashboard",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error impersonating client:", error)
      toast({
        title: "Error",
        description: "Failed to access client dashboard. Please try again.",
        variant: "destructive",
      })
    } finally {
      setAccessingClient(null)
    }
  }

  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} data-row-key={row.original.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
