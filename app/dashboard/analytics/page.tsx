"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  TrendingUp,
  MessageSquare,
  Mail,
  Phone,
  Smartphone,
  Users,
  DollarSign,
  Activity,
  Download,
  RefreshCw,
  BarChart3,
  Target,
} from "lucide-react"

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState("30d")
  const [user, setUser] = useState<any>(null)

  // Get user info from localStorage
  const getUserInfo = () => {
    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem("user")
      if (userStr) {
        try {
          return JSON.parse(userStr)
        } catch (error) {
          console.error("Error parsing user data:", error)
          return null
        }
      }
    }
    return null
  }

  const fetchAnalytics = async (selectedPeriod = "30d") => {
    try {
      setLoading(true)
      const userInfo = getUserInfo()

      if (!userInfo || !userInfo._id) {
        console.error("No user info found or missing user ID")
        setLoading(false)
        return
      }

      console.log("Fetching analytics for period:", selectedPeriod, "userId:", userInfo._id)

      const response = await fetch(`/api/analytics/dashboard?period=${selectedPeriod}&userId=${userInfo._id}`)
      const result = await response.json()

      console.log("Analytics API response:", result)

      if (result.success) {
        setAnalytics(result.analytics)
      } else {
        console.error("Failed to fetch analytics:", result)
      }
    } catch (error) {
      console.error("Analytics fetch error:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const userInfo = getUserInfo()
    if (userInfo) {
      setUser(userInfo)
      fetchAnalytics(period)
    } else {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) {
      fetchAnalytics(period)
    }
  }, [period, user])

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl">
          <h2 className="text-2xl font-bold mb-2 text-gray-800">Please log in</h2>
          <p className="text-gray-600 mb-6">You need to be logged in to view analytics</p>
          <Button
            asChild
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3"
          >
            <a href="/login">Go to Login</a>
          </Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="p-6 space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <div className="h-10 w-80 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse"></div>
              <div className="h-6 w-96 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse"></div>
            </div>
            <div className="h-12 w-40 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse"></div>
          </div>
          <div className="grid gap-6 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-40 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl animate-pulse"></div>
            ))}
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-80 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const platformColors = {
    WhatsApp: "#25D366",
    Email: "#EA4335",
    Voice: "#8B5CF6",
    SMS: "#F59E0B",
  }

  const chartData =
    analytics?.timeSeriesData?.labels?.map((label, index) => ({
      name: label,
      messages: analytics.timeSeriesData.datasets[0].data[index],
      revenue: analytics.timeSeriesData.datasets[1].data[index],
    })) || []

  const platformData =
    analytics?.platformStats?.map((platform) => ({
      name: platform.platform,
      value: platform.sent,
      color: platformColors[platform.platform],
    })) || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl shadow-lg">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Analytics Dashboard
              </h1>
              <p className="text-lg text-gray-600">Track your campaign performance and ROI</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Select value={period} onValueChange={(value) => setPeriod(value)}>
              <SelectTrigger className="w-40 bg-white border-gray-200 shadow-sm">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => fetchAnalytics(period)}
              className="border-gray-200 hover:bg-gray-50 shadow-sm"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" className="border-blue-200 hover:bg-blue-50 shadow-sm bg-transparent">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 mb-2">Total Messages</p>
                  <p className="text-3xl font-bold text-blue-800">
                    {analytics?.overview?.totalMessagesSent?.toLocaleString() || 0}
                  </p>
                  <div className="flex items-center text-sm text-blue-600 mt-2">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    {analytics?.overview?.trends?.messagesSent || "+0%"}
                  </div>
                </div>
                <div className="p-3 bg-blue-200 rounded-xl">
                  <MessageSquare className="h-8 w-8 text-blue-700" />
                </div>
              </div>
            </CardContent>
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200 rounded-full -mr-10 -mt-10 opacity-20"></div>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 mb-2">Active Campaigns</p>
                  <p className="text-3xl font-bold text-green-800">{analytics?.overview?.activeCampaigns || 0}</p>
                  <div className="flex items-center text-sm text-green-600 mt-2">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    {analytics?.overview?.trends?.campaigns || "+0"}
                  </div>
                </div>
                <div className="p-3 bg-green-200 rounded-xl">
                  <Activity className="h-8 w-8 text-green-700" />
                </div>
              </div>
            </CardContent>
            <div className="absolute top-0 right-0 w-20 h-20 bg-green-200 rounded-full -mr-10 -mt-10 opacity-20"></div>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700 mb-2">Success Rate</p>
                  <p className="text-3xl font-bold text-purple-800">{analytics?.overview?.successRate || 0}%</p>
                  <div className="flex items-center text-sm text-purple-600 mt-2">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    {analytics?.overview?.trends?.successRate || "+0%"}
                  </div>
                </div>
                <div className="p-3 bg-purple-200 rounded-xl">
                  <Users className="h-8 w-8 text-purple-700" />
                </div>
              </div>
            </CardContent>
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-200 rounded-full -mr-10 -mt-10 opacity-20"></div>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700 mb-2">Total Revenue</p>
                  <p className="text-3xl font-bold text-orange-800">
                    ₹{analytics?.overview?.totalRevenue?.toLocaleString() || 0}
                  </p>
                  <div className="flex items-center text-sm text-orange-600 mt-2">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    {analytics?.overview?.trends?.revenue || "+0%"}
                  </div>
                </div>
                <div className="p-3 bg-orange-200 rounded-xl">
                  <DollarSign className="h-8 w-8 text-orange-700" />
                </div>
              </div>
            </CardContent>
            <div className="absolute top-0 right-0 w-20 h-20 bg-orange-200 rounded-full -mr-10 -mt-10 opacity-20"></div>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Messages Over Time */}
          <Card className="bg-white/70 backdrop-blur-sm border-gray-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-800 flex items-center">
                <TrendingUp className="mr-3 h-6 w-6 text-blue-600" />
                Messages Sent Over Time
              </CardTitle>
              <CardDescription className="text-gray-600">Track your messaging volume trends</CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 && chartData.some((d) => d.messages > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="messages"
                      stroke="#3B82F6"
                      strokeWidth={3}
                      dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: "#3B82F6", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
                  <BarChart3 className="h-16 w-16 mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No messaging data available</p>
                  <p className="text-sm">Start sending campaigns to see trends</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Platform Distribution */}
          <Card className="bg-white/70 backdrop-blur-sm border-gray-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-800 flex items-center">
                <Target className="mr-3 h-6 w-6 text-purple-600" />
                Platform Distribution
              </CardTitle>
              <CardDescription className="text-gray-600">Messages sent by platform</CardDescription>
            </CardHeader>
            <CardContent>
              {platformData.length > 0 && platformData.some((d) => d.value > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={platformData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {platformData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
                  <Target className="h-16 w-16 mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No platform data available</p>
                  <p className="text-sm">Start sending campaigns to see distribution</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Platform Performance */}
        <Card className="bg-white/70 backdrop-blur-sm border-gray-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-800 flex items-center">
              <Activity className="mr-3 h-6 w-6 text-green-600" />
              Platform Performance
            </CardTitle>
            <CardDescription className="text-gray-600">Detailed metrics for each messaging platform</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics?.platformStats && analytics.platformStats.length > 0 ? (
              <div className="space-y-6">
                {analytics.platformStats.map((platform) => (
                  <div
                    key={platform.platform}
                    className="border border-gray-200 rounded-xl p-6 bg-white/50 hover:bg-white/80 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200">
                          {platform.platform === "WhatsApp" && <MessageSquare className="h-6 w-6 text-green-600" />}
                          {platform.platform === "Email" && <Mail className="h-6 w-6 text-red-600" />}
                          {platform.platform === "Voice" && <Phone className="h-6 w-6 text-purple-600" />}
                          {platform.platform === "SMS" && <Smartphone className="h-6 w-6 text-orange-600" />}
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800">{platform.platform}</h3>
                      </div>
                      <Badge
                        variant="outline"
                        className="px-3 py-1 text-sm font-medium border-green-200 text-green-700 bg-green-50"
                      >
                        {platform.deliveryRate || platform.connectionRate || 0}% delivery rate
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <p className="text-3xl font-bold text-blue-600 mb-1">{platform.sent?.toLocaleString() || 0}</p>
                        <p className="text-sm font-medium text-blue-700">Sent</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                        <p className="text-3xl font-bold text-green-600 mb-1">
                          {(platform.delivered || platform.connected || 0).toLocaleString()}
                        </p>
                        <p className="text-sm font-medium text-green-700">
                          {platform.platform === "Voice" ? "Connected" : "Delivered"}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-200">
                        <p className="text-3xl font-bold text-purple-600 mb-1">
                          {(
                            platform.read ||
                            platform.opened ||
                            platform.completed ||
                            platform.clicked ||
                            0
                          ).toLocaleString()}
                        </p>
                        <p className="text-sm font-medium text-purple-700">
                          {platform.platform === "Email"
                            ? "Opened"
                            : platform.platform === "Voice"
                              ? "Completed"
                              : platform.platform === "SMS"
                                ? "Clicked"
                                : "Read"}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-xl border border-orange-200">
                        <p className="text-3xl font-bold text-orange-600 mb-1">
                          ₹{platform.revenue?.toLocaleString() || 0}
                        </p>
                        <p className="text-sm font-medium text-orange-700">Revenue</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <Activity className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No platform data available</h3>
                <p className="text-gray-500 mb-6">Start sending campaigns to see platform performance</p>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3">
                  Create Campaign
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Campaigns */}
        {analytics?.campaignPerformance?.length > 0 && (
          <Card className="bg-white/70 backdrop-blur-sm border-gray-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-800 flex items-center">
                <Target className="mr-3 h-6 w-6 text-purple-600" />
                Top Performing Campaigns
              </CardTitle>
              <CardDescription className="text-gray-600">Your most successful campaigns this period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.campaignPerformance.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="flex items-center justify-between p-6 border border-gray-200 rounded-xl bg-white/50 hover:bg-white/80 hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-3 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200">
                        {campaign.platform === "WhatsApp" && <MessageSquare className="h-6 w-6 text-green-600" />}
                        {campaign.platform === "Email" && <Mail className="h-6 w-6 text-red-600" />}
                        {campaign.platform === "SMS" && <Smartphone className="h-6 w-6 text-orange-600" />}
                        {campaign.platform === "Voice" && <Phone className="h-6 w-6 text-purple-600" />}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">{campaign.name}</h3>
                        <p className="text-sm text-gray-600">{campaign.platform} Campaign</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-8 text-sm">
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-800">{campaign.sent.toLocaleString()}</p>
                        <p className="text-gray-600">Sent</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-green-600">{campaign.engagement.toFixed(1)}%</p>
                        <p className="text-gray-600">Engagement</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-blue-600">₹{campaign.revenue.toLocaleString()}</p>
                        <p className="text-gray-600">Revenue</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-purple-600">{campaign.roi}x</p>
                        <p className="text-gray-600">ROI</p>
                      </div>
                      <Badge
                        variant={campaign.status === "Completed" ? "default" : "secondary"}
                        className={
                          campaign.status === "Completed" ? "bg-green-100 text-green-800 border-green-200" : ""
                        }
                      >
                        {campaign.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
