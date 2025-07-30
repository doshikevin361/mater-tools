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
  BarChart3,
  Target,
  Zap,
  Plus,
  Heart,
  MessageCircle,
  Share2,
  RefreshCw,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface FacebookCampaign {
  id: string
  name: string
  type: string
  targetUrl: string
  targetCount: number
  currentCount: number
  status: "active" | "paused" | "completed" | "failed"
  cost: number
  smmOrderId?: number
  createdAt: string
  estimatedDelivery?: string
}

interface SMMService {
  service: number
  name: string
  rate: string
  min: string
  max: string
  description?: string
}

export default function FacebookPage() {
  const [campaigns, setCampaigns] = useState<FacebookCampaign[]>([])
  const [services, setServices] = useState<SMMService[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    totalFollowers: 0,
    totalEngagement: 0,
    totalSpent: 0,
    growthRate: 0,
  })

  // Form state
  const [campaignName, setCampaignName] = useState("")
  const [growthType, setGrowthType] = useState("followers")
  const [selectedService, setSelectedService] = useState<SMMService | null>(null)
  const [targetCount, setTargetCount] = useState("")
  const [pageUrl, setPageUrl] = useState("")

  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      fetchCampaigns(parsedUser._id || parsedUser.id)
      fetchServices()
    }
  }, [])

  const fetchServices = async () => {
    try {
      const response = await fetch("/api/smm/services?platform=facebook")
      const data = await response.json()

      if (data.success) {
        setServices(data.services)
      }
    } catch (error) {
      console.error("Error fetching services:", error)
    }
  }

  const fetchCampaigns = async (userId: string) => {
    try {
      // Get SMM campaigns from the campaigns collection
      const response = await fetch(`/api/campaigns?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        // Filter for Facebook campaigns
        const facebookCampaigns = data.campaigns?.filter(c => c.platform === 'facebook') || []
        setCampaigns(facebookCampaigns)

        // Calculate stats
        const campaigns = facebookCampaigns
        setStats({
          totalCampaigns: campaigns.length,
          totalFollowers: campaigns.filter((c) => c.type === "followers").reduce((sum, c) => sum + c.currentCount, 0),
          totalEngagement: campaigns
            .filter((c) => ["likes", "comments", "shares"].includes(c.type))
            .reduce((sum, c) => sum + c.currentCount, 0),
          totalSpent: campaigns.reduce((sum, c) => sum + c.cost, 0),
          growthRate: campaigns.length > 0 ? 15.2 : 0,
        })
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error)
    }
  }

  const refreshCampaignStatus = async (campaignId: string) => {
    if (!user) return

    setRefreshing(true)
    try {
      const response = await fetch(`/api/smm/status?campaignId=${campaignId}&userId=${user._id || user.id}`)
      const data = await response.json()

      if (data.success) {
        setCampaigns((prev) => prev.map((c) => (c.id === campaignId ? { ...c, ...data.campaign } : c)))

        toast({
          title: "Status Updated",
          description: "Campaign status has been refreshed successfully.",
        })
      }
    } catch (error) {
      console.error("Error refreshing status:", error)
      toast({
        title: "Error",
        description: "Failed to refresh campaign status.",
        variant: "destructive",
      })
    } finally {
      setRefreshing(false)
    }
  }

  const createCampaign = async () => {
    if (!campaignName || !targetCount || !pageUrl || !user || !selectedService) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and select a service",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/smm/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user._id || user.id,
          platform: "facebook",
          serviceType: growthType,
          targetUrl: pageUrl,
          quantity: Number.parseInt(targetCount),
          campaignName,
          serviceId: selectedService.service,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Campaign Created!",
          description: "Your Facebook growth campaign has been started successfully.",
        })

        // Reset form
        setCampaignName("")
        setTargetCount("")
        setPageUrl("")
        setSelectedService(null)

        // Refresh campaigns and user balance
        fetchCampaigns(user._id || user.id)

        // Update user balance in localStorage
        const updatedUser = { ...user, balance: user.balance - data.campaign.cost }
        localStorage.setItem("user", JSON.stringify(updatedUser))
        setUser(updatedUser)
      } else {
        throw new Error(data.message || "Failed to create campaign")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to create campaign. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Get services for selected category
  const getServicesForCategory = (category: string): SMMService[] => {
    return services.filter((service) => {
      const serviceName = service.name.toLowerCase()
      const typeKeywords = {
        followers: ["followers", "follow", "fan"],
        likes: ["likes", "like"],
        comments: ["comments", "comment"],
        shares: ["shares", "share"],
      }

      const keywords = typeKeywords[category] || [category]
      return keywords.some((keyword) => serviceName.includes(keyword))
    })
  }

  const getServiceForType = (type: string): SMMService | null => {
    return (
      services.find((service) => {
        const serviceName = service.name.toLowerCase()
        const typeKeywords = {
          followers: ["followers", "follow", "fan"],
          likes: ["likes", "like"],
          comments: ["comments", "comment"],
          shares: ["shares", "share"],
        }

        const keywords = typeKeywords[type] || [type]
        return keywords.some((keyword) => serviceName.includes(keyword))
      }) || null
    )
  }

  const calculateCost = (service: SMMService, quantity: number): number => {
    if (!service) return 0
    const rate = Number.parseFloat(service.rate)
    return Math.max((rate * quantity) / 1000, 0.01)
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
            <p className="text-gray-600 mt-1">Boost your Facebook presence with real followers and engagement</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Account Balance</p>
          <p className="text-2xl font-bold text-green-600">₹{user?.balance?.toFixed(2) || "0.00"}</p>
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
              <span className="text-blue-600 font-medium">
                ₹{stats.totalFollowers > 0 ? (stats.totalSpent / stats.totalFollowers).toFixed(3) : "0.000"}
              </span>{" "}
              per follower
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
              <CardDescription>Start growing your Facebook presence with our premium SMM services</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                              <div className="space-y-6">
                  {/* Campaign Name */}
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

                  {/* Step 1: Category Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="growthType">Step 1: Select Category</Label>
                    <Select value={growthType} onValueChange={(value) => {
                      setGrowthType(value)
                      setSelectedService(null) // Reset service when category changes
                    }}>
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
                        <SelectItem value="comments">
                          <div className="flex items-center gap-2">
                            <MessageCircle className="h-4 w-4 text-green-600" />
                            Comments
                          </div>
                        </SelectItem>
                        <SelectItem value="shares">
                          <div className="flex items-center gap-2">
                            <Share2 className="h-4 w-4 text-purple-600" />
                            Shares
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Step 2: Service Selection - Show as Cards */}
                  {growthType && (
                    <div className="space-y-4">
                      <Label>Step 2: Select {growthType.charAt(0).toUpperCase() + growthType.slice(1)} Service</Label>
                      
                      {getServicesForCategory(growthType).length === 0 ? (
                        <p className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg">No services available for this category</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                          {getServicesForCategory(growthType).map((service) => (
                            <div
                              key={service.service}
                              className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                                selectedService?.service === service.service
                                  ? 'border-blue-500 bg-blue-50 shadow-md'
                                  : 'border-gray-200 hover:border-blue-300'
                              }`}
                              onClick={() => setSelectedService(service)}
                            >
                              <div className="flex flex-col space-y-2">
                                <h4 className="font-medium text-sm text-gray-900">{service.name}</h4>
                                <div className="flex justify-between items-center text-xs text-gray-600">
                                  <span className="font-semibold text-green-600">₹{service.rate}/1k</span>
                                  <span>Min: {service.min}</span>
                                  <span>Max: {service.max}</span>
                                </div>
                                {service.description && (
                                  <p className="text-xs text-gray-500 line-clamp-2">{service.description}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

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

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="targetCount">Target Count</Label>
                    <Input
                      id="targetCount"
                      type="number"
                      placeholder="1000"
                      value={targetCount}
                      onChange={(e) => setTargetCount(e.target.value)}
                      className="border-purple-200 focus:border-purple-400"
                      min={selectedService?.min || "1"}
                      max={selectedService?.max || "100000"}
                      disabled={!selectedService}
                    />
                    {selectedService && (
                      <p className="text-xs text-gray-600">
                        Min: {selectedService.min} | Max: {selectedService.max}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Estimated Cost</Label>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold text-green-600">
                        ₹{selectedService && targetCount ? calculateCost(selectedService, Number.parseInt(targetCount)).toFixed(2) : "0.00"}
                      </span>
                      {selectedService && (
                        <span className="text-sm text-muted-foreground">(₹{selectedService.rate} per 1000)</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {selectedService && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Selected Service Details</h4>
                    <p className="text-sm text-gray-600 font-medium">{selectedService.name}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>Rate: ₹{selectedService.rate} per 1000</div>
                      <div>Delivery: 1-3 days</div>
                      <div>Min Order: {selectedService.min}</div>
                      <div>Max Order: {selectedService.max}</div>
                    </div>
                    {selectedService.description && (
                      <p className="text-xs text-gray-500 mt-2">{selectedService.description}</p>
                    )}
                  </div>
                </div>
              )}

              <Button
                onClick={createCampaign}
                disabled={loading || !selectedService || (user?.balance || 0) < (selectedService && targetCount ? calculateCost(selectedService, Number.parseInt(targetCount)) : 0)}
                className="w-full btn-gradient text-white shadow-brand"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Campaign...
                  </>
                ) : !selectedService ? (
                  "Select a Service First"
                ) : (user?.balance || 0) < (selectedService && targetCount ? calculateCost(selectedService, Number.parseInt(targetCount)) : 0) ? (
                  "Insufficient Balance"
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Create Campaign (₹{selectedService && targetCount ? calculateCost(selectedService, Number.parseInt(targetCount)).toFixed(2) : "0.00"})
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
                                : campaign.status === "completed"
                                  ? "bg-blue-100 text-blue-700"
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
                            onClick={() => refreshCampaignStatus(campaign.id)}
                            disabled={refreshing}
                            className="border-purple-200 hover:border-purple-300"
                          >
                            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
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
                          <div className="text-lg font-bold text-brand-gradient">
                            {Math.round((campaign.currentCount / campaign.targetCount) * 100)}%
                          </div>
                          <div className="text-xs text-gray-600">Progress</div>
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

                      {campaign.smmOrderId && (
                        <div className="mt-2 text-xs text-gray-500">Order ID: {campaign.smmOrderId}</div>
                      )}
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
                    <span className="text-green-600 font-medium">
                      {campaigns.length > 0
                        ? Math.round(
                            (campaigns.filter((c) => c.status === "completed").length / campaigns.length) * 100,
                          )
                        : 0}
                      %
                    </span>
                  </div>
                  <Progress
                    value={
                      campaigns.length > 0
                        ? (campaigns.filter((c) => c.status === "completed").length / campaigns.length) * 100
                        : 0
                    }
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
