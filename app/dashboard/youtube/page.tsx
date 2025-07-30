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
import {
  Youtube,
  Users,
  ThumbsUp,
  MessageCircle,
  Eye,
  TrendingUp,
  Target,
  Play,
  Pause,
  ThumbsDown,
  Share2,
  RefreshCw,
  Zap,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface YouTubeCampaign {
  id: string
  name: string
  type: "subscribers" | "likes" | "dislikes" | "comments" | "views" | "shares"
  targetUrl: string
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

export default function YouTubePage() {
  const [campaigns, setCampaigns] = useState<YouTubeCampaign[]>([])
  const [services, setServices] = useState<SMMService[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [user, setUser] = useState<any>(null)

  // Form states
  const [campaignType, setCampaignType] = useState<string>("subscribers")
  const [targetUrl, setTargetUrl] = useState("")
  const [targetCount, setTargetCount] = useState("")
  const [campaignName, setCampaignName] = useState("")

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
    }
  }, [])

  const fetchServices = async () => {
    try {
      const response = await fetch("/api/smm/services?platform=youtube")
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
        // Filter for YouTube campaigns
        const youtubeCampaigns = result.campaigns?.filter(c => c.platform === 'youtube') || []
        setCampaigns(youtubeCampaigns)
      }
    } catch (error) {
      console.error("Error loading campaigns:", error)
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
          platform: "youtube",
          serviceType: campaignType,
          targetUrl,
          quantity: Number.parseInt(targetCount),
          campaignName,
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

        toast({
          title: "Campaign Created!",
          description: "Your YouTube growth campaign has been started successfully.",
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
        subscribers: ["subscribers", "subscribe"],
        likes: ["likes", "like"],
        dislikes: ["dislikes", "dislike"],
        comments: ["comments", "comment"],
        views: ["views", "view"],
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
          subscribers: ["subscribers", "subscribe"],
          likes: ["likes", "like"],
          dislikes: ["dislikes", "dislike"],
          comments: ["comments", "comment"],
          views: ["views", "view"],
          shares: ["shares", "share"],
        }

        const keywords = typeKeywords[type] || [type]
        return keywords.some((keyword) => serviceName.includes(keyword))
      }) || null
    )
  }

  const calculateCost = (type: string, quantity: number): number => {
    const service = getServiceForType(type)
    if (!service) return 0

    const rate = Number.parseFloat(service.rate)
    return Math.max((rate * quantity) / 1000, 0.01)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "subscribers":
        return <Users className="h-4 w-4" />
      case "likes":
        return <ThumbsUp className="h-4 w-4" />
      case "dislikes":
        return <ThumbsDown className="h-4 w-4" />
      case "comments":
        return <MessageCircle className="h-4 w-4" />
      case "views":
        return <Eye className="h-4 w-4" />
      case "shares":
        return <Share2 className="h-4 w-4" />
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

  const currentService = getServiceForType(campaignType)
  const estimatedCost = targetCount ? calculateCost(campaignType, Number.parseInt(targetCount)) : 0

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Please log in</h2>
          <p className="text-muted-foreground">You need to be logged in to access YouTube growth tools</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-red-600">
            <Youtube className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">YouTube Growth</h1>
            <p className="text-muted-foreground">Grow your YouTube channel with subscribers, views, and engagement</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Account Balance</p>
          <p className="text-2xl font-bold text-green-600">₹{user.balance}</p>
        </div>
      </div>

      <Tabs defaultValue="create" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="create">Create Campaign</TabsTrigger>
          <TabsTrigger value="campaigns">My Campaigns</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Create Campaign Tab */}
        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create YouTube Growth Campaign</CardTitle>
              <CardDescription>
                Boost your YouTube channel with real subscribers, views, likes, and engagement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateCampaign} className="space-y-6">
                <div className="space-y-6">
                  {/* Campaign Name */}
                  <div className="space-y-2">
                    <Label htmlFor="campaignName">Campaign Name</Label>
                    <Input
                      id="campaignName"
                      placeholder="e.g., Channel Growth Campaign"
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
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
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="subscribers">
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4" />
                            <span>Subscribers</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="views">
                          <div className="flex items-center space-x-2">
                            <Eye className="h-4 w-4" />
                            <span>Views</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="likes">
                          <div className="flex items-center space-x-2">
                            <ThumbsUp className="h-4 w-4" />
                            <span>Likes</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="comments">
                          <div className="flex items-center space-x-2">
                            <MessageCircle className="h-4 w-4" />
                            <span>Comments</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="shares">
                          <div className="flex items-center space-x-2">
                            <Share2 className="h-4 w-4" />
                            <span>Shares</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Step 2: Service Selection - Show as Cards */}
                  {campaignType && (
                    <div className="space-y-4">
                      <Label>Step 2: Select {campaignType.charAt(0).toUpperCase() + campaignType.slice(1)} Service</Label>
                      
                      {getServicesForCategory(campaignType).length === 0 ? (
                        <p className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg">No services available for this category</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                          {getServicesForCategory(campaignType).map((service) => (
                            <div
                              key={service.service}
                              className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                                selectedService?.service === service.service
                                  ? 'border-red-500 bg-red-50 shadow-md'
                                  : 'border-gray-200 hover:border-red-300'
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

                <div className="space-y-2">
                  <Label htmlFor="targetUrl">YouTube Channel/Video URL</Label>
                  <Input
                    id="targetUrl"
                    placeholder="https://youtube.com/channel/your-channel"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    required
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
                      required
                      min={currentService?.min || "1"}
                      max={currentService?.max || "100000"}
                    />
                    {currentService && (
                      <p className="text-xs text-gray-600">
                        Min: {currentService.min} | Max: {currentService.max}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Estimated Cost</Label>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold text-green-600">₹{estimatedCost.toFixed(2)}</span>
                      {currentService && (
                        <span className="text-sm text-muted-foreground">(₹{currentService.rate} per 1000)</span>
                      )}
                    </div>
                  </div>
                </div>

                {currentService && (
                  <div className="bg-gradient-to-r from-red-50 to-pink-50 p-4 rounded-lg border border-red-200">
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
                  disabled={loading || !currentService || (user?.balance || 0) < estimatedCost}
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
              <CardDescription>Manage your YouTube growth campaigns</CardDescription>
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
                                {campaign.targetUrl}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getTypeIcon(campaign.type)}
                              <span className="capitalize">{campaign.type}</span>
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
                  <Youtube className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No campaigns yet</h3>
                  <p className="text-muted-foreground mb-4">Create your first YouTube growth campaign</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {campaigns
                    .filter((c) => c.type === "subscribers")
                    .reduce((sum, c) => sum + c.currentCount, 0)
                    .toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">+22% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {campaigns
                    .filter((c) => c.type === "views")
                    .reduce((sum, c) => sum + c.currentCount, 0)
                    .toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">+35% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
                <ThumbsUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {campaigns
                    .filter((c) => c.type === "likes")
                    .reduce((sum, c) => sum + c.currentCount, 0)
                    .toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">+28% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
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
