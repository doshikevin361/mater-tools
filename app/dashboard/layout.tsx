"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  BarChart3,
  Bell,
  CreditCard,
  Home,
  Mail,
  MessageSquare,
  Phone,
  PhoneCall,
  Users,
  Zap,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Mic,
  Target,
  Menu,
  X,
} from "lucide-react"

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Home,
    current: false,
  },
  {
    name: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
    current: false,
    badge: "New",
  },
]

const messaging = [
  {
    name: "Email",
    href: "/dashboard/email",
    icon: Mail,
    current: false,
  },
  {
    name: "SMS",
    href: "/dashboard/sms",
    icon: MessageSquare,
    current: false,
  },
  {
    name: "Voice",
    href: "/dashboard/voice",
    icon: Mic,
    current: false,
  },
  {
    name: "Calling",
    href: "/dashboard/calling",
    icon: PhoneCall,
    current: false,
    badge: "Live",
  },
  {
    name: "WhatsApp",
    href: "/dashboard/whatsapp",
    icon: Phone,
    current: false,
    badge: "Growth",
  },
]

const social = [
  {
    name: "Facebook",
    href: "/dashboard/facebook",
    icon: Facebook,
    current: false,
  },
  {
    name: "Instagram",
    href: "/dashboard/instagram",
    icon: Instagram,
    current: false,
  },
  {
    name: "Twitter",
    href: "/dashboard/twitter",
    icon: Twitter,
    current: false,
  },
  {
    name: "YouTube",
    href: "/dashboard/youtube",
    icon: Youtube,
    current: false,
  },
]

const management = [
  {
    name: "Contacts",
    href: "/dashboard/contacts",
    icon: Users,
    current: false,
  },
  {
    name: "Accounts",
    href: "/dashboard/accounts",
    icon: Target,
    current: false,
  },
  {
    name: "Social Accounts",
    href: "/dashboard/social-accounts",
    icon: Zap,
    current: false,
  },
]

const business = [
  {
    name: "Billing",
    href: "/dashboard/billing",
    icon: CreditCard,
    current: false,
    badge: "Trading",
  },
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ")
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? "block" : "hidden"}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-gradient-to-b from-[#654ea3] to-[#eaafc8]">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="ml-2 text-lg font-semibold text-white">BrandBuzz</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="text-white hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {/* Navigation sections remain the same */}
            <div className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={classNames(
                      isActive(item.href)
                        ? "bg-white/20 text-white"
                        : "text-white/90 hover:bg-white/10 hover:text-white",
                      "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200",
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    {item.name}
                    {item.badge && (
                      <Badge className="ml-auto bg-white/20 text-white border-white/30 text-xs">{item.badge}</Badge>
                    )}
                  </Link>
                )
              })}
            </div>

            <div className="pt-4">
              <h3 className="px-2 text-xs font-semibold text-white/70 uppercase tracking-wider">Messaging</h3>
              <div className="mt-2 space-y-1">
                {messaging.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={classNames(
                        isActive(item.href)
                          ? "bg-white/20 text-white"
                          : "text-white/90 hover:bg-white/10 hover:text-white",
                        "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200",
                      )}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                      {item.name}
                      {item.badge && (
                        <Badge className="ml-auto bg-white/20 text-white border-white/30 text-xs">{item.badge}</Badge>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>

            <div className="pt-4">
              <h3 className="px-2 text-xs font-semibold text-white/70 uppercase tracking-wider">Social Media</h3>
              <div className="mt-2 space-y-1">
                {social.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={classNames(
                        isActive(item.href)
                          ? "bg-white/20 text-white"
                          : "text-white/90 hover:bg-white/10 hover:text-white",
                        "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200",
                      )}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            </div>

            <div className="pt-4">
              <h3 className="px-2 text-xs font-semibold text-white/70 uppercase tracking-wider">Management</h3>
              <div className="mt-2 space-y-1">
                {management.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={classNames(
                        isActive(item.href)
                          ? "bg-white/20 text-white"
                          : "text-white/90 hover:bg-white/10 hover:text-white",
                        "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200",
                      )}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            </div>

            <div className="pt-4">
              <h3 className="px-2 text-xs font-semibold text-white/70 uppercase tracking-wider">Business</h3>
              <div className="mt-2 space-y-1">
                {business.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={classNames(
                        isActive(item.href)
                          ? "bg-white/20 text-white"
                          : "text-white/90 hover:bg-white/10 hover:text-white",
                        "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200",
                      )}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                      {item.name}
                      {item.badge && (
                        <Badge className="ml-auto bg-white/20 text-white border-white/30 text-xs">{item.badge}</Badge>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-gradient-to-b from-[#654ea3] to-[#eaafc8] overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="ml-2 text-lg font-semibold text-white">BrandBuzz</span>
          </div>
          <nav className="flex-1 px-2 pb-4 space-y-1">
            <div className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={classNames(
                      isActive(item.href)
                        ? "bg-white/20 text-white"
                        : "text-white/90 hover:bg-white/10 hover:text-white",
                      "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200",
                    )}
                  >
                    <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    {item.name}
                    {item.badge && (
                      <Badge className="ml-auto bg-white/20 text-white border-white/30 text-xs">{item.badge}</Badge>
                    )}
                  </Link>
                )
              })}
            </div>

            <div className="pt-4">
              <h3 className="px-2 text-xs font-semibold text-white/70 uppercase tracking-wider">Messaging</h3>
              <div className="mt-2 space-y-1">
                {messaging.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={classNames(
                        isActive(item.href)
                          ? "bg-white/20 text-white"
                          : "text-white/90 hover:bg-white/10 hover:text-white",
                        "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200",
                      )}
                    >
                      <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                      {item.name}
                      {item.badge && (
                        <Badge className="ml-auto bg-white/20 text-white border-white/30 text-xs">{item.badge}</Badge>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>

            <div className="pt-4">
              <h3 className="px-2 text-xs font-semibold text-white/70 uppercase tracking-wider">Social Media</h3>
              <div className="mt-2 space-y-1">
                {social.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={classNames(
                        isActive(item.href)
                          ? "bg-white/20 text-white"
                          : "text-white/90 hover:bg-white/10 hover:text-white",
                        "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200",
                      )}
                    >
                      <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            </div>

            <div className="pt-4">
              <h3 className="px-2 text-xs font-semibold text-white/70 uppercase tracking-wider">Management</h3>
              <div className="mt-2 space-y-1">
                {management.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={classNames(
                        isActive(item.href)
                          ? "bg-white/20 text-white"
                          : "text-white/90 hover:bg-white/10 hover:text-white",
                        "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200",
                      )}
                    >
                      <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            </div>

            <div className="pt-4">
              <h3 className="px-2 text-xs font-semibold text-white/70 uppercase tracking-wider">Business</h3>
              <div className="mt-2 space-y-1">
                {business.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={classNames(
                        isActive(item.href)
                          ? "bg-white/20 text-white"
                          : "text-white/90 hover:bg-white/10 hover:text-white",
                        "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200",
                      )}
                    >
                      <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                      {item.name}
                      {item.badge && (
                        <Badge className="ml-auto bg-white/20 text-white border-white/30 text-xs">{item.badge}</Badge>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white shadow lg:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500 lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </Button>
          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex-1" />
            <div className="ml-4 flex items-center md:ml-6">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-500">
                <Bell className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
