"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { Instagram, Download, Copy, Eye, EyeOff, Bell } from "lucide-react"

interface Account {
  _id: string
  platform: string
  email: string
  firstName: string
  lastName: string
  username?: string
  password: string
  birthDate: string
  gender: string
  status: string
  needsPhoneVerification: boolean
  createdAt: string
  error?: string
}

interface Notification {
  _id: string
  type: string
  platform: string
  message: string
  timestamp: string
  read: boolean
  data?: any
}

export default function CreateInstagramPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [count, setCount] = useState(1)
  const [progress, setProgress] = useState(0)
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({})
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    failed: 0,
    needsVerification: 0,
    successRate: 0,
  })

  useEffect(() => {
    fetchAccounts()
    fetchNotifications()
    const interval = setInterval(() => {
      if (loading) {
        fetchNotifications()
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [loading])

  const fetchAccounts = async () => {
    try {
      const userData = localStorage.getItem("user")
      if (!userData) return

      const user = JSON.parse(userData)
      const response = await fetch(`/api/social-accounts/list?userId=${user.id}&platform=instagram`)
      const data = await response.json()

      if (data.success) {
        setAccounts(data.accounts)
        calculateStats(data.accounts)
      }
    } catch (error) {
      console.error("Error fetching accounts:", error)
    }
  }

  const fetchNotifications = async () => {
    try {
      const userData = localStorage.getItem("user")
      if (!userData) return

      const user = JSON.parse(userData)
      const response = await fetch(`/api/notifications?userId=${user.id}&limit=20`)
      const data = await response.json()

      if (data.notifications) {
        const instagramNotifications = data.notifications.filter((n: Notification) => n.platform === "instagram")
        setNotifications(instagramNotifications)
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
    }
  }

  const calculateStats = (accountList: Account[]) => {
    const total = accountList.length
    const active = accountList.filter((acc) => acc.status === "active").length
    const failed = accountList.filter((acc) => acc.status === "failed").length
    const needsVerification = accountList.filter((acc) => acc.needsPhoneVerification).length
    const successRate = total > 0 ? Math.round((active / total) * 100) : 0

    setStats({ total, active, failed, needsVerification, successRate })
  }

  const createAccounts = async () => {
    if (count < 1 || count > 5) {
      toast.error("Please enter a number between 1 and 5")
      return
    }

    setLoading(true)
    setProgress(0)

    try {
      const userData = localStorage.getItem("user")
      if (!userData) {
        toast.error("Please log in first")
        return
      }

      const user = JSON.parse(userData)

      const response = await fetch("/api/instagram-accounts/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          count,
          userId: user.id,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`Successfully created ${data.summary.success} Instagram accounts!`)
        if (data.summary.phoneVerification > 0) {
          toast.warning(`${data.summary.phoneVerification} accounts need phone verification`)
        }
        if (data.summary.failed > 0) {
          toast.error(`${data.summary.failed} accounts failed to create`)
        }
        fetchAccounts()
      } else {
        toast.error(data.error || "Failed to create accounts")
      }
    } catch (error) {
      console.error("Error creating accounts:", error)
      toast.error("Failed to create accounts")
    } finally {
      setLoading(false)
      setProgress(0)
    }
  }

  const downloadExcel = async () => {
    try {
      const userData = localStorage.getItem("user")
      if (!userData) return

      const user = JSON.parse(userData)
      const response = await fetch(`/api/social-accounts/download?userId=${user.id}&platform=instagram`)

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.style.display = "none"
        a.href = url
        a.download = `instagram-accounts-${new Date().toISOString().split("T")[0]}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        toast.success("Excel file downloaded successfully!")
      } else {
        toast.error("Failed to download Excel file")
      }
    } catch (error) {
      console.error("Error downloading Excel:", error)
      toast.error("Failed to download Excel file")
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard!")
  }

  const togglePasswordVisibility = (accountId: string) => {
    setShowPasswords((prev) => ({
      ...prev,
      [accountId]: !prev[accountId],
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* Floating Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-20 h-20 bg-pink-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-purple-200 rounded-full opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-pink-300 rounded-full opacity-20 animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-3 rounded-full">
              <Instagram className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Instagram Account Creator
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Create multiple Instagram accounts automatically with advanced anti-detection features and real-time
            notifications.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-pink-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-pink-100 p-2 rounded-lg">
                  <Instagram className="h-6 w-6 text-pink-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Accounts</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-green-100 p-2 rounded-lg">
                  <div className="h-6 w-6 bg-green-600 rounded-full"></div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-yellow-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-yellow-100 p-2 rounded-lg">
                  <div className="h-6 w-6 bg-yellow-600 rounded-full"></div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Need Verification</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.needsVerification}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <div className="h-6 w-6 bg-purple-600 rounded-full"></div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.successRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Account Creation */}
          <div className="lg:col-span-2">
            <Card className="bg-white/80 backdrop-blur-sm border-pink-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Instagram className="h-5 w-5 text-pink-600" />
                  Create Instagram Accounts
                </CardTitle>
                <CardDescription>
                  Generate up to 5 Instagram accounts with Indian profiles and temporary emails
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="count">Number of Accounts (1-5)</Label>
                  <Input
                    id="count"
                    type="number"
                    min="1"
                    max="5"
                    value={count}
                    onChange={(e) => setCount(Number.parseInt(e.target.value) || 1)}
                    className="mt-1"
                    disabled={loading}
                  />
                </div>

                {loading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Creating accounts...</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="w-full" />
                  </div>
                )}

                <div className="flex gap-4">
                  <Button
                    onClick={createAccounts}
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                  >
                    {loading ? "Creating..." : "Create Accounts"}
                  </Button>
                  <Button
                    onClick={downloadExcel}
                    variant="outline"
                    className="border-pink-300 text-pink-600 hover:bg-pink-50 bg-transparent"
                    disabled={accounts.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Accounts List */}
            <Card className="mt-6 bg-white/80 backdrop-blur-sm border-pink-200">
              <CardHeader>
                <CardTitle>Created Accounts ({accounts.length})</CardTitle>
                <CardDescription>Your Instagram accounts with login credentials</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {accounts.map((account) => (
                    <div key={account._id} className="p-4 border border-pink-200 rounded-lg bg-white/50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Instagram className="h-5 w-5 text-pink-600" />
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {account.username || `${account.firstName} ${account.lastName}`}
                            </h3>
                            <p className="text-sm text-gray-600">{account.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              account.status === "active"
                                ? "default"
                                : account.status === "needs_phone_verification"
                                  ? "secondary"
                                  : "destructive"
                            }
                            className={
                              account.status === "active"
                                ? "bg-green-100 text-green-800"
                                : account.status === "needs_phone_verification"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                            }
                          >
                            {account.status === "active"
                              ? "Active"
                              : account.status === "needs_phone_verification"
                                ? "Needs Verification"
                                : "Failed"}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Email:</p>
                          <div className="flex items-center gap-2">
                            <code className="bg-gray-100 px-2 py-1 rounded text-xs">{account.email}</code>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(account.email)}
                              className="h-6 w-6 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        <div>
                          <p className="text-gray-600">Password:</p>
                          <div className="flex items-center gap-2">
                            <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                              {showPasswords[account._id] ? account.password : "••••••••"}
                            </code>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => togglePasswordVisibility(account._id)}
                              className="h-6 w-6 p-0"
                            >
                              {showPasswords[account._id] ? (
                                <EyeOff className="h-3 w-3" />
                              ) : (
                                <Eye className="h-3 w-3" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(account.password)}
                              className="h-6 w-6 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        {account.username && (
                          <div>
                            <p className="text-gray-600">Username:</p>
                            <div className="flex items-center gap-2">
                              <code className="bg-gray-100 px-2 py-1 rounded text-xs">{account.username}</code>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(account.username)}
                                className="h-6 w-6 p-0"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}

                        <div>
                          <p className="text-gray-600">Birth Date:</p>
                          <code className="bg-gray-100 px-2 py-1 rounded text-xs">{account.birthDate}</code>
                        </div>
                      </div>

                      {account.error && (
                        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                          Error: {account.error}
                        </div>
                      )}

                      {account.needsPhoneVerification && (
                        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-600">
                          ⚠️ This account requires phone verification to be fully activated
                        </div>
                      )}
                    </div>
                  ))}

                  {accounts.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Instagram className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No Instagram accounts created yet</p>
                      <p className="text-sm">Create your first batch of accounts to get started</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notifications Panel */}
          <div>
            <Card className="bg-white/80 backdrop-blur-sm border-pink-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-pink-600" />
                  Live Notifications
                </CardTitle>
                <CardDescription>Real-time updates on account creation progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`p-3 rounded-lg border ${
                        notification.type === "account_creation_completed"
                          ? "bg-green-50 border-green-200"
                          : notification.type === "account_created"
                            ? "bg-blue-50 border-blue-200"
                            : notification.type === "account_creation_started"
                              ? "bg-purple-50 border-purple-200"
                              : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <p className="text-sm font-medium text-gray-900">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{new Date(notification.timestamp).toLocaleString()}</p>
                    </div>
                  ))}

                  {notifications.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No notifications yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Features Card */}
            <Card className="mt-6 bg-white/80 backdrop-blur-sm border-pink-200">
              <CardHeader>
                <CardTitle className="text-lg">Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Advanced anti-detection</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Indian profile generation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Temporary email addresses</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Human-like behavior</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Real-time notifications</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Excel export</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
