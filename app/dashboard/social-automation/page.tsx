"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Instagram,
  Facebook,
  Twitter,
  Users,
  Bot,
  CheckCircle,
  XCircle,
  Download,
  RefreshCw,
  Play,
  Clock,
  Eye,
  EyeOff,
  Copy,
  Zap,
  Activity,
  TrendingUp,
  Shield,
} from "lucide-react"
import { toast } from "sonner"

interface AutomationAccount {
  id: string
  platform: string
  accountNumber: number
  username: string
  email: string
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
  createdAt: string
}

interface AutomationJob {
  id: string
  platforms: string[]
  totalAccounts: number
  accountsPerPlatform: number
  status: string
  progress: number
  currentTask?: string
  startedAt: string
  completedAt?: string
  totalCreated?: number
  totalFailed?: number
}

export default function SocialAutomationPage() {
  const [accounts, setAccounts] = useState<AutomationAccount[]>([])
  const [jobs, setJobs] = useState<AutomationJob[]>([])
  const [stats, setStats] = useState({
    total: 0,
    instagram: 0,
    facebook: 0,
    twitter: 0,
    active: 0,
    verified: 0,
  })

  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [downloading, setDownloading] = useState(false)

  // Form state
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["instagram"])
  const [accountCount, setAccountCount] = useState(3)
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({})

  const [user, setUser] = useState<any>(null)
  const [activeJob, setActiveJob] = useState<AutomationJob | null>(null)

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
    fetchJobs()

    // Poll for active jobs
    const interval = setInterval(() => {
      if (activeJob && activeJob.status === "processing") {
        fetchJobStatus(activeJob.id)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [activeJob])

  const fetchAccounts = async () => {
    setLoading(true)
    try {
      const userId = user?._id || "demo_user"
      const response = await fetch(`/api/social-automation/accounts?userId=${userId}`)
      const data = await response.json()

      if (data.success) {
        setAccounts(data.accounts)
        setStats(data.stats)
      }
    } catch (error) {
      console.error("Error fetching accounts:", error)
      toast.error("Failed to fetch accounts")
    } finally {
      setLoading(false)
    }
  }

  const fetchJobs = async () => {
    try {
      const userId = user?._id || "demo_user"
      const response = await fetch(`/api/social-automation/status?userId=${userId}`)
      const data = await response.json()

      if (data.success) {
        setJobs(data.jobs)
        const processingJob = data.jobs.find((job: AutomationJob) => job.status === "processing")
        if (processingJob) {
          setActiveJob(processingJob)
        }
      }
    } catch (error) {
      console.error("Error fetching jobs:", error)
    }
  }

  const fetchJobStatus = async (jobId: string) => {
    try {
      const userId = user?._id || "demo_user"
      const response = await fetch(`/api/social-automation/status?userId=${userId}&jobId=${jobId}`)
      const data = await response.json()

      if (data.success) {
        setActiveJob(data.job)
        if (data.job.status === "completed") {
          setActiveJob(null)
          fetchAccounts() // Refresh accounts list
          fetchJobs() // Refresh jobs list
          toast.success(`Account creation completed! ${data.job.totalCreated} accounts created.`)
        }
      }
    } catch (error) {
      console.error("Error fetching job status:", error)
    }
  }

  const startAutomation = async () => {
    if (selectedPlatforms.length === 0) {
      toast.error("Please select at least one platform")
      return
    }

    if (accountCount < 1 || accountCount > 10) {
      toast.error("Account count must be between 1 and 10")
      return
    }

    if (!user) {
      toast.error("Please login first")
      return
    }

    setCreating(true)
    try {
      const response = await fetch("/api/social-automation/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          platforms: selectedPlatforms,
          count: accountCount,
          userId: user._id || "demo_user",
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`Account creation started! Creating ${data.totalAccounts} accounts.`)
        fetchJobs()
      } else {
        toast.error(data.message || "Failed to start account creation")
      }
    } catch (error) {
      console.error("Error starting automation:", error)
      toast.error("Failed to start account creation")
    } finally {
      setCreating(false)
    }
  }

  const downloadAccounts = async (platform = "all") => {
    setDownloading(true)
    try {
      const userId = user?._id || "demo_user"
      const response = await fetch(`/api/social-automation/download?platform=${platform}&userId=${userId}`)

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `social-automation-accounts-${platform}-${new Date().toISOString().split("T")[0]}.xlsx`
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

  const handlePlatformChange = (platform: string, checked: boolean) => {
    if (checked) {
      setSelectedPlatforms((prev) => [...prev, platform])
    } else {
      setSelectedPlatforms((prev) => prev.filter((p) => p !== platform))
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "instagram":
        return <Instagram className="h-4 w-4 text-pink-500" />
      case "facebook":
        return <Facebook className="h-4 w-4 text-blue-500" />
      case "twitter":
        return <Twitter className="h-4 w-4 text-sky-500" />
      default:
        return <Bot className="h-4 w-4" />
    }
  }

  const filterAccountsByPlatform = (platform: string) => {
    if (platform === "all") return accounts
    return accounts.filter((account) => account.platform === platform)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=60 height=60 viewBox=0 0 60 60 xmlns=http://www.w3.org/2000/svg%3E%3Cg fill=none fillRule=evenodd%3E%3Cg fill=%23818cf8 fillOpacity=0.05%3E%3Ccircle cx=30 cy=30 r=2/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <div className="relative z-10 mx-auto max-w-7xl space-y-8 p-6">
        {/* Header Section */}
        <div className="text-center py-12">
          <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm border border-indigo-200 rounded-full px-6 py-3 mb-6">
            <Bot className="h-5 w-5 text-indigo-600" />
            <span className="text-sm font-medium text-indigo-700">Social Media Automation</span>
            <Zap className="h-5 w-5 text-yellow-500" />
          </div>

          <h1 className="text-6xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
            Social Media Account Creator
          </h1>

          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Automate the creation of Instagram, Facebook, and Twitter accounts with intelligent notifications and
            progress tracking.
          </p>
        </div>

        {/* Active Job Alert */}
        {activeJob && (
          <Alert className="bg-blue-50 border-blue-200">
            <Activity className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <div className="flex items-center justify-between">
                <div>
                  <strong>Account Creation in Progress:</strong> {activeJob.currentTask || "Processing..."}
                </div>
                <div className="flex items-center gap-4">
                  <Progress value={activeJob.progress} className="w-32" />
                  <span className="text-sm font-medium">{activeJob.progress}%</span>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
          <Card className="bg-white/70 backdrop-blur-sm border border-slate-200/50 hover:bg-white/80 transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total</CardTitle>
              <Users className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border border-slate-200/50 hover:bg-white/80 transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Instagram</CardTitle>
              <Instagram className="h-4 w-4 text-pink-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stats.instagram}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border border-slate-200/50 hover:bg-white/80 transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Facebook</CardTitle>
              <Facebook className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stats.facebook}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border border-slate-200/50 hover:bg-white/80 transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Twitter</CardTitle>
              <Twitter className="h-4 w-4 text-sky-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stats.twitter}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border border-slate-200/50 hover:bg-white/80 transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Active</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stats.active}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border border-slate-200/50 hover:bg-white/80 transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Verified</CardTitle>
              <Shield className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stats.verified}</div>
            </CardContent>
          </Card>
        </div>

        {/* Account Creation Form */}
        <Card className="bg-white/80 backdrop-blur-sm border border-slate-200/50 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-t-lg border-b border-slate-200/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-slate-800">Create Social Media Accounts</CardTitle>
                <CardDescription className="text-slate-600 text-base mt-1">
                  Automated account creation with real-time notifications and progress tracking
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Platform Selection */}
              <div className="space-y-4">
                <Label className="text-slate-700 font-semibold text-base flex items-center gap-2">
                  <Bot className="h-4 w-4 text-indigo-500" />
                  Select Platforms
                </Label>
                <div className="space-y-3">
                  {[
                    { id: "instagram", name: "Instagram", icon: Instagram, color: "text-pink-500" },
                    { id: "facebook", name: "Facebook", icon: Facebook, color: "text-blue-500" },
                    { id: "twitter", name: "Twitter", icon: Twitter, color: "text-sky-500" },
                  ].map((platform) => (
                    <div
                      key={platform.id}
                      className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <Checkbox
                        id={platform.id}
                        checked={selectedPlatforms.includes(platform.id)}
                        onCheckedChange={(checked) => handlePlatformChange(platform.id, checked as boolean)}
                        className="data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500"
                      />
                      <platform.icon className={`h-5 w-5 ${platform.color}`} />
                      <Label htmlFor={platform.id} className="text-slate-700 font-medium cursor-pointer">
                        {platform.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Account Count */}
              <div className="space-y-4">
                <Label className="text-slate-700 font-semibold text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-indigo-500" />
                  Accounts per Platform
                </Label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={accountCount}
                  onChange={(e) => setAccountCount(Number.parseInt(e.target.value) || 1)}
                  className="h-14 bg-white border-slate-300 hover:border-indigo-400 focus:border-indigo-500 transition-colors text-slate-700 text-center text-lg font-semibold"
                  placeholder="1-10"
                />
                <p className="text-xs text-slate-500 text-center">Maximum 10 accounts per platform</p>
              </div>

              {/* Summary & Action */}
              <div className="space-y-4">
                <Label className="text-slate-700 font-semibold text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-indigo-500" />
                  Summary
                </Label>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex justify-between">
                      <span>Platforms:</span>
                      <span className="font-medium">{selectedPlatforms.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Accounts per platform:</span>
                      <span className="font-medium">{accountCount}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span>Total accounts:</span>
                      <span className="font-bold text-indigo-600">{selectedPlatforms.length * accountCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Estimated time:</span>
                      <span className="font-medium">{selectedPlatforms.length * accountCount} minutes</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={startAutomation}
                  disabled={creating || selectedPlatforms.length === 0 || !!activeJob}
                  className="w-full h-14 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white border-0 shadow-lg font-semibold text-base transition-all duration-300 hover:scale-105 hover:shadow-xl"
                >
                  {creating ? (
                    <>
                      <RefreshCw className="mr-3 h-5 w-5 animate-spin" />
                      Starting Automation...
                    </>
                  ) : activeJob ? (
                    <>
                      <Clock className="mr-3 h-5 w-5" />
                      Creation in Progress
                    </>
                  ) : (
                    <>
                      <Play className="mr-3 h-5 w-5" />
                      Start Automation
                    </>
                  )}
                </Button>
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
                    View, manage, and export your automated social media accounts
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
                  onClick={() => downloadAccounts("twitter")}
                  disabled={downloading}
                  variant="outline"
                  className="border-sky-200 text-sky-700 hover:bg-sky-50 hover:border-sky-300 transition-all duration-300"
                >
                  {downloading ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Twitter
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
              <TabsList className="grid w-full grid-cols-4 bg-slate-100 border border-slate-200">
                <TabsTrigger
                  value="all"
                  className="text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-900 font-medium"
                >
                  All ({stats.total})
                </TabsTrigger>
                <TabsTrigger
                  value="instagram"
                  className="text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-900 font-medium"
                >
                  Instagram ({stats.instagram})
                </TabsTrigger>
                <TabsTrigger
                  value="facebook"
                  className="text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-900 font-medium"
                >
                  Facebook ({stats.facebook})
                </TabsTrigger>
                <TabsTrigger
                  value="twitter"
                  className="text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-900 font-medium"
                >
                  Twitter ({stats.twitter})
                </TabsTrigger>
              </TabsList>

              {["all", "instagram", "facebook", "twitter"].map((tab) => (
                <TabsContent key={tab} value={tab} className="mt-6">
                  <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 border-slate-200">
                          <TableHead className="text-slate-700 font-semibold">#</TableHead>
                          <TableHead className="text-slate-700 font-semibold">Platform</TableHead>
                          <TableHead className="text-slate-700 font-semibold">Username</TableHead>
                          <TableHead className="text-slate-700 font-semibold">Email</TableHead>
                          <TableHead className="text-slate-700 font-semibold">Password</TableHead>
                          <TableHead className="text-slate-700 font-semibold">Full Name</TableHead>
                          <TableHead className="text-slate-700 font-semibold">Status</TableHead>
                          <TableHead className="text-slate-700 font-semibold">Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-slate-500 py-16">
                              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-indigo-500" />
                              <p className="text-lg font-medium">Loading accounts...</p>
                            </TableCell>
                          </TableRow>
                        ) : filterAccountsByPlatform(tab).length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-slate-500 py-16">
                              <div className="flex flex-col items-center">
                                <div className="p-4 bg-slate-100 rounded-full mb-4">
                                  <Users className="h-12 w-12 text-slate-400" />
                                </div>
                                <p className="text-lg font-medium text-slate-600">No accounts found</p>
                                <p className="text-sm text-slate-400 mt-1">Start automation to create accounts</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          filterAccountsByPlatform(tab).map((account) => (
                            <TableRow key={account.id} className="border-slate-200 hover:bg-slate-50 transition-colors">
                              <TableCell className="text-slate-700 font-medium">
                                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                  {account.accountNumber}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {getPlatformIcon(account.platform)}
                                  <Badge variant="outline" className="font-medium">
                                    {account.platform.charAt(0).toUpperCase() + account.platform.slice(1)}
                                  </Badge>
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
                                    className="h-6 w-6 p-0 text-slate-400 hover:text-indigo-600"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
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
                                    className="h-6 w-6 p-0 text-slate-400 hover:text-indigo-600"
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
                                    {showPasswords[account.id] ? account.password : "••••••••"}
                                  </button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => togglePasswordVisibility(account.id)}
                                    className="h-6 w-6 p-0 text-slate-400 hover:text-indigo-600"
                                  >
                                    {showPasswords[account.id] ? (
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
