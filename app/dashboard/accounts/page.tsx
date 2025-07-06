"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Eye, EyeOff, Download, Mail, Plus, RefreshCw } from "lucide-react"

interface TempAccount {
  _id: string
  accountNumber: number
  email: string
  profile: {
    firstName: string
    lastName: string
    usernames: string[]
    password: string
    birthYear: number
    birthMonth: number
    birthDay: number
    gender: string
  }
  status: string
  createdAt: string
}

export default function AccountsPage() {
  const [count, setCount] = useState(10)
  const [accounts, setAccounts] = useState<TempAccount[]>([])
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({})
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
        loadAccounts(parsedUser._id)
      } catch (error) {
        console.error("Error parsing user data:", error)
      }
    }
  }, [])

  const loadAccounts = async (userId: string) => {
    try {
      const response = await fetch("/api/accounts/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })

      if (response.ok) {
        const data = await response.json()
        setAccounts(data.accounts || [])
      }
    } catch (error) {
      console.error("Error loading accounts:", error)
    }
  }

  const createAccounts = async () => {
    if (!user) {
      toast.error("Please login first")
      return
    }

    if (count < 1 || count > 100) {
      toast.error("Please enter a number between 1 and 100")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/accounts/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count, userId: user._id }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        setAccounts((prev) => [...data.accounts, ...prev])
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error("Failed to create accounts")
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const downloadExcel = async () => {
    if (!user) {
      toast.error("Please login first")
      return
    }

    if (accounts.length === 0) {
      toast.error("No accounts to download")
      return
    }

    setDownloading(true)
    try {
      const response = await fetch(`/api/accounts/download?userId=${user._id}`)

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `temp-accounts-${new Date().toISOString().slice(0, 10)}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success("Excel file downloaded successfully")
      } else {
        toast.error("Failed to download Excel file")
      }
    } catch (error) {
      toast.error("Failed to download Excel file")
      console.error("Error:", error)
    } finally {
      setDownloading(false)
    }
  }

  const checkEmail = async (email: string) => {
    try {
      const response = await fetch("/api/accounts/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`Email found: ${data.data.subject}`)
      } else {
        toast.info("No emails found")
      }
    } catch (error) {
      toast.error("Failed to check email")
      console.error("Error:", error)
    }
  }

  const togglePassword = (accountId: string) => {
    setShowPasswords((prev) => ({
      ...prev,
      [accountId]: !prev[accountId],
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Temporary Email Accounts
          </h1>
          <p className="mt-2 text-gray-600">Create and manage temporary email accounts for testing</p>
        </div>

        {/* Create Accounts Card */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Accounts
            </CardTitle>
            <CardDescription className="text-purple-100">
              Generate temporary email accounts with random profiles
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="count" className="text-sm font-medium text-gray-700">
                  Number of Accounts
                </Label>
                <Input
                  id="count"
                  type="number"
                  min="1"
                  max="100"
                  value={count}
                  onChange={(e) => setCount(Number.parseInt(e.target.value) || 1)}
                  className="mt-1"
                  placeholder="Enter number of accounts"
                />
              </div>
              <Button
                onClick={createAccounts}
                disabled={loading}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8"
              >
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Accounts
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Accounts Table */}
        {accounts.length > 0 && (
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-t-lg">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Generated Accounts ({accounts.length})
                  </CardTitle>
                  <CardDescription className="text-blue-100">Manage your temporary email accounts</CardDescription>
                </div>
                <Button
                  onClick={downloadExcel}
                  disabled={downloading}
                  variant="secondary"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  {downloading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Download Excel
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">#</TableHead>
                      <TableHead className="font-semibold">Email</TableHead>
                      <TableHead className="font-semibold">Name</TableHead>
                      <TableHead className="font-semibold">Username</TableHead>
                      <TableHead className="font-semibold">Password</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts.map((account, index) => (
                      <TableRow key={account._id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>
                          <div className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{account.email}</div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {account.profile.firstName} {account.profile.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {account.profile.gender}, {account.profile.birthYear}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-mono text-sm">{account.profile.usernames[0]}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">
                              {showPasswords[account._id] ? account.profile.password : "••••••••"}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => togglePassword(account._id)}
                              className="h-6 w-6 p-0"
                            >
                              {showPasswords[account._id] ? (
                                <EyeOff className="h-3 w-3" />
                              ) : (
                                <Eye className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={account.status === "active" ? "default" : "secondary"} className="capitalize">
                            {account.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => checkEmail(account.email)}
                            className="text-xs"
                          >
                            <Mail className="mr-1 h-3 w-3" />
                            Check Email
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {accounts.length === 0 && (
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="p-12 text-center">
              <Mail className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No accounts created yet</h3>
              <p className="text-gray-500">Create your first batch of temporary email accounts to get started.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
