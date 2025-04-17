"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Search, Calendar, Bell, CheckCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

// Mock reminder data
const reminders = [
  {
    id: 1,
    clientName: "Rahul Sharma",
    mobile: "9876543210",
    date: "2023-03-25",
    time: "10:00 AM",
    note: "Follow up on marble order",
    completed: false,
  },
  {
    id: 2,
    clientName: "Priya Patel",
    mobile: "8765432109",
    date: "2023-03-26",
    time: "11:30 AM",
    note: "Discuss granite options",
    completed: false,
  },
  {
    id: 3,
    clientName: "Amit Singh",
    mobile: "7654321098",
    date: "2023-03-27",
    time: "2:00 PM",
    note: "Check delivery status",
    completed: false,
  },
  {
    id: 4,
    clientName: "Neha Gupta",
    mobile: "6543210987",
    date: "2023-03-28",
    time: "4:30 PM",
    note: "Send quotation for new project",
    completed: true,
  },
  {
    id: 5,
    clientName: "Vikram Mehta",
    mobile: "5432109876",
    date: "2023-03-29",
    time: "9:00 AM",
    note: "Installation follow-up",
    completed: true,
  },
]

export default function RemindersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [reminderList, setReminderList] = useState(reminders)

  const filteredReminders = reminderList.filter(
    (reminder) =>
      reminder.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reminder.note.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const toggleReminderStatus = (id: number) => {
    setReminderList((prev) =>
      prev.map((reminder) => (reminder.id === id ? { ...reminder, completed: !reminder.completed } : reminder)),
    )
  }

  return (
    <div className="min-h-screen p-6 md:p-12 bg-gray-50">
      <div className="flex flex-col items-center relative mb-8">
        <Link href="/dashboard" className="absolute left-6 md:left-12 top-6 inline-flex items-center text-dark hover:underline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
        <Image src="/logo.png" alt="Evershine Logo" width={180} height={100} priority className="mt-8" />
      </div>

      <h2 className="text-3xl font-bold mb-6 text-center">Follow-up Reminders</h2>

      <div className="relative max-w-md mx-auto mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search reminders by client name or note"
          className="pl-10 h-12"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-4 max-w-4xl mx-auto">
        {filteredReminders.map((reminder) => (
          <Card
            key={reminder.id}
            className={`border-l-4 ${reminder.completed ? "border-l-green-500" : "border-l-blue"}`}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{reminder.clientName}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className={reminder.completed ? "text-green-500" : "text-muted-foreground"}
                  onClick={() => toggleReminderStatus(reminder.id)}
                >
                  <CheckCircle className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="flex items-center text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-2" />
                  {new Date(reminder.date).toLocaleDateString()} at {reminder.time}
                </div>
                <div className="flex items-center text-muted-foreground">
                  <Bell className="h-4 w-4 mr-2" />
                  {reminder.note}
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" size="sm">
                  Call Client
                </Button>
                <Button className="bg-blue hover:bg-blue/90" size="sm">
                  View Client
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredReminders.length === 0 && (
          <div className="text-center py-12">
            <h2 className="text-xl font-medium mb-4">No reminders found</h2>
            <p className="text-muted-foreground mb-6">Try a different search term or add a new reminder</p>
            <Button className="bg-blue hover:bg-blue/90">Add New Reminder</Button>
          </div>
        )}
      </div>
    </div>
  )
}

