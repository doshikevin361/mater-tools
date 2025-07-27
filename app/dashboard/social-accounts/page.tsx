"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import {
  Eye,
  EyeOff,
  Download,
  Users,
  Instagram,
  Facebook,
  RefreshCw,
  Plus,
  CheckCircle,
  XCircle,
  ExternalLink,
  Phone,
  MessageSquare,
  Copy,
  Shield,
  Zap,
  Globe,
  Star,
  TrendingUp,
  Activity,
} from "lucide-react"
import { toast } from "sonner"

interface SocialAccount {
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
  phoneNumber?: string
  status: string
  verified: boolean
  realAccount: boolean
  twilioIntegration?: {
    smsResult?: any
    verificationCode?: string
    smsVerified?: boolean
  }
  creationResult?: {
    message?: string
    error?: string
    accountData?: {
      profileUrl?: string
    }
  }
  createdAt: string
}

export default function SocialAccountsPage() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [count, setCount] = useState(3)
  const [platform, setPlatform] = useState("instagram")
  const [realAccountsOnly, setRealAccountsOnly] = useState(true)
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({})
  const [showVerificationCodes, setShowVerificationCodes] = useState<{ [key: string]: boolean }>({})
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({
    total: 0,
    instagram: 0,
    facebook: 0,
    active: 0,
    verified: 0,
    real: 0,
    smsVerified: 0,
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
  }, [realAccountsOnly])

  const fetchAccounts = async () => {
    setLoading(true)
    try {
      const userId = user?._id 
      const response = await fetch(`/api/social-accounts/list?userId=${userId}&realOnly=${realAccountsOnly}`)
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

  const calculateStats = (accountsList: SocialAccount[]) => {
    const stats = {
      total: accountsList.length,
      instagram: accountsList.filter((acc) => acc.platform === "instagram").length,
      facebook: accountsList.filter((acc) => acc.platform === "facebook").length,
      active: accountsList.filter((acc) => acc.status === "active").length,
      verified: accountsList.filter((acc) => acc.verified).length,
      real: accountsList.filter((acc) => acc.realAccount).length,
      smsVerified: accountsList.filter((acc) => acc.twilioIntegration?.smsVerified).length,
    }
    setStats(stats)
  }

  const createAccounts = async () => {
    if (count < 1 || count > 10) {
      toast.error("Count must be between 1 and 10 for real account creation")
      return
    }

    if (!user) {
      toast.error("Please login first")
      return
    }

    setCreating(true)
    try {
      const response = await fetch("/api/social-accounts/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          count,
          platform,
          userId: user._id,
          useRealCreation: true,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        fetchAccounts() // Refresh the list
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

  const downloadAccounts = async (downloadPlatform = "all") => {
    setDownloading(true)
    try {
      const userId = user?._id
      const response = await fetch(
        `/api/social-accounts/download?platform=${downloadPlatform}&userId=${userId}&realOnly=${realAccountsOnly}`,
      )

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `social-accounts-${downloadPlatform}-${new Date().toISOString().split("T")[0]}.xlsx`
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

  const toggleVerificationCodeVisibility = (accountId: string) => {
    setShowVerificationCodes((prev) => ({
      ...prev,
      [accountId]: !prev[accountId],
    }))
  }

  const filterAccountsByPlatform = (platform: string) => {
    if (platform === "all") return accounts
    return accounts.filter((account) => account.platform === platform)
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard!`)
  }

  const successRate = stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=60 height=60 viewBox=0 0 60 60 xmlns=http://www.w3.org/2000/svg%3E%3Cg fill=none fillRule=evenodd%3E%3Cg fill=%23818cf8 fillOpacity=0.05%3E%3Ccircle cx=30 cy=30 r=2/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse delay-500"></div>

      <div className="relative z-10 mx-auto max-w-7xl space-y-8 p-6">
        {/* Header Section */}
        <div className="text-center py-12">
          <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm border border-indigo-200 rounded-full px-6 py-3 mb-6">
            <Shield className="h-5 w-5 text-indigo-600" />
            <span className="text-sm font-medium text-indigo-700">Secure Account Creation</span>
            <Zap className="h-5 w-5 text-yellow-500" />
          </div>

          <h1 className="text-6xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
            Social Media Account Creator
          </h1>

          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Create authentic Instagram & Facebook accounts with advanced SMS verification, real profile generation, and
            enterprise-grade security features.
          </p>

          <div className="flex items-center justify-center gap-8 mt-8">
            <div className="flex items-center gap-2 text-slate-600">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="font-medium">Real Profiles</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Shield className="h-5 w-5 text-blue-500" />
              <span className="font-medium">SMS Verified</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Globe className="h-5 w-5 text-purple-500" />
              <span className="font-medium">Global Access</span>
            </div>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-6">
          <Card className="bg-white/70 backdrop-blur-sm border border-slate-200/50 hover:bg-white/80 transition-all duration-300 hover:scale-105 hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Accounts</CardTitle>
              <Users className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
              <p className="text-xs text-slate-500 mt-1">All platforms</p>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border border-slate-200/50 hover:bg-white/80 transition-all duration-300 hover:scale-105 hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Instagram</CardTitle>
              <Instagram className="h-4 w-4 text-pink-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stats.instagram}</div>
              <p className="text-xs text-slate-500 mt-1">Active accounts</p>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border border-slate-200/50 hover:bg-white/80 transition-all duration-300 hover:scale-105 hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Facebook</CardTitle>
              <Facebook className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stats.facebook}</div>
              <p className="text-xs text-slate-500 mt-1">Active accounts</p>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border border-slate-200/50 hover:bg-white/80 transition-all duration-300 hover:scale-105 hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{successRate}%</div>
              <Progress value={successRate} className="mt-2 h-2" />
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border border-slate-200/50 hover:bg-white/80 transition-all duration-300 hover:scale-105 hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Verified</CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stats.verified}</div>
              <p className="text-xs text-slate-500 mt-1">Email verified</p>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border border-slate-200/50 hover:bg-white/80 transition-all duration-300 hover:scale-105 hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">SMS Verified</CardTitle>
              <MessageSquare className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stats.smsVerified}</div>
              <p className="text-xs text-slate-500 mt-1">Phone verified</p>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border border-slate-200/50 hover:bg-white/80 transition-all duration-300 hover:scale-105 hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Real Accounts</CardTitle>
              <Star className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stats.real}</div>
              <p className="text-xs text-slate-500 mt-1">Premium quality</p>
            </CardContent>
          </Card>
        </div>

        {/* Account Creation Form */}
        <Card className="bg-white/80 backdrop-blur-sm border border-slate-200/50 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-t-lg border-b border-slate-200/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
                <Plus className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-slate-800">Create Social Media Accounts</CardTitle>
                <CardDescription className="text-slate-600 text-base mt-1">
                  Generate authentic accounts with real profiles, SMS verification, and advanced security features
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Platform Selection */}
              <div className="space-y-4">
                <Label className="text-slate-700 font-semibold text-base flex items-center gap-2">
                  <Globe className="h-4 w-4 text-indigo-500" />
                  Platform
                </Label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger className="h-14 bg-white border-slate-300 hover:border-indigo-400 transition-colors text-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
                    <SelectItem value="instagram" className="hover:bg-slate-50">
                      <div className="flex items-center gap-3 py-2">
                        <div className="p-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg">
                          <Instagram className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <div className="font-medium">Instagram</div>
                          <div className="text-xs text-slate-500">Photo & video sharing</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="facebook" className="hover:bg-slate-50">
                      <div className="flex items-center gap-3 py-2">
                        <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                          <Facebook className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <div className="font-medium">Facebook</div>
                          <div className="text-xs text-slate-500">Social networking</div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Account Count */}
              <div className="space-y-4">
                <Label className="text-slate-700 font-semibold text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-indigo-500" />
                  Account Count
                </Label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={count}
                  onChange={(e) => setCount(Number.parseInt(e.target.value) || 1)}
                  className="h-14 bg-white border-slate-300 hover:border-indigo-400 focus:border-indigo-500 transition-colors text-slate-700 text-center text-lg font-semibold"
                  placeholder="1-10"
                />
                <p className="text-xs text-slate-500 text-center">Maximum 10 accounts per batch</p>
              </div>

              {/* Filter Options */}
              <div className="space-y-4">
                <Label className="text-slate-700 font-semibold text-base flex items-center gap-2">
                  <Shield className="h-4 w-4 text-indigo-500" />
                  Quality Filter
                </Label>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 hover:bg-slate-100 transition-colors">
                  <div className="flex items-center space-x-3">
                    <Switch
                      id="real-only"
                      checked={realAccountsOnly}
                      onCheckedChange={setRealAccountsOnly}
                      className="data-[state=checked]:bg-indigo-500"
                    />
                    <div>
                      <Label htmlFor="real-only" className="text-slate-700 font-medium cursor-pointer">
                        Premium Real Accounts
                      </Label>
                      <p className="text-xs text-slate-500">Higher quality, verified profiles</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Create Button */}
              <div className="space-y-4">
                <Label className="text-slate-700 font-semibold text-base flex items-center gap-2">
                  <Zap className="h-4 w-4 text-indigo-500" />
                  Action
                </Label>
                <Button
                  onClick={createAccounts}
                  disabled={creating}
                  className="w-full h-14 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white border-0 shadow-lg font-semibold text-base transition-all duration-300 hover:scale-105 hover:shadow-xl"
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
                <p className="text-xs text-slate-500 text-center">Estimated time: {count * 30} seconds</p>
              </div>
            </div>

            {/* Features List */}
            <div className="mt-8 pt-8 border-t border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-700">Real Profile Data</div>
                    <div className="text-sm text-slate-500">Authentic names, photos, and details</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
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

        {/* Accounts Management */}
        <Card className="bg-white/80 backdrop-blur-sm border border-slate-200/50 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-indigo-50 rounded-t-lg border-b border-slate-200/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-slate-600 to-indigo-600 rounded-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-slate-800">
                    Account Management ({stats.total})
                  </CardTitle>
                  <CardDescription className="text-slate-600 text-base mt-1">
                    View, manage, and export your {realAccountsOnly ? "premium" : "all"} social media accounts
                  </CardDescription>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => downloadAccounts("instagram")}
                  disabled={downloading}
                  variant="outline"
                  className="border-pink-200 text-pink-700 hover:bg-pink-50 hover:border-pink-300 transition-all duration-300"
                >
                  {downloading ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Instagram
                </Button>
                <Button
                  onClick={() => downloadAccounts("facebook")}
                  disabled={downloading}
                  variant="outline"
                  className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300"
                >
                  {downloading ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Facebook
                </Button>
                <Button
                  onClick={() => downloadAccounts("all")}
                  disabled={downloading}
                  variant="outline"
                  className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-300"
                >
                  {downloading ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Export All
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-slate-100 border border-slate-200">
                <TabsTrigger
                  value="all"
                  className="text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm font-medium"
                >
                  All Accounts ({stats.total})
                </TabsTrigger>
                <TabsTrigger
                  value="instagram"
                  className="text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm font-medium"
                >
                  Instagram ({stats.instagram})
                </TabsTrigger>
                <TabsTrigger
                  value="facebook"
                  className="text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm font-medium"
                >
                  Facebook ({stats.facebook})
                </TabsTrigger>
              </TabsList>

              {["all", "instagram", "facebook"].map((tab) => (
                <TabsContent key={tab} value={tab} className="mt-6">
                  <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 border-slate-200">
                          <TableHead className="text-slate-700 font-semibold">#</TableHead>
                          <TableHead className="text-slate-700 font-semibold">Platform</TableHead>
                          <TableHead className="text-slate-700 font-semibold">Email</TableHead>
                          <TableHead className="text-slate-700 font-semibold">Username</TableHead>
                          <TableHead className="text-slate-700 font-semibold">Password</TableHead>
                          <TableHead className="text-slate-700 font-semibold">Full Name</TableHead>
                          <TableHead className="text-slate-700 font-semibold">Phone</TableHead>
                          <TableHead className="text-slate-700 font-semibold">SMS Code</TableHead>
                          <TableHead className="text-slate-700 font-semibold">Status</TableHead>
                          <TableHead className="text-slate-700 font-semibold">Profile</TableHead>
                          <TableHead className="text-slate-700 font-semibold">Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          <TableRow>
                            <TableCell colSpan={11} className="text-center text-slate-500 py-16">
                              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-indigo-500" />
                              <p className="text-lg font-medium">Loading accounts...</p>
                              <p className="text-sm text-slate-400">Please wait while we fetch your data</p>
                            </TableCell>
                          </TableRow>
                        ) : filterAccountsByPlatform(tab).length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={11} className="text-center text-slate-500 py-16">
                              <div className="flex flex-col items-center">
                                <div className="p-4 bg-slate-100 rounded-full mb-4">
                                  <Users className="h-12 w-12 text-slate-400" />
                                </div>
                                <p className="text-lg font-medium text-slate-600">
                                  No {realAccountsOnly ? "premium " : ""}accounts found
                                </p>
                                <p className="text-sm text-slate-400 mt-1">Create your first account to get started</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          filterAccountsByPlatform(tab).map((account) => (
                            <TableRow
                              key={account._id}
                              className="border-slate-200 hover:bg-slate-50 transition-colors"
                            >
                              <TableCell className="text-slate-700 font-medium">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                    {account.accountNumber || "?"}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Badge
                                    variant="outline"
                                    className={`${
                                      account.platform === "instagram"
                                        ? "bg-pink-50 text-pink-700 border-pink-200"
                                        : "bg-blue-50 text-blue-700 border-blue-200"
                                    } font-medium`}
                                  >
                                    {account.platform === "instagram" ? (
                                      <Instagram className="h-3 w-3 mr-1" />
                                    ) : (
                                      <Facebook className="h-3 w-3 mr-1" />
                                    )}
                                    {account.platform.charAt(0).toUpperCase() + account.platform.slice(1)}
                                  </Badge>
                                  {account.realAccount && (
                                    <Badge className="bg-green-50 text-green-700 border-green-200 font-medium">
                                      <Star className="h-3 w-3 mr-1" />
                                      Premium
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => copyToClipboard(account.email, "Email")}
                                    className="text-slate-700 font-mono text-sm max-w-[200px] truncate hover:text-indigo-600 cursor-pointer transition-colors bg-slate-50 px-2 py-1 rounded"
                                  >
                                    {account.email}
                                  </button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(account.email, "Email")}
                                    className="h-6 w-6 p-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => copyToClipboard(account.username, "Username")}
                                    className="text-slate-700 font-medium hover:text-indigo-600 cursor-pointer transition-colors bg-slate-50 px-2 py-1 rounded"
                                  >
                                    {account.username}
                                  </button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(account.username, "Username")}
                                    className="h-6 w-6 p-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => copyToClipboard(account.password, "Password")}
                                    className="text-slate-700 font-mono text-sm hover:text-indigo-600 cursor-pointer transition-colors bg-slate-50 px-2 py-1 rounded"
                                  >
                                    {showPasswords[account._id] ? account.password : "••••••••"}
                                  </button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => togglePasswordVisibility(account._id)}
                                    className="h-6 w-6 p-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
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
                                {account.phoneNumber ? (
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => copyToClipboard(account.phoneNumber!, "Phone")}
                                      className="text-slate-700 font-mono text-sm hover:text-indigo-600 cursor-pointer transition-colors bg-slate-50 px-2 py-1 rounded"
                                    >
                                      {account.phoneNumber}
                                    </button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => copyToClipboard(account.phoneNumber!, "Phone")}
                                      className="h-6 w-6 p-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                                    >
                                      <Phone className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <span className="text-slate-400">Not available</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {account.twilioIntegration?.verificationCode ? (
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() =>
                                        copyToClipboard(account.twilioIntegration.verificationCode!, "SMS Code")
                                      }
                                      className="text-slate-700 font-mono text-sm hover:text-indigo-600 cursor-pointer transition-colors bg-slate-50 px-2 py-1 rounded"
                                    >
                                      {showVerificationCodes[account._id]
                                        ? account.twilioIntegration.verificationCode
                                        : "••••••"}
                                    </button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => toggleVerificationCodeVisibility(account._id)}
                                      className="h-6 w-6 p-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                                    >
                                      {showVerificationCodes[account._id] ? (
                                        <EyeOff className="h-3 w-3" />
                                      ) : (
                                        <Eye className="h-3 w-3" />
                                      )}
                                    </Button>
                                  </div>
                                ) : (
                                  <span className="text-slate-400">Not available</span>
                                )}
                              </TableCell>
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
                                  {account.twilioIntegration?.smsVerified && (
                                    <Badge className="bg-purple-50 text-purple-700 border-purple-200 font-medium">
                                      <MessageSquare className="h-3 w-3 mr-1" />
                                      SMS
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {account.creationResult?.accountData?.profileUrl ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      window.open(account.creationResult?.accountData?.profileUrl, "_blank")
                                    }
                                    className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
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
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
