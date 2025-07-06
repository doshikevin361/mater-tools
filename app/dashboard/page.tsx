"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  MessageSquare,
  Mail,
  Phone,
  MessageCircle,
  Users,
  Target,
  Upload,
  BarChart3,
  Activity,
  DollarSign,
  Plus,
  TrendingUp,
  Calendar,
  Clock,
  ArrowUpRight,
  Zap,
} from "lucide-react"

interface DashboardStats {
  totalCampaigns: number
  totalContacts: number
  completedCampaigns: number
  activeCampaigns: number
  totalSent: number
  totalDelivered: number
  totalOpened: number
  totalClicked: number
  deliveryRate: number
  openRate: number
  clickRate: number
  totalCost: number
  platformStats: {
    WhatsApp: number
    Email: number
    SMS: number
    Voice: number
  }
  recentCampaigns: Array<{
    id: string
    name: string
    type: string
    status: string
    recipients: number
    sent: number
    delivered: number
    cost: number
    createdAt: string
  }>
}

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem("user")
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
        console.log("Dashboard user loaded:", parsedUser)
      } catch (error) {
        console.error("Error parsing user data:", error)
      }
    }

    loadDashboardStats()
  }, [])

  const loadDashboardStats = async () => {
    try {
      const userData = localStorage.getItem("user")
      const userId = userData ? JSON.parse(userData)._id || "demo-user" : "demo-user"

      console.log("Fetching dashboard stats for user:", userId)

      const response = await fetch(`/api/dashboard/stats?userId=${userId}`)
      const data = await response.json()

      console.log("Dashboard stats received:", data)

      if (data.success && data.stats) {
        setStats(data.stats)
      } else {
        // Set default stats if API fails
        setStats({
          totalCampaigns: 0,
          totalContacts: 0,
          completedCampaigns: 0,
          activeCampaigns: 0,
          totalSent: 0,
          totalDelivered: 0,
          totalOpened: 0,
          totalClicked: 0,
          deliveryRate: 0,
          openRate: 0,
          clickRate: 0,
          totalCost: 0,
          platformStats: { WhatsApp: 0, Email: 0, SMS: 0, Voice: 0 },
          recentCampaigns: [],
        })
        console.log("Using default stats due to API error")
      }
    } catch (error) {
      console.error("Error loading dashboard stats:", error)
      // Set default stats on error
      setStats({
        totalCampaigns: 0,
        totalContacts: 0,
        completedCampaigns: 0,
        activeCampaigns: 0,
        totalSent: 0,
        totalDelivered: 0,
        totalOpened: 0,
        totalClicked: 0,
        deliveryRate: 0,
        openRate: 0,
        clickRate: 0,
        totalCost: 0,
        platformStats: { WhatsApp: 0, Email: 0, SMS: 0, Voice: 0 },
        recentCampaigns: [],
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount || 0)
  }

  const formatNumber = (num: number) => {
    return (num || 0).toLocaleString()
  }

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "whatsapp":
        router.push("/dashboard/whatsapp")
        break
      case "email":
        router.push("/dashboard/email")
        break
      case "sms":
        router.push("/dashboard/sms")
        break
      case "voice":
        router.push("/dashboard/voice")
        break
      case "contacts":
        router.push("/dashboard/contacts")
        break
      case "import-contacts":
        router.push("/dashboard/contacts?action=import")
        break
      case "analytics":
        router.push("/dashboard/analytics")
        break
      case "billing":
        router.push("/dashboard/billing")
        break
      default:
        console.log("Unknown action:", action)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-50 text-green-700 border-green-200"
      case "processing":
      case "sending":
        return "bg-blue-50 text-blue-700 border-blue-200"
      case "failed":
        return "bg-red-50 text-red-700 border-red-200"
      case "paused":
        return "bg-yellow-50 text-yellow-700 border-yellow-200"
      default:
        return "bg-gray-50 text-gray-700 border-gray-200"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "whatsapp":
        return <MessageSquare className="h-4 w-4 text-green-600" />
      case "email":
        return <Mail className="h-4 w-4 text-blue-600" />
      case "sms":
        return <MessageCircle className="h-4 w-4 text-purple-600" />
      case "voice":
        return <Phone className="h-4 w-4 text-orange-600" />
      default:
        return <Target className="h-4 w-4 text-gray-600" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg font-medium text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="p-6 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Welcome back, {user?.firstName || "Demo User"}!
            </h1>
            <p className="text-lg text-gray-600">Here's what's happening with your campaigns today.</p>
          </div>
          <Button
            onClick={() => handleQuickAction("whatsapp")}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3"
            size="lg"
          >
            <Plus className="mr-2 h-5 w-5" />
            New Campaign
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card
            className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300 cursor-pointer group"
            onClick={() => handleQuickAction("analytics")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Total Messages</CardTitle>
              <div className="p-2 bg-blue-200 rounded-lg group-hover:bg-blue-300 transition-colors">
                <MessageSquare className="h-5 w-5 text-blue-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-800">{formatNumber(stats?.totalSent || 0)}</div>
              <p className="text-sm text-blue-600 flex items-center mt-2">
                <TrendingUp className="h-4 w-4 mr-1" />
                {formatNumber(stats?.totalDelivered || 0)} delivered
              </p>
            </CardContent>
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200 rounded-full -mr-10 -mt-10 opacity-20"></div>
          </Card>

          <Card
            className="relative overflow-hidden bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300 cursor-pointer group"
            onClick={() => handleQuickAction("contacts")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700">Total Contacts</CardTitle>
              <div className="p-2 bg-green-200 rounded-lg group-hover:bg-green-300 transition-colors">
                <Users className="h-5 w-5 text-green-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-800">{formatNumber(stats?.totalContacts || 0)}</div>
              <p className="text-sm text-green-600 mt-2">Active contacts in database</p>
            </CardContent>
            <div className="absolute top-0 right-0 w-20 h-20 bg-green-200 rounded-full -mr-10 -mt-10 opacity-20"></div>
          </Card>

          <Card
            className="relative overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300 cursor-pointer group"
            onClick={() => handleQuickAction("analytics")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">Campaigns</CardTitle>
              <div className="p-2 bg-purple-200 rounded-lg group-hover:bg-purple-300 transition-colors">
                <Target className="h-5 w-5 text-purple-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-800">{formatNumber(stats?.totalCampaigns || 0)}</div>
              <p className="text-sm text-purple-600 flex items-center mt-2">
                <Activity className="h-4 w-4 mr-1" />
                {formatNumber(stats?.activeCampaigns || 0)} active
              </p>
            </CardContent>
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-200 rounded-full -mr-10 -mt-10 opacity-20"></div>
          </Card>

          <Card
            className="relative overflow-hidden bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-300 cursor-pointer group"
            onClick={() => handleQuickAction("billing")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-700">Total Spent</CardTitle>
              <div className="p-2 bg-orange-200 rounded-lg group-hover:bg-orange-300 transition-colors">
                <DollarSign className="h-5 w-5 text-orange-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-800">{formatCurrency(stats?.totalCost || 0)}</div>
              <p className="text-sm text-orange-600 mt-2">Campaign expenses</p>
            </CardContent>
            <div className="absolute top-0 right-0 w-20 h-20 bg-orange-200 rounded-full -mr-10 -mt-10 opacity-20"></div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="bg-white/70 backdrop-blur-sm border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold text-gray-800 flex items-center">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg mr-3">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                Quick Campaign
              </CardTitle>
              <CardDescription className="text-gray-600">Send messages instantly</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                onClick={() => handleQuickAction("whatsapp")}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                WhatsApp Campaign
              </Button>
              <Button
                variant="outline"
                className="w-full border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 bg-transparent"
                onClick={() => handleQuickAction("email")}
              >
                <Mail className="mr-2 h-4 w-4 text-blue-600" />
                Email Campaign
              </Button>
              <Button
                variant="outline"
                className="w-full border-purple-200 hover:bg-purple-50 hover:border-purple-300 transition-all duration-200 bg-transparent"
                onClick={() => handleQuickAction("sms")}
              >
                <MessageCircle className="mr-2 h-4 w-4 text-purple-600" />
                SMS Campaign
              </Button>
              <Button
                variant="outline"
                className="w-full border-orange-200 hover:bg-orange-50 hover:border-orange-300 transition-all duration-200 bg-transparent"
                onClick={() => handleQuickAction("voice")}
              >
                <Phone className="mr-2 h-4 w-4 text-orange-600" />
                Voice Campaign
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold text-gray-800 flex items-center">
                <div className="p-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg mr-3">
                  <Users className="h-5 w-5 text-white" />
                </div>
                Contact Management
              </CardTitle>
              <CardDescription className="text-gray-600">Manage your audience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 bg-transparent"
                onClick={() => handleQuickAction("contacts")}
              >
                <Users className="mr-2 h-4 w-4 text-gray-600" />
                View Contacts
              </Button>
              <Button
                variant="outline"
                className="w-full border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 bg-transparent"
                onClick={() => handleQuickAction("import-contacts")}
              >
                <Upload className="mr-2 h-4 w-4 text-blue-600" />
                Import Contacts
              </Button>
              <Button
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-md hover:shadow-lg transition-all duration-200"
                onClick={() => handleQuickAction("contacts")}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Contact
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold text-gray-800 flex items-center">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg mr-3">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                Analytics & Reports
              </CardTitle>
              <CardDescription className="text-gray-600">Track performance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full border-purple-200 hover:bg-purple-50 hover:border-purple-300 transition-all duration-200 bg-transparent"
                onClick={() => handleQuickAction("analytics")}
              >
                <BarChart3 className="mr-2 h-4 w-4 text-purple-600" />
                View Reports
              </Button>
              <Button
                variant="outline"
                className="w-full border-green-200 hover:bg-green-50 hover:border-green-300 transition-all duration-200 bg-transparent"
                onClick={() => handleQuickAction("analytics")}
              >
                <Activity className="mr-2 h-4 w-4 text-green-600" />
                Real-time Stats
              </Button>
              <Button
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-md hover:shadow-lg transition-all duration-200"
                onClick={() => handleQuickAction("billing")}
              >
                <DollarSign className="mr-2 h-4 w-4" />
                View Billing
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-white/70 backdrop-blur-sm border-gray-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-800 flex items-center">
                <TrendingUp className="mr-3 h-6 w-6 text-blue-600" />
                Delivery Performance
              </CardTitle>
              <CardDescription className="text-gray-600">Campaign success metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Delivery Rate</span>
                  <span className="text-sm font-bold text-blue-600">{(stats?.deliveryRate || 0).toFixed(1)}%</span>
                </div>
                <Progress value={stats?.deliveryRate || 0} className="h-3 bg-blue-100" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Open Rate</span>
                  <span className="text-sm font-bold text-green-600">{(stats?.openRate || 0).toFixed(1)}%</span>
                </div>
                <Progress value={stats?.openRate || 0} className="h-3 bg-green-100" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Click Rate</span>
                  <span className="text-sm font-bold text-purple-600">{(stats?.clickRate || 0).toFixed(1)}%</span>
                </div>
                <Progress value={stats?.clickRate || 0} className="h-3 bg-purple-100" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-gray-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-800 flex items-center">
                <Target className="mr-3 h-6 w-6 text-purple-600" />
                Platform Breakdown
              </CardTitle>
              <CardDescription className="text-gray-600">Messages by platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className="flex items-center justify-between p-3 rounded-lg bg-green-50 hover:bg-green-100 cursor-pointer transition-all duration-200 border border-green-200"
                onClick={() => handleQuickAction("whatsapp")}
              >
                <div className="flex items-center space-x-3">
                  <MessageSquare className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-gray-700">WhatsApp</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-gray-800">{formatNumber(stats?.platformStats?.WhatsApp || 0)}</span>
                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <div
                className="flex items-center justify-between p-3 rounded-lg bg-blue-50 hover:bg-blue-100 cursor-pointer transition-all duration-200 border border-blue-200"
                onClick={() => handleQuickAction("email")}
              >
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-gray-700">Email</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-gray-800">{formatNumber(stats?.platformStats?.Email || 0)}</span>
                  <ArrowUpRight className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div
                className="flex items-center justify-between p-3 rounded-lg bg-purple-50 hover:bg-purple-100 cursor-pointer transition-all duration-200 border border-purple-200"
                onClick={() => handleQuickAction("sms")}
              >
                <div className="flex items-center space-x-3">
                  <MessageCircle className="h-5 w-5 text-purple-600" />
                  <span className="font-medium text-gray-700">SMS</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-gray-800">{formatNumber(stats?.platformStats?.SMS || 0)}</span>
                  <ArrowUpRight className="h-4 w-4 text-purple-600" />
                </div>
              </div>
              <div
                className="flex items-center justify-between p-3 rounded-lg bg-orange-50 hover:bg-orange-100 cursor-pointer transition-all duration-200 border border-orange-200"
                onClick={() => handleQuickAction("voice")}
              >
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-orange-600" />
                  <span className="font-medium text-gray-700">Voice</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-gray-800">{formatNumber(stats?.platformStats?.Voice || 0)}</span>
                  <ArrowUpRight className="h-4 w-4 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Campaigns */}
        <Card className="bg-white/70 backdrop-blur-sm border-gray-200 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold text-gray-800 flex items-center">
                <Clock className="mr-3 h-6 w-6 text-blue-600" />
                Recent Campaigns
              </CardTitle>
              <CardDescription className="text-gray-600">Your latest campaign activity</CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={() => handleQuickAction("analytics")}
              className="border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
            >
              View All
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {stats?.recentCampaigns && stats.recentCampaigns.length > 0 ? (
              <div className="space-y-4">
                {stats.recentCampaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-white/50 hover:bg-white/80 hover:shadow-md transition-all duration-300 cursor-pointer"
                    onClick={() => handleQuickAction("analytics")}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0 p-2 bg-gray-100 rounded-lg">{getTypeIcon(campaign.type)}</div>
                      <div className="space-y-1">
                        <h4 className="font-semibold text-gray-900">{campaign.name}</h4>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs border-gray-300">
                            {campaign.type}
                          </Badge>
                          <Badge className={`text-xs border ${getStatusColor(campaign.status)}`}>
                            {campaign.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatNumber(campaign.delivered)} / {formatNumber(campaign.sent)}
                      </p>
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(campaign.createdAt).toLocaleDateString()}
                      </div>
                      <p className="text-xs font-semibold text-blue-600">{formatCurrency(campaign.cost)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <Target className="h-10 w-10 text-gray-400" />
                </div>
                <p className="text-xl font-semibold text-gray-700 mb-2">No campaigns yet</p>
                <p className="text-gray-500 mb-6">Create your first campaign to get started</p>
                <Button
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3"
                  onClick={() => handleQuickAction("whatsapp")}
                  size="lg"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Create Campaign
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
