"use client"

import type React from "react"

import {
  BarChart3,
  Bell,
  Book,
  Calendar,
  LayoutDashboard,
  ListChecks,
  MessageSquare,
  Settings,
  User2,
  VoicemailIcon as Voice,
  Phone,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()

  return (
    <div className="flex h-screen">
      <div className="hidden border-r bg-gray-100/40 lg:block lg:w-[260px]">
        <ScrollArea className="py-6 pr-4">
          <Link href="/" className="mb-8 flex items-center space-x-2 px-4">
            <LayoutDashboard className="h-6 w-6" />
            <span className="font-bold">Acme</span>
          </Link>
          <div className="mb-4 mt-2 px-4 font-medium text-gray-600">Menu</div>
          <div className="space-y-1">
            <Link
              href="/dashboard"
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                pathname === "/dashboard" ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <LayoutDashboard className="h-5 w-5" />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/dashboard/analytics"
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                pathname === "/dashboard/analytics" ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <BarChart3 className="h-5 w-5" />
              <span>Analytics</span>
            </Link>
            <Link
              href="/dashboard/voice"
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                pathname === "/dashboard/voice" ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Voice className="h-5 w-5" />
              <span>Voice</span>
              <Badge className="ml-auto bg-green-500 text-white text-xs">Live</Badge>
            </Link>
            <Link
              href="/dashboard/calling"
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                pathname === "/dashboard/calling" ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Phone className="h-5 w-5" />
              <span>Calling</span>
              <Badge className="ml-auto bg-green-500 text-white text-xs">Live</Badge>
            </Link>
            <Link
              href="/dashboard/messages"
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                pathname === "/dashboard/messages" ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <MessageSquare className="h-5 w-5" />
              <span>Messages</span>
            </Link>
            <Link
              href="/dashboard/notifications"
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                pathname === "/dashboard/notifications"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Bell className="h-5 w-5" />
              <span>Notifications</span>
            </Link>
            <Link
              href="/dashboard/tasks"
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                pathname === "/dashboard/tasks" ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <ListChecks className="h-5 w-5" />
              <span>Tasks</span>
            </Link>
            <Link
              href="/dashboard/calendar"
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                pathname === "/dashboard/calendar" ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Calendar className="h-5 w-5" />
              <span>Calendar</span>
            </Link>
            <Link
              href="/dashboard/documents"
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                pathname === "/dashboard/documents" ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Book className="h-5 w-5" />
              <span>Documents</span>
            </Link>
          </div>
          <div className="mb-4 mt-2 px-4 font-medium text-gray-600">Team</div>
          <div className="space-y-1">
            <Link
              href="/dashboard/members"
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                pathname === "/dashboard/members" ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <User2 className="h-5 w-5" />
              <span>Members</span>
            </Link>
            <Link
              href="/dashboard/settings"
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                pathname === "/dashboard/settings" ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </Link>
          </div>
        </ScrollArea>
      </div>
      <div className="flex-1">
        <div className="border-b">
          <div className="flex h-16 items-center px-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="ml-auto">
                  <User2 className="mr-2 h-4 w-4" />
                  <span>My Account</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
