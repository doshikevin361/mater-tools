"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Facebook,
  Users,
  TrendingUp,
  DollarSign,
  Play,
  Pause,
  BarChart3,
  Target,
  Zap,
  Plus,
  Eye,
  Heart,
  MessageCircle,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface FacebookCampaign {
  id: string
  name: string
  type: string
  targetCount: number
  currentCount: number
  status: "active" | "paused" | "completed"
  cost: number
  engagement: number
  reach: number
  createdAt: string
}

export default function FacebookPage() {
  const [campaigns, setCampaigns] = useState<FacebookCampaign[]>([])
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    totalFollowers: 12500,
    totalEngagement: 8750,
    totalSpent: 0,
    growthRate: 15.2,
  })

  // Form state
  const [campaignName, setCampaignName] = useState("")
  const [growthType, setGrowthType] = useState("followers")
  const [targetCount, setTargetCount] = useState("")
  const [pageUrl, setPageUrl] = useState("")

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    try {
      const userData = localStorage.getItem("user")
      if (!userData) return

      const user = JSON.parse(userData)
      const userId = user._id || user.id

      const response = await fetch(`/api/facebook/campaigns?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setCampaigns(data.campaigns || [])
        setStats((prev) => ({
          ...prev,
          totalCampaigns: data.campaigns?.length || 0,
          totalSpent: data.campaigns?.reduce((sum: number, c: FacebookCampaign) => sum + c.cost, 0) || 0,
        }))
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error)
    }
  }

  const createCampaign = async () => {
    if (!campaignName || !targetCount || !pageUrl) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const userData = localStorage.getItem("user")
      if (!userData) throw new Error("User not logged in")

      const user = JSON.parse(userData)
      const userId = user._id || user.id

      const response = await fetch("/api/facebook/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          name: campaignName,
          type: growthType,
          targetCount: Number.parseInt(targetCount),
          pageUrl,
        }),
      })

      if (response.ok) {
        toast({
          title: "Campaign Created!",
          description: "Your Facebook growth campaign has been started successfully.",
        })

        // Reset form
        setCampaignName("")
        setTargetCount("")
        setPageUrl("")

        // Refresh campaigns
        fetchCampaigns()
      } else {
        throw new Error("Failed to create campaign")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create campaign. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleCampaign = async (campaignId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "active" ? "paused" : "active"

      const response = await fetch(`/api/facebook/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        setCampaigns((prev) => prev.map((c) => (c.id === campaignId ? { ...c, status: newStatus as any } : c)))

        toast({
          title: "Campaign Updated",
          description: `Campaign ${newStatus === "active" ? "resumed" : "paused"} successfully.`,
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update campaign status.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg">
            <Facebook className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-brand-gradient">Facebook Growth</h1>
            <p className="text-gray-600 mt-1">Boost your Facebook presence with targeted campaigns</p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-gradient shadow-brand hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Total Followers</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-gradient">{stats.totalFollowers.toLocaleString()}</div>
            <p className="text-xs text-gray-600 mt-1">
              <span className="text-green-600 font-medium">+{stats.growthRate}%</span> this month
            </p>
          </CardContent>
        </Card>

        <Card className="card-gradient shadow-brand hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Engagement</CardTitle>
            <Heart className="h-4 w-4 text-pink-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-gradient">{stats.totalEngagement.toLocaleString()}</div>
            <p className="text-xs text-gray-600 mt-1">
              <span className="text-green-600 font-medium">+18%</span> this month
            </p>
          </CardContent>
        </Card>

        <Card className="card-gradient shadow-brand hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Active Campaigns</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-gradient">
              {campaigns.filter((c) => c.status === "active").length}
            </div>
            <p className="text-xs text-gray-600 mt-1">{stats.totalCampaigns} total campaigns</p>
          </CardContent>
        </Card>

        <Card className="card-gradient shadow-brand hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-gradient">₹{stats.totalSpent.toFixed(2)}</div>
            <p className="text-xs text-gray-600 mt-1">
              <span className="text-blue-600 font-medium">₹0.05</span> per follower
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="create" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-white/50 backdrop-blur-sm border border-purple-200">
          <TabsTrigger value="create" className="data-[state=active]:bg-brand-gradient data-[state=active]:text-white">
            <Plus className="mr-2 h-4 w-4" />
            Create Campaign
          </TabsTrigger>
          <TabsTrigger
            value="campaigns"
            className="data-[state=active]:bg-brand-gradient data-[state=active]:text-white"
          >
            <Target className="mr-2 h-4 w-4" />
            My Campaigns
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="data-[state=active]:bg-brand-gradient data-[state=active]:text-white"
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <Card className="card-gradient shadow-brand">
            <CardHeader>
              <CardTitle className="text-brand-gradient flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Create Facebook Growth Campaign
              </CardTitle>
              <CardDescription>Start growing your Facebook presence with our advanced targeting system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="campaignName">Campaign Name</Label>
                  <Input
                    id="campaignName"
                    placeholder="e.g., Summer Promotion Boost"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    className="border-purple-200 focus:border-purple-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="growthType">Growth Type</Label>
                  <Select value={growthType} onValueChange={setGrowthType}>
                    <SelectTrigger className="border-purple-200 focus:border-purple-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="followers">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-600" />
                          Followers
                        </div>
                      </SelectItem>
                      <SelectItem value="likes">
                        <div className="flex items-center gap-2">
                          <Heart className="h-4 w-4 text-red-600" />
                          Page Likes
                        </div>
                      </SelectItem>
                      <SelectItem value="engagement">
                        <div className="flex items-center gap-2">
                          <MessageCircle className="h-4 w-4 text-green-600" />
                          Engagement
                        </div>
                      </SelectItem>
                      <SelectItem value="reach">
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4 text-purple-600" />
                          Reach
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pageUrl">Facebook Page/Post URL</Label>
                  <Input
                    id="pageUrl"
                    placeholder="https://facebook.com/your-page"
                    value={pageUrl}
                    onChange={(e) => setPageUrl(e.target.value)}
                    className="border-purple-200 focus:border-purple-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetCount">Target Count</Label>
                  <Input
                    id="targetCount"
                    type="number"
                    placeholder="1000"
                    value={targetCount}
                    onChange={(e) => setTargetCount(e.target.value)}
                    className="border-purple-200 focus:border-purple-400"
                  />
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Estimated Cost</h4>
                    <p className="text-sm text-gray-600">Based on current market rates</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-brand-gradient">
                      ₹{targetCount ? (Number.parseInt(targetCount) * 0.05).toFixed(2) : "0.00"}
                    </div>
                    <p className="text-sm text-gray-600">(₹0.05 per {growthType.slice(0, -1)})</p>
                  </div>
                </div>
              </div>

              <Button
                onClick={createCampaign}
                disabled={loading}
                className="w-full btn-gradient text-white shadow-brand"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Campaign...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Create Campaign
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns">
          <Card className="card-gradient shadow-brand">
            <CardHeader>
              <CardTitle className="text-brand-gradient">My Facebook Campaigns</CardTitle>
              <CardDescription>Manage and monitor your active growth campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              {campaigns.length === 0 ? (
                <div className="text-center py-8">
                  <Facebook className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No campaigns yet. Create your first Facebook growth campaign!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {campaigns.map((campaign) => (
                    <div
                      key={campaign.id}
                      className="p-4 bg-gradient-to-r from-white to-purple-50 rounded-lg border border-purple-200 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg">
                            <Facebook className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{campaign.name}</h3>
                            <p className="text-sm text-gray-600 capitalize">{campaign.type} Growth</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={campaign.status === "active" ? "default" : "secondary"}
                            className={
                              campaign.status === "active"
                                ? "bg-green-100 text-green-700"
                                : campaign.status === "paused"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-gray-100 text-gray-700"
                            }
                          >
                            {campaign.status}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleCampaign(campaign.id, campaign.status)}
                            className="border-purple-200 hover:border-purple-300"
                          >
                            {campaign.status === "active" ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div className="text-center">
                          <div className="text-lg font-bold text-brand-gradient">{campaign.currentCount}</div>
                          <div className="text-xs text-gray-600">Current</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-brand-gradient">{campaign.targetCount}</div>
                          <div className="text-xs text-gray-600">Target</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-brand-gradient">{campaign.engagement}</div>
                          <div className="text-xs text-gray-600">Engagement</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-brand-gradient">₹{campaign.cost.toFixed(2)}</div>
                          <div className="text-xs text-gray-600">Spent</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{Math.round((campaign.currentCount / campaign.targetCount) * 100)}%</span>
                        </div>
                        <Progress value={(campaign.currentCount / campaign.targetCount) * 100} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="card-gradient shadow-brand">
              <CardHeader>
                <CardTitle className="text-brand-gradient">Growth Analytics</CardTitle>
                <CardDescription>Track your Facebook growth performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                    <div className="text-2xl font-bold text-blue-700">{stats.totalFollowers}</div>
                    <div className="text-sm text-blue-600">Total Followers</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-200">
                    <div className="text-2xl font-bold text-pink-700">{stats.totalEngagement}</div>
                    <div className="text-sm text-pink-600">Total Engagement</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Growth Rate</span>
                    <span className="text-green-600 font-medium">+{stats.growthRate}%</span>
                  </div>
                  <Progress value={stats.growthRate} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card className="card-gradient shadow-brand">
              <CardHeader>
                <CardTitle className="text-brand-gradient">Campaign Performance</CardTitle>
                <CardDescription>Success metrics across all campaigns</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <div className="text-2xl font-bold text-green-700">
                      {campaigns.filter((c) => c.status === "active").length}
                    </div>
                    <div className="text-sm text-green-600">Active Campaigns</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                    <div className="text-2xl font-bold text-purple-700">₹{stats.totalSpent.toFixed(2)}</div>
                    <div className="text-sm text-purple-600">Total Investment</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Average Success Rate</span>
                    <span className="text-green-600 font-medium">87%</span>
                  </div>
                  <Progress value={87} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
