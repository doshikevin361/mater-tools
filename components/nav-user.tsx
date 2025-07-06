"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { LogOut, User, CreditCard, Bell, ChevronUp, ChevronDown, Sparkles } from "lucide-react"
import { toast } from "sonner"

export function NavUser() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem("user")
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
      } catch (error) {
        console.error("Failed to parse user data:", error)
      }
    }
  }, [])

  const handleLogout = async () => {
    try {
      // Call logout API
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      })

      // Clear local storage
      localStorage.removeItem("user")
      localStorage.removeItem("token")

      // Show success message
      toast.success("Logged out successfully")

      // Redirect to login page
      router.push("/login")
    } catch (error) {
      console.error("Logout error:", error)
      toast.error("Failed to logout. Please try again.")
    }
  }

  const getInitials = (name: string) => {
    if (!name) return "BU"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  const getDisplayName = () => {
    if (!user) return "BrandBuzz User"
    return user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.name || "BrandBuzz User"
  }

  const getEmail = () => {
    if (!user) return "user@brandbuzzventures.com"
    return user.email || "user@brandbuzzventures.com"
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-12 w-full justify-start rounded-none border-b border-purple-300/20 bg-transparent px-4 py-6 text-white hover:bg-white/10"
        >
          <Avatar className="mr-2 h-8 w-8 border-2 border-white/20">
            <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={getDisplayName()} />
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
              {getInitials(getDisplayName())}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col items-start text-left">
            <div className="font-medium text-white">{getDisplayName()}</div>
            <div className="text-xs text-white/70 truncate w-full">{getEmail()}</div>
          </div>
          {isOpen ? (
            <ChevronUp className="ml-auto h-4 w-4 text-white/70" />
          ) : (
            <ChevronDown className="ml-auto h-4 w-4 text-white/70" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[240px] border-purple-100" sideOffset={0} alignOffset={0}>
        <DropdownMenuLabel className="flex flex-col space-y-1">
          <div className="font-medium">{getDisplayName()}</div>
          <div className="text-xs text-muted-foreground">{getEmail()}</div>
        </DropdownMenuLabel>
        <DropdownMenuItem
          className="flex items-center cursor-pointer"
          onClick={() => router.push("/dashboard/upgrade")}
        >
          <Sparkles className="mr-2 h-4 w-4 text-purple-500" />
          Upgrade to Pro
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="flex items-center cursor-pointer"
          onClick={() => router.push("/dashboard/account")}
        >
          <User className="mr-2 h-4 w-4" />
          Account
        </DropdownMenuItem>
        <DropdownMenuItem
          className="flex items-center cursor-pointer"
          onClick={() => router.push("/dashboard/billing")}
        >
          <CreditCard className="mr-2 h-4 w-4" />
          Billing
        </DropdownMenuItem>
        <DropdownMenuItem
          className="flex items-center cursor-pointer"
          onClick={() => router.push("/dashboard/notifications")}
        >
          <Bell className="mr-2 h-4 w-4" />
          Notifications
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="flex items-center cursor-pointer text-red-600 focus:text-red-600"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
