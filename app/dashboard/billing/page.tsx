"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreditCard, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { toast } from "sonner"

interface Transaction {
  id: string
  type: "credit" | "debit"
  amount: number
  description: string
  date: string
  status: string
  campaignId?: string
  balanceBefore?: number
  balanceAfter?: number
}

interface BillingData {
  currentBalance: number
  totalAdded: number
  totalSpent: number
  currency: string
  transactions: Transaction[]
  usage: {
    thisMonth: {
      whatsapp: { messages: number; cost: number }
      email: { messages: number; cost: number }
      voice: { calls: number; cost: number }
      sms: { messages: number; cost: number }
    }
  }
  subscription: {
    plan: string
    price: number
    billingCycle: string
    nextBilling: string
    features: string[]
  }
}

export default function BillingPage() {
  const [billingData, setBillingData] = useState<BillingData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [addFundsAmount, setAddFundsAmount] = useState("")
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  useEffect(() => {
    loadBillingData()
  }, [])

  const loadBillingData = async () => {
    try {
      const userData = localStorage.getItem("user")
      const userId = userData ? JSON.parse(userData).id : "demo-user"

      const response = await fetch(`/api/billing?userId=${userId}`)
      const data = await response.json()

      if (data.success) {
        setBillingData(data.billing)
      } else {
        toast.error("Failed to load billing data")
      }
    } catch (error) {
      console.error("Error loading billing data:", error)
      toast.error("Failed to load billing data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddFunds = async (paymentMethod: string) => {
    if (!addFundsAmount || Number.parseFloat(addFundsAmount) <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    setIsProcessingPayment(true)

    try {
      const userData = localStorage.getItem("user")
      const userId = userData ? JSON.parse(userData).id : "demo-user"

      const response = await fetch("/api/billing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Number.parseFloat(addFundsAmount),
          paymentMethod,
          userId,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`₹${addFundsAmount} added to your account successfully!`)
        setAddFundsAmount("")

        // Update user balance in localStorage
        if (userData) {
          const user = JSON.parse(userData)
          user.balance = data.newBalance
          localStorage.setItem("user", JSON.stringify(user))
        }

        // Reload billing data
        await loadBillingData()
      } else {
        toast.error(data.message || "Payment failed")
      }
    } catch (error) {
      console.error("Payment error:", error)
      toast.error("Payment failed")
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading billing information...</p>
        </div>
      </div>
    )
  }

  if (!billingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Failed to load billing data</p>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Billing & Usage</h2>
          <p className="text-muted-foreground">Manage your account balance and view usage statistics</p>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(billingData.currentBalance)}</div>
            <p className="text-xs text-muted-foreground">Available for campaigns</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Added</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(billingData.totalAdded)}</div>
            <p className="text-xs text-muted-foreground">Lifetime deposits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(billingData.totalSpent)}</div>
            <p className="text-xs text-muted-foreground">Campaign costs</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="add-funds" className="space-y-4">
        <TabsList>
          <TabsTrigger value="add-funds">Add Funds</TabsTrigger>
          <TabsTrigger value="transactions">Transaction History</TabsTrigger>
          <TabsTrigger value="usage">Usage Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="add-funds" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Funds to Your Account</CardTitle>
              <CardDescription>Top up your account balance to continue sending campaigns</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={addFundsAmount}
                  onChange={(e) => setAddFundsAmount(e.target.value)}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground">INR</span>
              </div>

              <div className="grid gap-2 md:grid-cols-3">
                <Button onClick={() => handleAddFunds("UPI")} disabled={isProcessingPayment} className="w-full">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay with UPI
                </Button>
                <Button
                  onClick={() => handleAddFunds("Card")}
                  disabled={isProcessingPayment}
                  variant="outline"
                  className="w-full"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay with Card
                </Button>
                <Button
                  onClick={() => handleAddFunds("Net Banking")}
                  disabled={isProcessingPayment}
                  variant="outline"
                  className="w-full"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Net Banking
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {[500, 1000, 2000, 5000].map((amount) => (
                  <Button key={amount} variant="outline" size="sm" onClick={() => setAddFundsAmount(amount.toString())}>
                    ₹{amount}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>View all your account transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {billingData.transactions.length > 0 ? (
                  billingData.transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div
                          className={`p-2 rounded-full ${
                            transaction.type === "credit" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                          }`}
                        >
                          {transaction.type === "credit" ? (
                            <ArrowUpRight className="h-4 w-4" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-muted-foreground">{formatDate(transaction.date)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-medium ${transaction.type === "credit" ? "text-green-600" : "text-red-600"}`}
                        >
                          {transaction.type === "credit" ? "+" : "-"}
                          {formatCurrency(transaction.amount)}
                        </p>
                        <Badge variant={transaction.status === "completed" ? "default" : "secondary"}>
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">No transactions found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">WhatsApp</CardTitle>
                <div className="h-4 w-4 bg-green-500 rounded-full" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{billingData.usage.thisMonth.whatsapp.messages}</div>
                <p className="text-xs text-muted-foreground">
                  Cost: {formatCurrency(billingData.usage.thisMonth.whatsapp.cost)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Email</CardTitle>
                <div className="h-4 w-4 bg-blue-500 rounded-full" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{billingData.usage.thisMonth.email.messages}</div>
                <p className="text-xs text-muted-foreground">
                  Cost: {formatCurrency(billingData.usage.thisMonth.email.cost)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">SMS</CardTitle>
                <div className="h-4 w-4 bg-yellow-500 rounded-full" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{billingData.usage.thisMonth.sms.messages}</div>
                <p className="text-xs text-muted-foreground">
                  Cost: {formatCurrency(billingData.usage.thisMonth.sms.cost)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Voice</CardTitle>
                <div className="h-4 w-4 bg-purple-500 rounded-full" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{billingData.usage.thisMonth.voice.calls}</div>
                <p className="text-xs text-muted-foreground">
                  Cost: {formatCurrency(billingData.usage.thisMonth.voice.cost)}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
