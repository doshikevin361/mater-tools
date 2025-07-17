"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Toaster } from "sonner"
import { NavUser } from "@/components/nav-user"
import { cn } from "@/lib/utils"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/login")
      return
    }

    try {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
    } catch (error) {
      console.error("Failed to parse user data:", error)
      router.push("/login")
    }
  }, [router])

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`)
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-10 flex w-64 flex-col bg-gradient-to-br from-[#654ea3] to-[#eaafc8] transition-transform duration-300 lg:static lg:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-white/20 px-6">
          <div className="flex items-center space-x-2">
            <div className="rounded-full bg-white/20 p-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6 text-white"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white">BrandBuzz</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-4 pb-2">
            <h2 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-white/70">Overview</h2>
            <div className="space-y-1">
              <a
                href="/dashboard"
                className={cn(
                  "flex items-center rounded-md px-2 py-2 text-sm font-medium",
                  isActive("/dashboard") && !isActive("/dashboard/analytics")
                    ? "bg-white/20 text-white"
                    : "text-white/90 hover:bg-white/10 hover:text-white",
                )}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2 h-4 w-4"
                >
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
                Dashboard
              </a>
              <a
                href="/dashboard/analytics"
                className={cn(
                  "flex items-center rounded-md px-2 py-2 text-sm font-medium",
                  isActive("/dashboard/analytics")
                    ? "bg-white/20 text-white"
                    : "text-white/90 hover:bg-white/10 hover:text-white",
                )}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2 h-4 w-4"
                >
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
                Analytics
              </a>
            </div>
          </div>

          <div className="px-4 pb-2 pt-4">
            <h2 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-white/70">Messaging</h2>
            <div className="space-y-1">
              <a
                href="/dashboard/whatsapp"
                className={cn(
                  "flex items-center rounded-md px-2 py-2 text-sm font-medium",
                  isActive("/dashboard/whatsapp")
                    ? "bg-white/20 text-white"
                    : "text-white/90 hover:bg-white/10 hover:text-white",
                )}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2 h-4 w-4"
                >
                  <path d="M3 21l1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z" />
                </svg>
                WhatsApp
                <span className="ml-auto rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">New</span>
              </a>
              <a
                href="/dashboard/email"
                className={cn(
                  "flex items-center rounded-md px-2 py-2 text-sm font-medium",
                  isActive("/dashboard/email")
                    ? "bg-white/20 text-white"
                    : "text-white/90 hover:bg-white/10 hover:text-white",
                )}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2 h-4 w-4"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                Email
              </a>
              <a
                href="/dashboard/voice"
                className={cn(
                  "flex items-center rounded-md px-2 py-2 text-sm font-medium",
                  isActive("/dashboard/voice")
                    ? "bg-white/20 text-white"
                    : "text-white/90 hover:bg-white/10 hover:text-white",
                )}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2 h-4 w-4"
                >
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
                Voice
              </a>
              <a
                href="/dashboard/calling"
                className={cn(
                  "flex items-center rounded-md px-2 py-2 text-sm font-medium",
                  isActive("/dashboard/calling")
                    ? "bg-white/20 text-white"
                    : "text-white/90 hover:bg-white/10 hover:text-white",
                )}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2 h-4 w-4"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                Calling
                <span className="ml-auto rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">Live</span>
              </a>
              <a
                href="/dashboard/sms"
                className={cn(
                  "flex items-center rounded-md px-2 py-2 text-sm font-medium",
                  isActive("/dashboard/sms")
                    ? "bg-white/20 text-white"
                    : "text-white/90 hover:bg-white/10 hover:text-white",
                )}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2 h-4 w-4"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                SMS
              </a>
            </div>
          </div>

          <div className="px-4 pb-2 pt-4">
            <h2 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-white/70">Social Media</h2>
            <div className="space-y-1">
              <a
                href="/dashboard/facebook"
                className={cn(
                  "flex items-center rounded-md px-2 py-2 text-sm font-medium",
                  isActive("/dashboard/facebook")
                    ? "bg-white/20 text-white"
                    : "text-white/90 hover:bg-white/10 hover:text-white",
                )}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2 h-4 w-4"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
                Facebook
                <span className="ml-auto rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">Growth</span>
              </a>
              <a
                href="/dashboard/instagram"
                className={cn(
                  "flex items-center rounded-md px-2 py-2 text-sm font-medium",
                  isActive("/dashboard/instagram")
                    ? "bg-white/20 text-white"
                    : "text-white/90 hover:bg-white/10 hover:text-white",
                )}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2 h-4 w-4"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
                Instagram
                <span className="ml-auto rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">Growth</span>
              </a>
              <a
                href="/dashboard/twitter"
                className={cn(
                  "flex items-center rounded-md px-2 py-2 text-sm font-medium",
                  isActive("/dashboard/twitter")
                    ? "bg-white/20 text-white"
                    : "text-white/90 hover:bg-white/10 hover:text-white",
                )}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2 h-4 w-4"
                >
                  <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
                </svg>
                Twitter
                <span className="ml-auto rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">Trading</span>
              </a>
              <a
                href="/dashboard/youtube"
                className={cn(
                  "flex items-center rounded-md px-2 py-2 text-sm font-medium",
                  isActive("/dashboard/youtube")
                    ? "bg-white/20 text-white"
                    : "text-white/90 hover:bg-white/10 hover:text-white",
                )}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2 h-4 w-4"
                >
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
                </svg>
                YouTube
                <span className="ml-auto rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">Growth</span>
              </a>
              <a
                href="/dashboard/social-automation"
                className={cn(
                  "flex items-center rounded-md px-2 py-2 text-sm font-medium",
                  isActive("/dashboard/social-automation")
                    ? "bg-white/20 text-white"
                    : "text-white/90 hover:bg-white/10 hover:text-white",
                )}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2 h-4 w-4"
                >
                  <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3 3 3 0 0 0 3-3V5a3 3 0 0 0-3-3z" />
                  <path d="M19 11v4a7 7 0 0 1-14 0v-4" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
                AI Automation
                <span className="ml-auto rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 px-2 py-0.5 text-xs font-semibold">
                  AI
                </span>
              </a>
            </div>
          </div>

          <div className="px-4 pb-2 pt-4">
            <h2 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-white/70">Account Creation</h2>
            <div className="space-y-1">
              <a
                href="/dashboard/instagram-accounts"
                className={cn(
                  "flex items-center rounded-md px-2 py-2 text-sm font-medium",
                  isActive("/dashboard/instagram-accounts")
                    ? "bg-white/20 text-white"
                    : "text-white/90 hover:bg-white/10 hover:text-white",
                )}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2 h-4 w-4"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
                Instagram Accounts
                <span className="ml-auto rounded-full bg-pink-500/20 px-2 py-0.5 text-xs font-semibold">Auto</span>
              </a>
              <a
                href="/dashboard/facebook-accounts"
                className={cn(
                  "flex items-center rounded-md px-2 py-2 text-sm font-medium",
                  isActive("/dashboard/facebook-accounts")
                    ? "bg-white/20 text-white"
                    : "text-white/90 hover:bg-white/10 hover:text-white",
                )}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2 h-4 w-4"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
                Facebook Accounts
                <span className="ml-auto rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-semibold">Auto</span>
              </a>
              <a
                href="/dashboard/twitter-accounts"
                className={cn(
                  "flex items-center rounded-md px-2 py-2 text-sm font-medium",
                  isActive("/dashboard/twitter-accounts")
                    ? "bg-white/20 text-white"
                    : "text-white/90 hover:bg-white/10 hover:text-white",
                )}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2 h-4 w-4"
                >
                  <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
                </svg>
                Twitter Accounts
                <span className="ml-auto rounded-full bg-cyan-500/20 px-2 py-0.5 text-xs font-semibold">Auto</span>
              </a>
            </div>
          </div>

          <div className="px-4 pb-2 pt-4">
            <h2 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-white/70">Management</h2>
            <div className="space-y-1">
              <a
                href="/dashboard/contacts"
                className={cn(
                  "flex items-center rounded-md px-2 py-2 text-sm font-medium",
                  isActive("/dashboard/contacts")
                    ? "bg-white/20 text-white"
                    : "text-white/90 hover:bg-white/10 hover:text-white",
                )}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2 h-4 w-4"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                Contacts
              </a>
              <a
                href="/dashboard/accounts"
                className={cn(
                  "flex items-center rounded-md px-2 py-2 text-sm font-medium",
                  isActive("/dashboard/accounts")
                    ? "bg-white/20 text-white"
                    : "text-white/90 hover:bg-white/10 hover:text-white",
                )}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2 h-4 w-4"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                Accounts
                <span className="ml-auto rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">New</span>
              </a>
              <a
                href="/dashboard/social-accounts"
                className={cn(
                  "flex items-center rounded-md px-2 py-2 text-sm font-medium",
                  isActive("/dashboard/social-accounts")
                    ? "bg-white/20 text-white"
                    : "text-white/90 hover:bg-white/10 hover:text-white",
                )}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2 h-4 w-4"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                Social Accounts
                <span className="ml-auto rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">New</span>
              </a>
              <a
                href="/dashboard/billing"
                className={cn(
                  "flex items-center rounded-md px-2 py-2 text-sm font-medium",
                  isActive("/dashboard/billing")
                    ? "bg-white/20 text-white"
                    : "text-white/90 hover:bg-white/10 hover:text-white",
                )}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2 h-4 w-4"
                >
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
                Billing
              </a>
            </div>
          </div>
        </nav>

        {/* User */}
        <div className="mt-auto">
          <NavUser />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex h-16 items-center border-b border-gray-200 bg-white px-4 lg:px-6">
          <button onClick={toggleSidebar} className="mr-4 rounded-md p-1 text-gray-500 hover:bg-gray-100 lg:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="ml-auto flex items-center space-x-4">
            <button className="rounded-full bg-gray-100 p-2 text-gray-600 hover:bg-gray-200">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>
            <button className="rounded-full bg-gray-100 p-2 text-gray-600 hover:bg-gray-200">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <circle cx="12" cy="12" r="1" />
                <circle cx="19" cy="12" r="1" />
                <circle cx="5" cy="12" r="1" />
              </svg>
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">{children}</main>
      </div>

      <Toaster position="top-right" />
    </div>
  )
}
