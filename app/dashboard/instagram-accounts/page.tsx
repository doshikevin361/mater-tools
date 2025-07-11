"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Eye,
  EyeOff,
  Download,
  Users,
  Instagram,
  RefreshCw,
  Plus,
  CheckCircle,
  XCircle,
  ExternalLink,
  Copy,
  Shield,
  Zap,
  Star,
  TrendingUp,
  Activity,
  Bell,
} from "lucide-react"
import { toast } from "sonner"

interface InstagramAccount {
  _id: string
  accountNumber: number
  platform: string
  email: string
  username: string
  password: string
  profile: {
    firstName: string
    lastName: string
    fullName: string
    birthDate: string
    gender: string
  }
  status: string
  verified: boolean
  creationResult?: {
    message?: string
    error?: string
    profileUrl?: string
  }
  createdAt: string
}

interface Notification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  time: string
  createdAt: string
}

export default function InstagramAccountsPage() {
  const [accounts, setAccounts] = useState<InstagramAccount[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [count, setCount] = useState(3)
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({})
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    verified: 0,
    failed: 0,
  })

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
      } catch (error) {
        console.error("Error parsing user data:", error)
      }
    }

    fetchAccounts()
    fetchNotifications()

    // Set up polling for real-time updates during account creation
    const interval = setInterval(() => {
      if (creating) {
        fetchAccounts()
        fetchNotifications()
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [creating])

  const fetchAccounts = async () => {
    setLoading(true)
    try {
      const userId = user?._id || "demo_user"
      const response = await fetch(`/api/instagram-accounts/create?userId=${userId}`)
      const data = await response.json()

      if (data.success) {
        setAccounts(data.accounts)
        calculateStats(data.accounts)
      }
    } catch (error) {
      console.error("Error fetching accounts:", error)
      toast.error("Failed to fetch accounts")
    } finally {
      setLoading(false)
    }
  }

  const fetchNotifications = async () => {
    try {
      const userId = user?._id || "demo_user"
      const response = await fetch(`/api/notifications?userId=${userId}&limit=10`)
      const data = await response.json()

      if (data.success) {
        setNotifications(data.notifications)
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
    }
  }

  const calculateStats = (accountsList: InstagramAccount[]) => {
    const stats = {
      total: accountsList.length,
      active: accountsList.filter((acc) => acc.status === "active").length,
      verified: accountsList.filter((acc) => acc.verified).length,
      failed: accountsList.filter((acc) => acc.status === "failed").length,
    }
    setStats(stats)
  }

  const createAccounts = async () => {
    if (count < 1 || count > 5) {
      toast.error("Count must be between 1 and 5")
      return
    }

    if (!user) {
      toast.error("Please login first")
      return
    }

    setCreating(true)
    try {
      const response = await fetch("/api/instagram-accounts/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          count,
          userId: user._id || "demo_user",
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        fetchAccounts()
        fetchNotifications()
      } else {
        toast.error(data.message || "Failed to create accounts")
      }
    } catch (error) {
      console.error("Error creating accounts:", error)
      toast.error("Failed to create accounts")
    } finally {
      setCreating(false)
    }
  }

  const downloadAccounts = async () => {
    setDownloading(true)
    try {
      const userId = user?._id || "demo_user"
      const response = await fetch(`/api/instagram-accounts/download?userId=${userId}`)

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `instagram-accounts-${new Date().toISOString().split("T")[0]}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success("Download started!")
      } else {
        toast.error("Failed to download accounts")
      }
    } catch (error) {
      console.error("Error downloading accounts:", error)
      toast.error("Failed to download accounts")
    } finally {
      setDownloading(false)
    }
  }

  const togglePasswordVisibility = (accountId: string) => {
    setShowPasswords((prev) => ({
      ...prev,
      [accountId]: !prev[accountId],
    }))
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard!`)
  }

  const successRate = stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-100 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=60 height=60 viewBox=0 0 60 60 xmlns=http://www.w3.org/2000/svg%3E%3Cg fill=none fillRule=evenodd%3E%3Cg fill=%23ec4899 fillOpacity=0.05%3E%3Ccircle cx=30 cy=30 r=2/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-pink-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <div className="relative z-10 mx-auto max-w-7xl space-y-8 p-6">
        {/* Header Section */}
        <div className="text-center py-12">
          <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm border border-pink-200 rounded-full px-6 py-3 mb-6">
            <Instagram className="h-5 w-5 text-pink-600" />
            <span className="text-sm font-medium text-pink-700">Instagram Account Creator</span>
            <Zap className="h-5 w-5 text-yellow-500" />
          </div>

          <h1 className="text-6xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-6">
            Instagram Account Automation
          </h1>

          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Create authentic Instagram accounts with advanced automation, real profile generation, and enterprise-grade
            security features.
          </p>

          <div className="flex items-center justify-center gap-8 mt-8">
            <div className="flex items-center gap-2 text-slate-600">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="font-medium">Real Profiles</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Shield className="h-5 w-5 text-blue-500" />
              <span className="font-medium">Secure Creation</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Star className="h-5 w-5 text-yellow-500" />
              <span className="font-medium">High Success Rate</span>
            </div>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-white/70 backdrop-blur-sm border border-pink-200/50 hover:bg-white/80 transition-all duration-300 hover:scale-105 hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Accounts</CardTitle>
              <Users className="h-4 w-4 text-pink-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
              <p className="text-xs text-slate-500 mt-1">Instagram accounts</p>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border border-pink-200/50 hover:bg-white/80 transition-all duration-300 hover:scale-105 hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{successRate}%</div>
              <Progress value={successRate} className="mt-2 h-2" />
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border border-pink-200/50 hover:bg-white/80 transition-all duration-300 hover:scale-105 hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Active Accounts</CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stats.active}</div>
              <p className="text-xs text-slate-500 mt-1">Successfully created</p>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border border-pink-200/50 hover:bg-white/80 transition-all duration-300 hover:scale-105 hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Failed Accounts</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stats.failed}</div>
              <p className="text-xs text-slate-500 mt-1">Creation failed</p>
            </CardContent>
          </Card>
        </div>

        {/* Notifications Panel */}
        {notifications.length > 0 && (
          <Card className="bg-white/80 backdrop-blur-sm border border-pink-200/50 shadow-xl">
            <CardHeader>
              <CardTitle className="text-pink-600 flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Recent Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-40 overflow-y-auto">
                {notifications.slice(0, 5).map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border ${
                      notification.type === "success"
                        ? "bg-green-50 border-green-200 text-green-800"
                        : notification.type === "error"
                          ? "bg-red-50 border-red-200 text-red-800"
                          : notification.type === "warning"
                            ? "bg-yellow-50 border-yellow-200 text-yellow-800"
                            : "bg-blue-50 border-blue-200 text-blue-800"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{notification.title}</h4>
                        <p className="text-sm mt-1">{notification.message}</p>
                      </div>
                      <span className="text-xs opacity-70">{notification.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Account Creation Form */}
        <Card className="bg-white/80 backdrop-blur-sm border border-pink-200/50 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10 rounded-t-lg border-b border-pink-200/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg">
                <Plus className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-slate-800">Create Instagram Accounts</CardTitle>
                <CardDescription className="text-slate-600 text-base mt-1">
                  Generate authentic Instagram accounts with real profiles and advanced automation
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Account Count */}
              <div className="space-y-4">
                <Label className="text-slate-700 font-semibold text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-pink-500" />
                  Account Count
                </Label>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={count}
                  onChange={(e) => setCount(Number.parseInt(e.target.value) || 1)}
                  className="h-14 bg-white border-pink-300 hover:border-pink-400 focus:border-pink-500 transition-colors text-slate-700 text-center text-lg font-semibold"
                  placeholder="1-5"
                />
                <p className="text-xs text-slate-500 text-center">Maximum 5 accounts per batch</p>
              </div>

              {/* Create Button */}
              <div className="space-y-4">
                <Label className="text-slate-700 font-semibold text-base flex items-center gap-2">
                  <Zap className="h-4 w-4 text-pink-500" />
                  Action
                </Label>
                <Button
                  onClick={createAccounts}
                  disabled={creating}
                  className="w-full h-14 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-700 hover:via-purple-700 hover:to-indigo-700 text-white border-0 shadow-lg font-semibold text-base transition-all duration-300 hover:scale-105 hover:shadow-xl"
                >
                  {creating ? (
                    <>
                      <RefreshCw className="mr-3 h-5 w-5 animate-spin" />
                      Creating {count} Account{count > 1 ? "s" : ""}...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-3 h-5 w-5" />
                      Create {count} Account{count > 1 ? "s" : ""}
                    </>
                  )}
                </Button>
                <p className="text-xs text-slate-500 text-center">Estimated time: {count * 60} seconds</p>
              </div>

              {/* Download Button */}
              <div className="space-y-4">
                <Label className="text-slate-700 font-semibold text-base flex items-center gap-2">
                  <Download className="h-4 w-4 text-pink-500" />
                  Export
                </Label>
                <Button
                  onClick={downloadAccounts}
                  disabled={downloading || stats.total === 0}
                  variant="outline"
                  className="w-full h-14 border-pink-200 text-pink-700 hover:bg-pink-50 hover:border-pink-300 transition-all duration-300 font-semibold text-base bg-transparent"
                >
                  {downloading ? (
                    <>
                      <RefreshCw className="mr-3 h-5 w-5 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="mr-3 h-5 w-5" />
                      Download Excel
                    </>
                  )}
                </Button>
                <p className="text-xs text-slate-500 text-center">{stats.total} accounts available</p>
              </div>
            </div>

            {/* Features List */}
            <div className="mt-8 pt-8 border-t border-pink-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-700">Real Profile Data</div>
                    <div className="text-sm text-slate-500">Authentic Indian names and details</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Shield className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-700">Advanced Security</div>
                    <div className="text-sm text-slate-500">Anti-detection measures</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Activity className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-700">High Success Rate</div>
                    <div className="text-sm text-slate-500">95%+ account creation success</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Accounts Table */}
        <Card className="bg-white/80 backdrop-blur-sm border border-pink-200/50 shadow-xl">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg">
                  <Instagram className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-slate-800">
                    Instagram Accounts ({stats.total})
                  </CardTitle>
                  <CardDescription className="text-slate-600 text-base mt-1">
                    View and manage your created Instagram accounts
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="rounded-lg border border-pink-200 bg-white overflow-hidden shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-pink-50 border-pink-200">
                    <TableHead className="text-slate-700 font-semibold">#</TableHead>
                    <TableHead className="text-slate-700 font-semibold">Email</TableHead>
                    <TableHead className="text-slate-700 font-semibold">Username</TableHead>
                    <TableHead className="text-slate-700 font-semibold">Password</TableHead>
                    <TableHead className="text-slate-700 font-semibold">Full Name</TableHead>
                    <TableHead className="text-slate-700 font-semibold">Status</TableHead>
                    <TableHead className="text-slate-700 font-semibold">Profile</TableHead>
                    <TableHead className="text-slate-700 font-semibold">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-slate-500 py-16">
                        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-pink-500" />
                        <p className="text-lg font-medium">Loading accounts...</p>
                      </TableCell>
                    </TableRow>
                  ) : accounts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-slate-500 py-16">
                        <div className="flex flex-col items-center">
                          <div className="p-4 bg-pink-100 rounded-full mb-4">
                            <Instagram className="h-12 w-12 text-pink-400" />
                          </div>
                          <p className="text-lg font-medium text-slate-600">No Instagram accounts found</p>
                          <p className="text-sm text-slate-400 mt-1">Create your first account to get started</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    accounts.map((account) => (
                      <TableRow key={account._id} className="border-pink-200 hover:bg-pink-50 transition-colors">
                        <TableCell className="text-slate-700 font-medium">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                              {account.accountNumber || "?"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => copyToClipboard(account.email, "Email")}
                              className="text-slate-700 font-mono text-sm max-w-[200px] truncate hover:text-pink-600 cursor-pointer transition-colors bg-slate-50 px-2 py-1 rounded"
                            >
                              {account.email}
                            </button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(account.email, "Email")}
                              className="h-6 w-6 p-0 text-slate-400 hover:text-pink-600 hover:bg-pink-50 transition-all"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => copyToClipboard(account.username, "Username")}
                              className="text-slate-700 font-medium hover:text-pink-600 cursor-pointer transition-colors bg-slate-50 px-2 py-1 rounded"
                            >
                              {account.username}
                            </button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(account.username, "Username")}
                              className="h-6 w-6 p-0 text-slate-400 hover:text-pink-600 hover:bg-pink-50 transition-all"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => copyToClipboard(account.password, "Password")}
                              className="text-slate-700 font-mono text-sm hover:text-pink-600 cursor-pointer transition-colors bg-slate-50 px-2 py-1 rounded"
                            >
                              {showPasswords[account._id] ? account.password : "••••••••"}
                            </button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => togglePasswordVisibility(account._id)}
                              className="h-6 w-6 p-0 text-slate-400 hover:text-pink-600 hover:bg-pink-50 transition-all"
                            >
                              {showPasswords[account._id] ? (
                                <EyeOff className="h-3 w-3" />
                              ) : (
                                <Eye className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-700 font-medium">{account.profile.fullName}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={`${
                                account.status === "active"
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : "bg-red-50 text-red-700 border-red-200"
                              } font-medium`}
                            >
                              {account.status === "active" ? (
                                <CheckCircle className="h-3 w-3 mr-1" />
                              ) : (
                                <XCircle className="h-3 w-3 mr-1" />
                              )}
                              {account.status}
                            </Badge>
                            {account.verified && (
                              <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-medium">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {account.creationResult?.profileUrl ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(account.creationResult?.profileUrl, "_blank")}
                              className="h-8 w-8 p-0 text-slate-400 hover:text-pink-600 hover:bg-pink-50 transition-all"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          ) : (
                            <span className="text-slate-400">Not available</span>
                          )}
                        </TableCell>
                        <TableCell className="text-slate-500 text-sm">
                          {new Date(account.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
