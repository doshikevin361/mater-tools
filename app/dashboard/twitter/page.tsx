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
      const response = await fetch(`/api/twitter/campaigns?userId=${userId}`)
      const result = await response.json()

      if (result.success) {
        setCampaigns(result.campaigns)
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

  const calculateCost = (type: string, quantity: number): number => {
    if (type === "keyword_trading") {
      return quantity * 1.0 // ₹1.00 per keyword per day
    }

    const service = getServiceForType(type)
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

  const currentService = getServiceForType(campaignType)
  const estimatedCost = targetCount ? calculateCost(campaignType, Number.parseInt(targetCount)) : 0

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-500">
            <Twitter className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Twitter Growth & Trading</h1>
            <p className="text-muted-foreground">Grow your Twitter presence and trade trending keywords</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Account Balance</p>
          <p className="text-2xl font-bold text-green-600">₹{user?.balance?.toFixed(2) || "0.00"}</p>
        </div>
      </div>

      <Tabs defaultValue="create" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="create">Create Campaign</TabsTrigger>
          <TabsTrigger value="campaigns">My Campaigns</TabsTrigger>
          <TabsTrigger value="trading">Keyword Trading</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Create Campaign Tab */}
        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Create Twitter Campaign
              </CardTitle>
              <CardDescription>
                Boost your Twitter presence with followers, engagement, or start keyword trading
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateCampaign} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="campaignName">Campaign Name</Label>
                    <Input
                      id="campaignName"
                      placeholder="e.g., Twitter Growth Campaign"
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="campaignType">Campaign Type</Label>
                    <Select value={campaignType} onValueChange={setCampaignType}>
                      <SelectTrigger>
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
                </div>

                {campaignType === "keyword_trading" ? (
                  <div className="space-y-2">
                    <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                    <Textarea
                      id="keywords"
                      placeholder="bitcoin, crypto, blockchain, NFT"
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
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
                      required
                      min="1"
                      max={currentService?.max || "100000"}
                    />
                    {currentService && campaignType !== "keyword_trading" && (
                      <p className="text-xs text-gray-600">
                        Min: {currentService.min} | Max: {currentService.max}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Estimated Cost</Label>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold text-green-600">₹{estimatedCost.toFixed(2)}</span>
                      <span className="text-sm text-muted-foreground">
                        {campaignType === "keyword_trading"
                          ? "(₹1.00 per keyword/day)"
                          : currentService
                            ? `(₹${currentService.rate} per 1000)`
                            : ""}
                      </span>
                    </div>
                  </div>
                </div>

                {currentService && campaignType !== "keyword_trading" && (
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-200">
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900">Service Details</h4>
                      <p className="text-sm text-gray-600">{currentService.name}</p>
                      <div className="text-sm text-gray-600">
                        Rate: ₹{currentService.rate} per 1000 | Estimated delivery: 1-3 days
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={
                    loading ||
                    (campaignType !== "keyword_trading" && !currentService) ||
                    (user?.balance || 0) < estimatedCost
                  }
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating Campaign...
                    </>
                  ) : (user?.balance || 0) < estimatedCost ? (
                    "Insufficient Balance"
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Create Campaign (₹{estimatedCost.toFixed(2)})
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Campaigns</CardTitle>
              <CardDescription>Manage your Twitter growth and trading campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              {campaigns.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Campaign</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Cost</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {campaigns.map((campaign) => (
                        <TableRow key={campaign.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{campaign.name}</div>
                              <div className="text-sm text-muted-foreground truncate max-w-xs">
                                {campaign.targetUrl || (campaign.keywords && campaign.keywords.join(", "))}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getTypeIcon(campaign.type)}
                              <span className="capitalize">{campaign.type.replace("_", " ")}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>{campaign.currentCount}</span>
                                <span>{campaign.targetCount}</span>
                              </div>
                              <Progress value={(campaign.currentCount / campaign.targetCount) * 100} className="h-2" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              <div className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(campaign.status)}`} />
                              {campaign.status}
                            </Badge>
                          </TableCell>
                          <TableCell>₹{campaign.cost.toFixed(2)}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => refreshCampaignStatus(campaign.id)}
                              disabled={refreshing}
                            >
                              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Twitter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No campaigns yet</h3>
                  <p className="text-muted-foreground mb-4">Create your first Twitter campaign</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Keyword Trading Tab */}
        <TabsContent value="trading" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Trending Keywords</CardTitle>
              <CardDescription>Monitor and trade popular keywords on Twitter</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
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
                          <Button size="sm" variant="outline">
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
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Followers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {campaigns
                    .filter((c) => c.type === "followers")
                    .reduce((sum, c) => sum + c.currentCount, 0)
                    .toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">+20% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Engagement</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {campaigns
                    .filter((c) => c.type === "likes" || c.type === "retweets")
                    .reduce((sum, c) => sum + c.currentCount, 0)
                    .toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">+30% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Keywords Traded</CardTitle>
                <Hash className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {campaigns
                    .filter((c) => c.type === "keyword_trading")
                    .reduce((sum, c) => sum + (c.keywords?.length || 0), 0)}
                </div>
                <p className="text-xs text-muted-foreground">Active keywords</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{campaigns.reduce((sum, c) => sum + c.cost, 0).toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
