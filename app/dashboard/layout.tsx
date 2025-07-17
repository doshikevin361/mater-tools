"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  BarChart3,
  Bell,
  CreditCard,
  Home,
  Mail,
  Menu,
  MessageSquare,
  Phone,
  Users,
  Zap,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  PhoneCall,
  Bot,
  Mic,
} from "lucide-react"

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    name: "Email Marketing",
    href: "/dashboard/email",
    icon: Mail,
  },
  {
    name: "SMS Campaigns",
    href: "/dashboard/sms",
    icon: MessageSquare,
  },
  {
    name: "Voice Calls",
    href: "/dashboard/voice",
    icon: Phone,
  },
  {
    name: "Live Calling",
    href: "/dashboard/live-calling",
    icon: Mic,
    badge: "LIVE",
  },
  {
    name: "Browser Calling",
    href: "/dashboard/calling",
    icon: PhoneCall,
  },
  {
    name: "WhatsApp",
    href: "/dashboard/whatsapp",
    icon: MessageSquare,
  },
  {
    name: "AI Automation",
    href: "/dashboard/social-automation",
    icon: Bot,
    badge: "AI",
  },
  {
    name: "Social Accounts",
    href: "/dashboard/social-accounts",
    icon: Users,
  },
  {
    name: "Instagram Accounts",
    href: "/dashboard/instagram-accounts",
    icon: Instagram,
  },
  {
    name: "Facebook Accounts",
    href: "/dashboard/facebook-accounts",
    icon: Facebook,
  },
  {
    name: "Twitter Accounts",
    href: "/dashboard/twitter-accounts",
    icon: Twitter,
  },
  {
    name: "Instagram",
    href: "/dashboard/instagram",
    icon: Instagram,
  },
  {
    name: "Facebook",
    href: "/dashboard/facebook",
    icon: Facebook,
  },
  {
    name: "Twitter",
    href: "/dashboard/twitter",
    icon: Twitter,
  },
  {
    name: "YouTube",
    href: "/dashboard/youtube",
    icon: Youtube,
  },
  {
    name: "Contacts",
    href: "/dashboard/contacts",
    icon: Users,
  },
  {
    name: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    name: "Billing",
    href: "/dashboard/billing",
    icon: CreditCard,
  },
]

function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="space-y-2">
      {navigation.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.name}
            {item.badge && (
              <span
                className={cn(
                  "ml-auto rounded-full px-2 py-0.5 text-xs font-medium",
                  item.badge === "LIVE"
                    ? "bg-red-100 text-red-700"
                    : item.badge === "AI"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-blue-100 text-blue-700",
                )}
              >
                {item.badge}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden w-64 flex-col border-r bg-muted/40 lg:flex">
        <div className="flex h-14 items-center border-b px-4">
          <Link className="flex items-center gap-2 font-semibold" href="/dashboard">
            <Zap className="h-6 w-6" />
            <span>BrandBuzz</span>
          </Link>
        </div>
        <ScrollArea className="flex-1 px-3 py-4">
          <Navigation />
        </ScrollArea>
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 lg:hidden bg-transparent">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col">
          <div className="flex h-14 items-center border-b px-4">
            <Link className="flex items-center gap-2 font-semibold" href="/dashboard">
              <Zap className="h-6 w-6" />
              <span>BrandBuzz</span>
            </Link>
          </div>
          <ScrollArea className="flex-1 px-3 py-4">
            <Navigation />
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:px-6">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 lg:hidden bg-transparent">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
          </Sheet>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Dashboard</h1>
          </div>
          <Button variant="outline" size="icon">
            <Bell className="h-4 w-4" />
            <span className="sr-only">Toggle notifications</span>
          </Button>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
