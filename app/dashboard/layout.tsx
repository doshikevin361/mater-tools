"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import {
  BarChart3,
  Bell,
  CreditCard,
  Facebook,
  Home,
  Instagram,
  Mail,
  Menu,
  MessageSquare,
  Phone,
  PhoneCall,
  Settings,
  Twitter,
  Users,
  Youtube,
  Mic,
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  {
    name: "Communication",
    items: [
      { name: "Email", href: "/dashboard/email", icon: Mail },
      { name: "SMS", href: "/dashboard/sms", icon: MessageSquare },
      { name: "Voice", href: "/dashboard/voice", icon: Mic },
      { name: "Calling", href: "/dashboard/calling", icon: PhoneCall, badge: "Live" },
      { name: "WhatsApp", href: "/dashboard/whatsapp", icon: Phone },
    ],
  },
  {
    name: "Social Media",
    items: [
      { name: "Facebook", href: "/dashboard/facebook", icon: Facebook },
      { name: "Instagram", href: "/dashboard/instagram", icon: Instagram },
      { name: "Twitter", href: "/dashboard/twitter", icon: Twitter },
      { name: "YouTube", href: "/dashboard/youtube", icon: Youtube },
    ],
  },
  {
    name: "Management",
    items: [
      { name: "Contacts", href: "/dashboard/contacts", icon: Users },
      { name: "Accounts", href: "/dashboard/accounts", icon: Users },
      { name: "Social Accounts", href: "/dashboard/social-accounts", icon: Users },
    ],
  },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

function NavigationContent() {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <Phone className="h-6 w-6" />
          <span>BrandBuzz</span>
        </Link>
        <Button variant="outline" size="icon" className="ml-auto h-8 w-8 bg-transparent">
          <Bell className="h-4 w-4" />
          <span className="sr-only">Toggle notifications</span>
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
          {navigation.map((item) => {
            if (item.items) {
              return (
                <div key={item.name} className="py-2">
                  <h3 className="mb-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {item.name}
                  </h3>
                  {item.items.map((subItem) => {
                    const Icon = subItem.icon
                    const isActive = pathname === subItem.href
                    return (
                      <Link
                        key={subItem.name}
                        href={subItem.href}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 ${
                          isActive ? "bg-gray-100 text-gray-900" : ""
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {subItem.name}
                        {subItem.badge && (
                          <Badge variant="secondary" className="ml-auto text-xs">
                            {subItem.badge}
                          </Badge>
                        )}
                      </Link>
                    )
                  })}
                </div>
              )
            } else {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 ${
                    isActive ? "bg-gray-100 text-gray-900" : ""
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              )
            }
          })}
        </nav>
      </ScrollArea>
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-gray-100/40 md:block">
        <NavigationContent />
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-gray-100/40 px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 md:hidden bg-transparent">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <NavigationContent />
            </SheetContent>
          </Sheet>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
