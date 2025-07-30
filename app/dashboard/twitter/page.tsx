"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import {
  Twitter,
  Users,
  Heart,
  MessageCircle,
  Repeat2,
  TrendingUp,
  Target,
  Hash,
  Activity,
  RefreshCw,
  Zap,
  BarChart3,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface TwitterCampaign {
  id: string
  name: string
  type: "followers" | "likes" | "retweets" | "comments" | "keyword_trading"
  targetUrl?: string
  keywords?: string[]
  targetCount: number
  currentCount: number
  status: "active" | "paused" | "completed" | "failed"
  cost: number
  smmOrderId?: number
  createdAt: string
  completedAt?: string
}

interface SMMService {
  service: number
  name: string
  rate: string
  min: string
  max: string
  description?: string
}

interface KeywordTrend {
  keyword: string
  volume: number
  trend: "up" | "down" | "stable"
  price: number
  change: string
}

export default function TwitterPage() {
  const [campaigns, setCampaigns] = useState<TwitterCampaign[]>([])
  const [services, setServices] = useState<SMMService[]>([])
  const [keywordTrends, setKeywordTrends] = useState<KeywordTrend[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [user, setUser] = useState<any>(null)

  // Form states
  const [campaignType, setCampaignType] = useState<string>("followers")
  const [selectedService, setSelectedService] = useState<SMMService | null>(null)
  const [targetUrl, setTargetUrl] = useState("")
  const [targetCount, setTargetCount] = useState("")
  const [campaignName, setCampaignName] = useState("")
  const [keywords, setKeywords] = useState("")

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

  // Load user info on mount
  useEffect(() => {
    const userInfo = getUserInfo()
    if (userInfo) {
      setUser(userInfo)
      loadCampaigns(userInfo._id || userInfo.id)
      fetchServices()
      loadKeywordTrends()
    }
  }, [])

  const fetchServices = async () => {
    try {
      const response = await fetch("/api/smm/services?platform=twitter")
      const data = await response.json()

      if (data.success) {
        setServices(data.services)
      }
    } catch (error) {
      console.error("Error fetching services:", error)
    }
  }

  // Load existing campaigns
  const loadCampaigns = async (userId: string) => {
    try {
      // Get SMM campaigns from the campaigns collection
      const response = await fetch(`/api/campaigns?userId=${userId}`)
      const result = await response.json()

      if (result.success) {
        // Filter for Twitter campaigns
        const twitterCampaigns = result.campaigns?.filter(c => c.platform === 'twitter') || []
        setCampaigns(twitterCampaigns)
      }
    } catch (error) {
      console.error("Error loading campaigns:", error)
    }
  }

  // Load keyword trends
  const loadKeywordTrends = async () => {
    try {
      const response = await fetch("/api/twitter/keyword-trends")
      const result = await response.json()

      if (result.success) {
        setKeywordTrends(result.trends)
      }
    } catch (error) {
      console.error("Error loading keyword trends:", error)
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

  // Create new campaign
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?._id) return

    // For keyword trading, we don't need a service selection
    if (campaignType !== "keyword_trading" && !selectedService) {
      toast({
        title: "Service Required",
        description: "Please select a service for this campaign type.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/smm/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user._id || user.id,
          platform: "twitter",
          serviceType: campaignType,
          targetUrl: campaignType === "keyword_trading" ? undefined : targetUrl,
          quantity: Number.parseInt(targetCount),
          campaignName,
          serviceId: selectedService?.service,
          keywords:
            campaignType === "keyword_trading"
              ? keywords
                  .split(",")
                  .map((k) => k.trim())
                  .filter((k) => k)
              : undefined,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setCampaigns([data.campaign, ...campaigns])

        // Update user balance
        const updatedUser = { ...user, balance: user.balance - data.campaign.cost }
        localStorage.setItem("user", JSON.stringify(updatedUser))
        setUser(updatedUser)

        // Reset form
        setCampaignName("")
        setTargetUrl("")
        setTargetCount("")
        setKeywords("")
        setSelectedService(null)

        toast({
          title: "Campaign Created!",
          description: "Your Twitter campaign has been started successfully.",
        })
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to create campaign",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating campaign:", error)
      toast({
        title: "Error",
        description: "Failed to create campaign",
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
        followers: ["followers", "follow"],
        likes: ["likes", "like"],
        retweets: ["retweets", "retweet", "rt"],
        comments: ["comments", "comment", "reply"],
        keyword_trading: ["keyword", "trend", "trading"],
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
          followers: ["followers", "follow"],
          likes: ["likes", "like"],
          retweets: ["retweets", "retweet", "rt"],
          comments: ["comments", "comment", "reply"],
          keyword_trading: ["keyword", "trend", "trading"],
        }

        const keywords = typeKeywords[type] || [type]
        return keywords.some((keyword) => serviceName.includes(keyword))
      }) || null
    )
  }

  const calculateCost = (service: SMMService | null, quantity: number): number => {
    if (campaignType === "keyword_trading") {
      return quantity * 1.0 // ₹1.00 per keyword per day
    }

    if (!service) return 0
    const rate = Number.parseFloat(service.rate)
    return Math.max((rate * quantity) / 1000, 0.01)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "followers":
        return <Users className="h-4 w-4" />
      case "likes":
        return <Heart className="h-4 w-4" />
      case "retweets":
        return <Repeat2 className="h-4 w-4" />
      case "comments":
        return <MessageCircle className="h-4 w-4" />
      case "keyword_trading":
        return <Hash className="h-4 w-4" />
      default:
        return <Target className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500"
      case "paused":
        return "bg-yellow-500"
      case "completed":
        return "bg-blue-500"
      case "failed":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case "down":
        return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }



  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Please log in</h2>
          <p className="text-muted-foreground">You need to be logged in to access Twitter growth tools</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Twitter Campaigns
            </h1>
            <p className="text-gray-600 mt-1">Grow your Twitter presence and trade trending keywords</p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1">
              Balance: ₹{user?.balance?.toFixed(2) || "0.00"}
            </Badge>
            <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 py-1">
              SMM Services
            </Badge>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border border-blue-200 shadow-md overflow-hidden bg-white hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-blue-50 to-cyan-50">
              <CardTitle className="text-sm font-medium text-gray-700">Total Followers</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent className="pt-2">
              <div className="text-2xl font-bold text-blue-600">
                {campaigns
                  .filter((c) => c.type === "followers")
                  .reduce((sum, c) => sum + c.currentCount, 0)
                  .toLocaleString()}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                <span className="text-green-600 font-medium">+20%</span> this month
              </p>
            </CardContent>
          </Card>

          <Card className="border border-blue-200 shadow-md overflow-hidden bg-white hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-blue-50 to-cyan-50">
              <CardTitle className="text-sm font-medium text-gray-700">Total Engagement</CardTitle>
              <Heart className="h-4 w-4 text-pink-600" />
            </CardHeader>
            <CardContent className="pt-2">
              <div className="text-2xl font-bold text-blue-600">
                {campaigns
                  .filter((c) => c.type === "likes" || c.type === "retweets")
                  .reduce((sum, c) => sum + c.currentCount, 0)
                  .toLocaleString()}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                <span className="text-green-600 font-medium">+30%</span> this month
              </p>
            </CardContent>
          </Card>

          <Card className="border border-blue-200 shadow-md overflow-hidden bg-white hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-blue-50 to-cyan-50">
              <CardTitle className="text-sm font-medium text-gray-700">Keywords Traded</CardTitle>
              <Hash className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent className="pt-2">
              <div className="text-2xl font-bold text-blue-600">
                {campaigns
                  .filter((c) => c.type === "keyword_trading")
                  .reduce((sum, c) => sum + (c.keywords?.length || 0), 0)}
              </div>
              <p className="text-xs text-gray-600 mt-1">Active keywords</p>
            </CardContent>
          </Card>

          <Card className="border border-blue-200 shadow-md overflow-hidden bg-white hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-blue-50 to-cyan-50">
              <CardTitle className="text-sm font-medium text-gray-700">Total Spent</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent className="pt-2">
              <div className="text-2xl font-bold text-blue-600">₹{campaigns.reduce((sum, c) => sum + c.cost, 0).toFixed(2)}</div>
              <p className="text-xs text-gray-600 mt-1">This month</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="create" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white border border-blue-200">
            <TabsTrigger
              value="create"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white"
            >
              <Zap className="h-4 w-4 mr-2" />
              Create Campaign
            </TabsTrigger>
            <TabsTrigger
              value="campaigns"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white"
            >
              <Target className="h-4 w-4 mr-2" />
              My Campaigns
            </TabsTrigger>
            <TabsTrigger
              value="trading"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white"
            >
              <Hash className="h-4 w-4 mr-2" />
              Keyword Trading
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Create Campaign Tab */}
          <TabsContent value="create" className="space-y-6">
            <Card className="border border-blue-200 shadow-md overflow-hidden bg-white">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100">
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                  <span>Create Twitter Campaign</span>
                </CardTitle>
                <CardDescription>
                  Boost your Twitter presence with followers, engagement, or start keyword trading
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleCreateCampaign} className="space-y-6">
                  <div className="space-y-6">
                    {/* Campaign Name */}
                    <div className="space-y-2">
                      <Label htmlFor="campaignName">Campaign Name</Label>
                      <Input
                        id="campaignName"
                        placeholder="e.g., Twitter Growth Campaign"
                        value={campaignName}
                        onChange={(e) => setCampaignName(e.target.value)}
                        className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                        required
                      />
                    </div>

                    {/* Step 1: Category Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="campaignType">Step 1: Select Category</Label>
                      <Select value={campaignType} onValueChange={(value) => {
                        setCampaignType(value)
                        setSelectedService(null) // Reset service when category changes
                      }}>
                        <SelectTrigger className="border-blue-200 focus:border-blue-400">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="followers">
                            <div className="flex items-center space-x-2">
                              <Users className="h-4 w-4" />
                              <span>Followers</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="likes">
                            <div className="flex items-center space-x-2">
                              <Heart className="h-4 w-4" />
                              <span>Likes</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="retweets">
                            <div className="flex items-center space-x-2">
                              <Repeat2 className="h-4 w-4" />
                              <span>Retweets</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="comments">
                            <div className="flex items-center space-x-2">
                              <MessageCircle className="h-4 w-4" />
                              <span>Comments</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="keyword_trading">
                            <div className="flex items-center space-x-2">
                              <Hash className="h-4 w-4" />
                              <span>Keyword Trading</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Step 2: Service Selection - Show as Cards (except for keyword trading) */}
                    {campaignType && campaignType !== "keyword_trading" && (
                      <div className="space-y-4">
                        <Label>Step 2: Select {campaignType.charAt(0).toUpperCase() + campaignType.slice(1)} Service</Label>
                        
                        {getServicesForCategory(campaignType).length === 0 ? (
                          <p className="text-sm text-gray-500 p-4 bg-blue-50 rounded-lg border border-blue-100">No services available for this category</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                            {getServicesForCategory(campaignType).map((service) => (
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
                  </div>

                  {campaignType === "keyword_trading" ? (
                    <div className="space-y-2">
                      <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                      <Textarea
                        id="keywords"
                        placeholder="bitcoin, crypto, blockchain, NFT"
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                        className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                        required
                      />
                      <p className="text-sm text-muted-foreground">
                        Enter keywords you want to track and trade. Separate multiple keywords with commas.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="targetUrl">Twitter Profile/Tweet URL</Label>
                      <Input
                        id="targetUrl"
                        placeholder="https://twitter.com/your-profile"
                        value={targetUrl}
                        onChange={(e) => setTargetUrl(e.target.value)}
                        className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                        required
                      />
                    </div>
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="targetCount">
                        {campaignType === "keyword_trading" ? "Trading Days" : "Target Count"}
                      </Label>
                      <Input
                        id="targetCount"
                        type="number"
                        placeholder={campaignType === "keyword_trading" ? "30" : "1000"}
                        value={targetCount}
                        onChange={(e) => setTargetCount(e.target.value)}
                        className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                        required
                        min="1"
                        max={selectedService?.max || "100000"}
                        disabled={campaignType !== "keyword_trading" && !selectedService}
                      />
                      {selectedService && campaignType !== "keyword_trading" && (
                        <p className="text-xs text-gray-600">
                          Min: {selectedService.min} | Max: {selectedService.max}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Estimated Cost</Label>
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl font-bold text-green-600">
                          ₹{targetCount ? calculateCost(selectedService, Number.parseInt(targetCount)).toFixed(2) : "0.00"}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {campaignType === "keyword_trading"
                            ? "(₹1.00 per keyword/day)"
                            : selectedService
                              ? `(₹${selectedService.rate} per 1000)`
                              : ""}
                        </span>
                      </div>
                    </div>
                  </div>

                  {selectedService && campaignType !== "keyword_trading" && (
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-200">
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
                    type="submit"
                    disabled={
                      loading ||
                      (campaignType !== "keyword_trading" && !selectedService) ||
                      (user?.balance || 0) < (targetCount ? calculateCost(selectedService, Number.parseInt(targetCount)) : 0)
                    }
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Creating Campaign...
                      </>
                    ) : campaignType !== "keyword_trading" && !selectedService ? (
                      "Select a Service First"
                    ) : (user?.balance || 0) < (targetCount ? calculateCost(selectedService, Number.parseInt(targetCount)) : 0) ? (
                      "Insufficient Balance"
                    ) : (
                      <>
                        <Zap className="mr-2 h-5 w-5" />
                        Create Twitter Campaign (₹{targetCount ? calculateCost(selectedService, Number.parseInt(targetCount)).toFixed(2) : "0.00"})
                      </>
                    )}
                  </Button>

                  {((campaignType !== "keyword_trading" && !selectedService) || !targetCount || !campaignName || (campaignType !== "keyword_trading" && !targetUrl) || (campaignType === "keyword_trading" && !keywords) || (user?.balance || 0) < (targetCount ? calculateCost(selectedService, Number.parseInt(targetCount)) : 0)) && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        {campaignType !== "keyword_trading" && !selectedService && "Please select a service."}
                        {!campaignName && "Please enter a campaign name."}
                        {campaignType !== "keyword_trading" && !targetUrl && "Please enter a Twitter profile URL."}
                        {campaignType === "keyword_trading" && !keywords && "Please enter keywords."}
                        {!targetCount && "Please enter a target count."}
                        {(user?.balance || 0) < (targetCount ? calculateCost(selectedService, Number.parseInt(targetCount)) : 0) && "Insufficient balance for this campaign."}
                      </p>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns" className="space-y-6">
            <Card className="border border-blue-200 shadow-md overflow-hidden bg-white">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100">
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  <span>My Twitter Campaigns</span>
                </CardTitle>
                <CardDescription>Manage your Twitter growth and trading campaigns</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {campaigns.length > 0 ? (
                  <div className="space-y-4">
                    {campaigns.map((campaign) => (
                      <div
                        key={campaign.id}
                        className="p-4 border border-blue-100 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900">{campaign.name}</h3>
                          <div className="flex items-center space-x-2">
                            <Badge className={`${getStatusColor(campaign.status)} text-white`}>
                              {campaign.status}
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => refreshCampaignStatus(campaign.id)}
                              disabled={refreshing}
                              className="border-blue-200 hover:border-blue-300"
                            >
                              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Target:</span>
                            <div className="font-medium">{campaign.targetCount}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Current:</span>
                            <div className="font-medium text-blue-600">{campaign.currentCount}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Progress:</span>
                            <div className="font-medium text-blue-600">
                              {Math.round((campaign.currentCount / campaign.targetCount) * 100)}%
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-600">Cost:</span>
                            <div className="font-medium">₹{campaign.cost.toFixed(2)}</div>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">Created: {new Date(campaign.createdAt).toLocaleDateString()}</div>
                        {campaign.currentCount > 0 && (
                          <div className="mt-2">
                            <Progress value={(campaign.currentCount / campaign.targetCount) * 100} className="h-2" />
                            <div className="text-xs text-gray-600 mt-1">
                              Success Rate: {((campaign.currentCount / campaign.targetCount) * 100).toFixed(1)}%
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Twitter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No campaigns found</p>
                    <p className="text-sm text-gray-500">Create your first Twitter campaign to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Keyword Trading Tab */}
          <TabsContent value="trading" className="space-y-6">
            <Card className="border border-blue-200 shadow-md overflow-hidden bg-white">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100">
                <CardTitle className="flex items-center space-x-2">
                  <Hash className="h-5 w-5 text-blue-600" />
                  <span>Trending Keywords</span>
                </CardTitle>
                <CardDescription>Monitor and trade popular keywords on Twitter</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="rounded-md border border-blue-100">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Keyword</TableHead>
                        <TableHead>Volume</TableHead>
                        <TableHead>Trend</TableHead>
                        <TableHead>Price (per day)</TableHead>
                        <TableHead>Change</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        { keyword: "#Bitcoin", volume: 125000, trend: "up", price: 2.5, change: "+15%" },
                        { keyword: "#AI", volume: 98000, trend: "up", price: 2.2, change: "+8%" },
                        { keyword: "#Crypto", volume: 87000, trend: "down", price: 1.8, change: "-5%" },
                        { keyword: "#NFT", volume: 65000, trend: "stable", price: 1.5, change: "0%" },
                        { keyword: "#Web3", volume: 54000, trend: "up", price: 1.75, change: "+12%" },
                      ].map((trend, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{trend.keyword}</TableCell>
                          <TableCell>{trend.volume.toLocaleString()}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getTrendIcon(trend.trend)}
                              <span className="capitalize">{trend.trend}</span>
                            </div>
                          </TableCell>
                          <TableCell>₹{trend.price.toFixed(2)}</TableCell>
                          <TableCell>
                            <span
                              className={`font-medium ${
                                trend.change.startsWith("+")
                                  ? "text-green-600"
                                  : trend.change.startsWith("-")
                                    ? "text-red-600"
                                    : "text-gray-600"
                              }`}
                            >
                              {trend.change}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline" className="border-blue-200 hover:border-blue-300">
                              Trade
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="border border-blue-200 shadow-md overflow-hidden bg-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-blue-50 to-cyan-50">
                  <CardTitle className="text-sm font-medium text-gray-700">Total Followers</CardTitle>
                  <Users className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="text-2xl font-bold text-blue-600">
                    {campaigns
                      .filter((c) => c.type === "followers")
                      .reduce((sum, c) => sum + c.currentCount, 0)
                      .toLocaleString()}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    <span className="text-green-600 font-medium">+20%</span> from last month
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-blue-200 shadow-md overflow-hidden bg-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-blue-50 to-cyan-50">
                  <CardTitle className="text-sm font-medium text-gray-700">Total Engagement</CardTitle>
                  <Heart className="h-4 w-4 text-pink-600" />
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="text-2xl font-bold text-blue-600">
                    {campaigns
                      .filter((c) => c.type === "likes" || c.type === "retweets")
                      .reduce((sum, c) => sum + c.currentCount, 0)
                      .toLocaleString()}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    <span className="text-green-600 font-medium">+30%</span> from last month
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-blue-200 shadow-md overflow-hidden bg-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-blue-50 to-cyan-50">
                  <CardTitle className="text-sm font-medium text-gray-700">Keywords Traded</CardTitle>
                  <Hash className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="text-2xl font-bold text-blue-600">
                    {campaigns
                      .filter((c) => c.type === "keyword_trading")
                      .reduce((sum, c) => sum + (c.keywords?.length || 0), 0)}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Active keywords</p>
                </CardContent>
              </Card>

              <Card className="border border-blue-200 shadow-md overflow-hidden bg-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-blue-50 to-cyan-50">
                  <CardTitle className="text-sm font-medium text-gray-700">Total Spent</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="text-2xl font-bold text-blue-600">₹{campaigns.reduce((sum, c) => sum + c.cost, 0).toFixed(2)}</div>
                  <p className="text-xs text-gray-600 mt-1">This month</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
