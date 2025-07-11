"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { Download, Eye, EyeOff, Copy, Play, RotateCcw } from "lucide-react"

interface Account {
  _id: string
  platform: string
  email: string
  firstName: string
  lastName: string
  username: string
  password: string
  status: string
  createdAt: string
}

interface Job {
  id: string
  status: string
  progress: number
  totalAccounts: number
  createdAccounts: number
  platforms: string[]
  startTime: string
  endTime?: string
}

export default function SocialAutomationPage() {
  const [user, setUser] = useState<any>(null)
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [accountCounts, setAccountCounts] = useState<{ [key: string]: number }>({
    instagram: 1,
    facebook: 1,
    twitter: 1,
  })
  const [isCreating, setIsCreating] = useState(false)
  const [currentJob, setCurrentJob] = useState<Job | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [statistics, setStatistics] = useState<any>({})
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({})
  const [filterPlatform, setFilterPlatform] = useState("all")

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      fetchAccounts(parsedUser.id)
    }
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (currentJob && currentJob.status === "processing") {
      interval = setInterval(() => {
        checkJobStatus(currentJob.id)
      }, 5000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [currentJob])

  const fetchAccounts = async (userId: string) => {
    try {
      const response = await fetch(`/api/social-automation/accounts?userId=${userId}&platform=${filterPlatform}`)
      const data = await response.json()

      if (data.success) {
        setAccounts(data.accounts)
        setStatistics(data.statistics)
      }
    } catch (error) {
      console.error("Failed to fetch accounts:", error)
    }
  }

  const checkJobStatus = async (jobId: string) => {
    try {
      const response = await fetch(`/api/social-automation/status?jobId=${jobId}&userId=${user.id}`)
      const data = await response.json()

      if (data.success) {
        setCurrentJob(data.job)

        if (data.job.status === "completed" || data.job.status === "failed") {
          setIsCreating(false)
          fetchAccounts(user.id)

          if (data.job.status === "completed") {
            toast.success(`Automation completed! Created ${data.job.createdAccounts} accounts.`)
          } else {
            toast.error("Automation failed. Please try again.")
          }
        }
      }
    } catch (error) {
      console.error("Failed to check job status:", error)
    }
  }

  const handlePlatformChange = (platform: string, checked: boolean) => {
    if (checked) {
      setSelectedPlatforms([...selectedPlatforms, platform])
    } else {
      setSelectedPlatforms(selectedPlatforms.filter((p) => p !== platform))
    }
  }

  const handleCountChange = (platform: string, count: number) => {
    setAccountCounts({
      ...accountCounts,
      [platform]: Math.max(1, Math.min(10, count)),
    })
  }

  const startAutomation = async () => {
    if (selectedPlatforms.length === 0) {
      toast.error("Please select at least one platform")
      return
    }

    setIsCreating(true)

    try {
      const response = await fetch("/api/social-automation/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          platforms: selectedPlatforms,
          accountCounts,
          userId: user.id,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Account creation started! You will be notified when complete.")
        setCurrentJob({
          id: data.jobId,
          status: "processing",
          progress: 0,
          totalAccounts: selectedPlatforms.reduce((sum, platform) => sum + accountCounts[platform], 0),
          createdAccounts: 0,
          platforms: selectedPlatforms,
          startTime: new Date().toISOString(),
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("Automation error:", error)
      toast.error("Failed to start automation")
      setIsCreating(false)
    }
  }

  const downloadAccounts = async (platform = "all") => {
    try {
      const response = await fetch(`/api/social-automation/download?userId=${user.id}&platform=${platform}`)

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${platform}_accounts_${new Date().toISOString().split("T")[0]}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success("Accounts downloaded successfully!")
      } else {
        throw new Error("Download failed")
      }
    } catch (error) {
      console.error("Download error:", error)
      toast.error("Failed to download accounts")
    }
  }

  const togglePasswordVisibility = (accountId: string) => {
    setShowPasswords({
      ...showPasswords,
      [accountId]: !showPasswords[accountId],
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard!")
  }

  const platforms = [
    { id: "instagram", name: "Instagram", color: "bg-gradient-to-r from-purple-500 to-pink-500" },
    { id: "facebook", name: "Facebook", color: "bg-blue-600" },
    { id: "twitter", name: "Twitter", color: "bg-sky-500" },
  ]

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Social Media Automation
          </h1>
          <p className="mt-2 text-gray-600">Create multiple social media accounts automatically across platforms</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">Total Accounts</p>
                  <p className="text-3xl font-bold">{statistics.total || 0}</p>
                </div>
                <div className="rounded-full bg-white/20 p-3">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Active Accounts</p>
                  <p className="text-3xl font-bold">{statistics.active || 0}</p>
                </div>
                <div className="rounded-full bg-white/20 p-3">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Instagram</p>
                  <p className="text-3xl font-bold">{statistics.byPlatform?.instagram?.total || 0}</p>
                </div>
                <div className="rounded-full bg-white/20 p-3">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="m16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100">Success Rate</p>
                  <p className="text-3xl font-bold">90%</p>
                </div>
                <div className="rounded-full bg-white/20 p-3">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Automation Control */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="rounded-full bg-gradient-to-r from-purple-500 to-blue-500 p-2">
                <Play className="h-5 w-5 text-white" />
              </div>
              Account Creation Automation
            </CardTitle>
            <CardDescription>Select platforms and specify how many accounts to create for each</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Platform Selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {platforms.map((platform) => (
                <Card key={platform.id} className="border-2 hover:border-purple-300 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id={platform.id}
                        checked={selectedPlatforms.includes(platform.id)}
                        onCheckedChange={(checked) => handlePlatformChange(platform.id, checked as boolean)}
                        disabled={isCreating}
                      />
                      <div className="flex-1">
                        <Label htmlFor={platform.id} className="text-sm font-medium">
                          {platform.name}
                        </Label>
                        <div className="mt-2">
                          <Label htmlFor={`count-${platform.id}`} className="text-xs text-gray-500">
                            Number of accounts (1-10)
                          </Label>
                          <Input
                            id={`count-${platform.id}`}
                            type="number"
                            min="1"
                            max="10"
                            value={accountCounts[platform.id]}
                            onChange={(e) => handleCountChange(platform.id, Number.parseInt(e.target.value) || 1)}
                            disabled={!selectedPlatforms.includes(platform.id) || isCreating}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Progress */}
            {currentJob && (
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      Creating accounts... ({currentJob.createdAccounts}/{currentJob.totalAccounts})
                    </span>
                    <Badge variant={currentJob.status === "completed" ? "default" : "secondary"}>
                      {currentJob.status}
                    </Badge>
                  </div>
                  <Progress value={currentJob.progress} className="h-2" />
                  <p className="text-xs text-gray-600 mt-2">Platforms: {currentJob.platforms.join(", ")}</p>
                </CardContent>
              </Card>
            )}

            {/* Action Button */}
            <Button
              onClick={startAutomation}
              disabled={isCreating || selectedPlatforms.length === 0}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3"
              size="lg"
            >
              {isCreating ? (
                <>
                  <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
                  Creating Accounts...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Start Automation
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Accounts List */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Created Accounts</CardTitle>
                <CardDescription>Manage and download your automatically created social media accounts</CardDescription>
              </div>
              <div className="flex gap-2">
                <select
                  value={filterPlatform}
                  onChange={(e) => {
                    setFilterPlatform(e.target.value)
                    fetchAccounts(user.id)
                  }}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  <option value="all">All Platforms</option>
                  <option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option>
                  <option value="twitter">Twitter</option>
                </select>
                <Button onClick={() => downloadAccounts(filterPlatform)} variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Download Excel
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Platform</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Password</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((account) => (
                    <TableRow key={account._id}>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            account.platform === "instagram"
                              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                              : account.platform === "facebook"
                                ? "bg-blue-600 text-white"
                                : "bg-sky-500 text-white"
                          }
                        >
                          {account.platform}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{account.email}</TableCell>
                      <TableCell className="font-mono text-sm">{account.username}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">
                            {showPasswords[account._id] ? account.password : "••••••••"}
                          </span>
                          <Button variant="ghost" size="sm" onClick={() => togglePasswordVisibility(account._id)}>
                            {showPasswords[account._id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={account.status === "active" ? "default" : "secondary"}>{account.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {new Date(account.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(`${account.email}:${account.password}`)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {accounts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No accounts created yet. Start automation to create accounts.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
