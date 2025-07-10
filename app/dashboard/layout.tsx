"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  BarChart3,
  CreditCard,
  Facebook,
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
  UserPlus,
} from "lucide-react"

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: BarChart3,
  },
  {
    name: "Communication",
    items: [
      {
        name: "Email",
        href: "/dashboard/email",
        icon: Mail,
      },
      {
        name: "SMS",
        href: "/dashboard/sms",
        icon: MessageSquare,
      },
      {
        name: "Voice Campaigns",
        href: "/dashboard/voice",
        icon: Phone,
      },
      {
        name: "Calling",
        href: "/dashboard/calling",
        icon: PhoneCall,
        badge: "Live",
      },
      {
        name: "WhatsApp",
        href: "/dashboard/whatsapp",
        icon: MessageSquare,
      },
    ],
  },
  {
    name: "Social Media",
    items: [
      {
        name: "Facebook",
        href: "/dashboard/facebook",
        icon: Facebook,
      },
      {
        name: "Instagram",
        href: "/dashboard/instagram",
        icon: Instagram,
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
    ],
  },
  {
    name: "Management",
    items: [
      {
        name: "Contacts",
        href: "/dashboard/contacts",
        icon: Users,
      },
      {
        name: "Accounts",
        href: "/dashboard/accounts",
        icon: UserPlus,
      },
      {
        name: "Social Accounts",
        href: "/dashboard/social-accounts",
        icon: Users,
      },
    ],
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

function NavItem({ item, pathname }: { item: any; pathname: string }) {
  const isActive = pathname === item.href

  return (
    <Link
      href={item.href}
      className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? "bg-blue-100 text-blue-700 border border-blue-200"
          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
      }`}
    >
      <item.icon className="h-5 w-5" />
      <span>{item.name}</span>
      {item.badge && (
        <span className="ml-auto bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
          {item.badge}
        </span>
      )}
    </Link>
  )
}

function NavSection({ section, pathname }: { section: any; pathname: string }) {
  if (section.items) {
    return (
      <div className="space-y-2">
        <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{section.name}</h3>
        <div className="space-y-1">
          {section.items.map((item: any) => (
            <NavItem key={item.name} item={item} pathname={pathname} />
          ))}
        </div>
      </div>
    )
  }

  return <NavItem item={section} pathname={pathname} />
}

function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname()

  return (
    <div className={`flex flex-col h-full bg-white border-r border-gray-200 ${className}`}>
      <div className="flex items-center h-16 px-6 border-b border-gray-200">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">BB</span>
          </div>
          <span className="text-xl font-bold text-gray-900">BrandBuzz</span>
        </Link>
      </div>

      <ScrollArea className="flex-1 px-4 py-6">
        <nav className="space-y-6">
          {navigation.map((section) => (
            <NavSection key={section.name} section={section} pathname={pathname} />
          ))}
        </nav>
      </ScrollArea>

      <div className="p-4 border-t border-gray-200">
        <Link
          href="/dashboard/settings"
          className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        >
          <Settings className="h-5 w-5" />
          <span>Settings</span>
        </Link>
      </div>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden fixed top-4 left-4 z-50">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
