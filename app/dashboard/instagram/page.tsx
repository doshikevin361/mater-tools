"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Instagram, Users, Heart, MessageCircle, Eye, TrendingUp, Target, Camera, RefreshCw, Zap, BarChart3 } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface InstagramCampaign {
  id: string
  name: string
  type: "followers" | "likes" | "comments" | "views" | "story_views"
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

export default function InstagramPage() {
  const [campaigns, setCampaigns] = useState<InstagramCampaign[]>([])
  const [services, setServices] = useState<SMMService[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [user, setUser] = useState<any>(null)

  // Form states
  const [campaignType, setCampaignType] = useState<string>("followers")
  const [selectedService, setSelectedService] = useState<SMMService | null>(null)
  const [targetUrl, setTargetUrl] = useState("")
  const [targetCount, setTargetCount] = useState("")
  const [campaignName, setCampaignName] = useState("")
  
  // Comment-specific states
  const [commentDescription, setCommentDescription] = useState("")
  const [commentSentiment, setCommentSentiment] = useState<string>("positive")

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
      const response = await fetch("/api/smm/services?platform=instagram")
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
      const response = await fetch(`/api/instagram/campaigns?userId=${userId}`)
      const result = await response.json()

      if (result.success) {
        setCampaigns(result.campaigns)
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

    // Special handling for comments - use social-automation API
    if (campaignType === "comments") {
      if (!targetUrl || !targetCount || !commentDescription.trim()) {
        toast({
          title: "Error",
          description: "Please fill in all required fields for comments including post description",
          variant: "destructive",
        })
        return
      }

      setLoading(true)
      try {
        // Check available Instagram accounts first
        const accountCheckResponse = await fetch(`/api/social-automation/comment?checkAccounts=true&platform=instagram&count=${targetCount}`)
        const accountCheck = await accountCheckResponse.json()
        
        if (!accountCheck.success) {
          toast({
            title: "Error",
            description: accountCheck.error || "Not enough Instagram accounts available",
            variant: "destructive",
          })
          setLoading(false)
          return
        }

        // Start comment automation using social-automation API
        const response = await fetch("/api/social-automation/comment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            postUrl: targetUrl,
            postContent: commentDescription || campaignName, // Use description if provided, otherwise campaign name
            sentiment: commentSentiment,
            platforms: ["instagram"],
            accountCount: Number.parseInt(targetCount),
          }),
        })

        const data = await response.json()

        if (data.success) {
          // Create a campaign record for tracking
          const commentCampaign: InstagramCampaign = {
            id: Date.now().toString(),
            name: campaignName,
            type: "comments",
            targetUrl,
            targetCount: Number.parseInt(targetCount),
            currentCount: 0,
            status: "active",
            cost: 0, // Comments are free using social-automation
            createdAt: new Date().toISOString(),
          }

          setCampaigns([commentCampaign, ...campaigns])

          // Reset form
          setCampaignName("")
          setTargetUrl("")
          setTargetCount("")
          setSelectedService(null)
          setCommentDescription("")
          setCommentSentiment("positive")

          toast({
            title: "Comment Automation Started!",
            description: `Started commenting with ${data.accountsFound} Instagram accounts. Expected ${data.estimatedComments} comments.`,
          })
        } else {
          toast({
            title: "Error",
            description: data.error || "Failed to start comment automation",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error starting comment automation:", error)
        toast({
          title: "Error",
          description: "Failed to start comment automation",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
      return
    }

    // Original SMM panel logic for other services (followers, likes, views)
    if (!selectedService) return

    setLoading(true)
    try {
      const response = await fetch("/api/smm/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user._id || user.id,
          platform: "instagram",
          serviceType: campaignType,
          targetUrl,
          quantity: Number.parseInt(targetCount),
          campaignName,
          serviceId: selectedService.service,
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
        setSelectedService(null)

        toast({
          title: "Campaign Created!",
          description: "Your Instagram growth campaign has been started successfully.",
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
        comments: ["comments", "comment"],
        views: ["views", "view"],
        story_views: ["story", "stories"],
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
          comments: ["comments", "comment"],
          views: ["views", "view"],
          story_views: ["story", "stories"],
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "followers":
        return <Users className="h-4 w-4" />
      case "likes":
        return <Heart className="h-4 w-4" />
      case "comments":
        return <MessageCircle className="h-4 w-4" />
      case "views":
        return <Eye className="h-4 w-4" />
      case "story_views":
        return <Camera className="h-4 w-4" />
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



  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Please log in</h2>
          <p className="text-muted-foreground">You need to be logged in to access Instagram growth tools</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Instagram Campaigns
            </h1>
            <p className="text-gray-600 mt-1">Grow your Instagram with real followers, likes, and engagement</p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-3 py-1">
              Balance: ₹{user?.balance?.toFixed(2) || "0.00"}
            </Badge>
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1">
              SMM Services
            </Badge>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border border-purple-200 shadow-md overflow-hidden bg-white hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-purple-50 to-pink-50">
              <CardTitle className="text-sm font-medium text-gray-700">Total Followers</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent className="pt-2">
              <div className="text-2xl font-bold text-purple-600">
                {campaigns
                  .filter((c) => c.type === "followers")
                  .reduce((sum, c) => sum + c.currentCount, 0)
                  .toLocaleString()}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {campaigns.filter((c) => c.type === "followers").reduce((sum, c) => sum + c.currentCount, 0) > 0 ? (
                  <span className="text-green-600 font-medium">+18%</span>
                ) : (
                  <span className="text-gray-500">0%</span>
                )} this month
              </p>
            </CardContent>
          </Card>

          <Card className="border border-purple-200 shadow-md overflow-hidden bg-white hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-purple-50 to-pink-50">
              <CardTitle className="text-sm font-medium text-gray-700">Total Likes</CardTitle>
              <Heart className="h-4 w-4 text-pink-600" />
            </CardHeader>
            <CardContent className="pt-2">
              <div className="text-2xl font-bold text-purple-600">
                {campaigns
                  .filter((c) => c.type === "likes")
                  .reduce((sum, c) => sum + c.currentCount, 0)
                  .toLocaleString()}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {campaigns.filter((c) => c.type === "likes").reduce((sum, c) => sum + c.currentCount, 0) > 0 ? (
                  <span className="text-green-600 font-medium">+25%</span>
                ) : (
                  <span className="text-gray-500">0%</span>
                )} this month
              </p>
            </CardContent>
          </Card>

          <Card className="border border-purple-200 shadow-md overflow-hidden bg-white hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-purple-50 to-pink-50">
              <CardTitle className="text-sm font-medium text-gray-700">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent className="pt-2">
              <div className="text-2xl font-bold text-purple-600">
                {campaigns
                  .filter((c) => c.type === "views" || c.type === "story_views")
                  .reduce((sum, c) => sum + c.currentCount, 0)
                  .toLocaleString()}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {campaigns.filter((c) => c.type === "views" || c.type === "story_views").reduce((sum, c) => sum + c.currentCount, 0) > 0 ? (
                  <span className="text-green-600 font-medium">+32%</span>
                ) : (
                  <span className="text-gray-500">0%</span>
                )} this month
              </p>
            </CardContent>
          </Card>

          <Card className="border border-purple-200 shadow-md overflow-hidden bg-white hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-purple-50 to-pink-50">
              <CardTitle className="text-sm font-medium text-gray-700">Total Spent</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent className="pt-2">
              <div className="text-2xl font-bold text-purple-600">₹{campaigns.reduce((sum, c) => sum + c.cost, 0).toFixed(2)}</div>
              <p className="text-xs text-gray-600 mt-1">This month</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="create" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white border border-purple-200">
            <TabsTrigger
              value="create"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white"
            >
              <Zap className="h-4 w-4 mr-2" />
              Create Campaign
            </TabsTrigger>
            <TabsTrigger
              value="campaigns"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white"
            >
              <Target className="h-4 w-4 mr-2" />
              My Campaigns
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Create Campaign Tab */}
          <TabsContent value="create" className="space-y-6">
            <Card className="border border-purple-200 shadow-md overflow-hidden bg-white">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-purple-600" />
                  <span>Create Instagram Growth Campaign</span>
                </CardTitle>
                <CardDescription>
                  Boost your Instagram profile with real followers, likes, comments, and views
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
                        placeholder="e.g., Brand Awareness Campaign"
                        value={campaignName}
                        onChange={(e) => setCampaignName(e.target.value)}
                        className="border-purple-200 focus:border-purple-400 focus:ring-purple-400"
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
                        <SelectTrigger className="border-purple-200 focus:border-purple-400">
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
                          <SelectItem value="comments">
                            <div className="flex items-center space-x-2">
                              <MessageCircle className="h-4 w-4" />
                              <span>Comments</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="views">
                            <div className="flex items-center space-x-2">
                              <Eye className="h-4 w-4" />
                              <span>Video Views</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="story_views">
                            <div className="flex items-center space-x-2">
                              <Camera className="h-4 w-4" />
                              <span>Story Views</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Step 2: Service Selection - Show as Cards */}
                    {campaignType && (
                      <div className="space-y-4">
                        <Label>Step 2: Select {campaignType.charAt(0).toUpperCase() + campaignType.slice(1)} Service</Label>
                        
                        {campaignType === "comments" ? (
                          <div className="space-y-4">
                            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                              <div className="flex items-center space-x-3 mb-3">
                                <MessageCircle className="h-6 w-6 text-blue-600" />
                                <div>
                                  <h4 className="font-medium text-blue-900">AI-Powered Comment Automation</h4>
                                  <p className="text-sm text-blue-700">Using Social Automation API with real Instagram accounts</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span className="text-gray-700">AI-Generated Comments</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span className="text-gray-700">Hindi-English Mix</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span className="text-gray-700">Real Accounts</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  <span className="text-gray-700">Free Service</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  <span className="text-gray-700">2-3 sec per comment</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  <span className="text-gray-700">Even distribution</span>
                                </div>
                              </div>
                              <div className="mt-3 p-3 bg-white rounded border border-blue-100">
                                <p className="text-xs text-gray-600">
                                  <strong>How it works:</strong> Enter the number of comments you want. The system will automatically distribute them evenly across available Instagram accounts. 
                                  For example: 10 comments with 2 accounts = 5 comments per account.
                                </p>
                              </div>
                            </div>
                            
                            {/* Comment Description Field */}
                            <div className="space-y-2">
                              <Label htmlFor="commentDescription">Post Description for AI Comments</Label>
                              <Textarea
                                id="commentDescription"
                                placeholder="Describe the Instagram post content to help AI generate relevant comments... e.g., 'Beautiful sunset photo at the beach with inspirational quote about life'"
                                value={commentDescription}
                                onChange={(e) => setCommentDescription(e.target.value)}
                                className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                                rows={3}
                              />
                              <p className="text-xs text-gray-600">
                                This description helps AI generate more relevant and contextual comments based on your post content.
                              </p>
                            </div>

                            {/* Comment Sentiment Selection */}
                            <div className="space-y-3">
                              <Label className="text-base font-medium">Comment Sentiment</Label>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div
                                  className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                                    commentSentiment === "positive"
                                      ? 'border-green-500 bg-green-50 shadow-md'
                                      : 'border-gray-200 hover:border-green-300'
                                  }`}
                                  onClick={() => setCommentSentiment("positive")}
                                >
                                  <div className="flex items-center space-x-2 mb-2">
                                    <Heart className="h-5 w-5 text-green-600" />
                                    <span className="font-medium text-green-900">Positive</span>
                                  </div>
                                  <p className="text-xs text-gray-600">
                                    Generate supportive, encouraging, and positive comments
                                  </p>
                                  <div className="mt-2 text-xs text-green-700 font-medium">
                                    Examples: "Waah bhai! Amazing 🔥", "Bohot khoob! Keep it up 💯"
                                  </div>
                                </div>

                                <div
                                  className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                                    commentSentiment === "negative"
                                      ? 'border-red-500 bg-red-50 shadow-md'
                                      : 'border-gray-200 hover:border-red-300'
                                  }`}
                                  onClick={() => setCommentSentiment("negative")}
                                >
                                  <div className="flex items-center space-x-2 mb-2">
                                    <MessageCircle className="h-5 w-5 text-red-600" />
                                    <span className="font-medium text-red-900">Negative</span>
                                  </div>
                                  <p className="text-xs text-gray-600">
                                    Generate critical, questioning, or constructive feedback
                                  </p>
                                  <div className="mt-2 text-xs text-red-700 font-medium">
                                    Examples: "Thoda aur mehnat kar sakte hain 🤔", "Expected better yaar 😐"
                                  </div>
                                </div>

                                <div
                                  className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                                    commentSentiment === "neutral"
                                      ? 'border-gray-500 bg-gray-50 shadow-md'
                                      : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                  onClick={() => setCommentSentiment("neutral")}
                                >
                                  <div className="flex items-center space-x-2 mb-2">
                                    <MessageCircle className="h-5 w-5 text-gray-600" />
                                    <span className="font-medium text-gray-900">Neutral</span>
                                  </div>
                                  <p className="text-xs text-gray-600">
                                    Generate balanced, informative, and objective comments
                                  </p>
                                  <div className="mt-2 text-xs text-gray-700 font-medium">
                                    Examples: "Nice information! Thanks 👍", "Good to know! Helpful 📚"
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : getServicesForCategory(campaignType).length === 0 ? (
                          <p className="text-sm text-gray-500 p-4 bg-purple-50 rounded-lg border border-purple-100">No services available for this category</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                            {getServicesForCategory(campaignType).map((service) => (
                              <div
                                key={service.service}
                                className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                                  selectedService?.service === service.service
                                    ? 'border-purple-500 bg-purple-50 shadow-md'
                                    : 'border-gray-200 hover:border-purple-300'
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
                    <Label htmlFor="targetUrl">Instagram Profile/Post URL</Label>
                    <Input
                      id="targetUrl"
                      placeholder="https://instagram.com/your-profile"
                      value={targetUrl}
                      onChange={(e) => setTargetUrl(e.target.value)}
                      className="border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                      required
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="targetCount">
                        {campaignType === "comments" ? "Number of Comments" : "Target Count"}
                      </Label>
                      <Input
                        id="targetCount"
                        type="number"
                        placeholder={campaignType === "comments" ? "10" : "1000"}
                        value={targetCount}
                        onChange={(e) => setTargetCount(e.target.value)}
                        className="border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                        required
                        min={campaignType === "comments" ? "1" : (selectedService?.min || "1")}
                        max={campaignType === "comments" ? "100" : (selectedService?.max || "100000")}
                        disabled={campaignType !== "comments" && !selectedService}
                      />
                      {campaignType === "comments" ? (
                        <p className="text-xs text-gray-600">
                          Comments will be distributed evenly across available Instagram accounts
                        </p>
                      ) : selectedService && (
                        <p className="text-xs text-gray-600">
                          Min: {selectedService.min} | Max: {selectedService.max}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Estimated Cost</Label>
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl font-bold text-green-600">
                          {campaignType === "comments" ? "FREE" : 
                            `₹${selectedService && targetCount ? calculateCost(selectedService, Number.parseInt(targetCount)).toFixed(2) : "0.00"}`
                          }
                        </span>
                        {campaignType === "comments" ? (
                          <span className="text-sm text-muted-foreground">(Using Social Automation)</span>
                        ) : selectedService && (
                          <span className="text-sm text-muted-foreground">(₹{selectedService.rate} per 1000)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {(selectedService || campaignType === "comments") && (
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-900">
                          {campaignType === "comments" ? "Comment Automation Details" : "Selected Service Details"}
                        </h4>
                        {campaignType === "comments" ? (
                          <>
                            <p className="text-sm text-gray-600 font-medium">AI-Powered Instagram Comment Automation</p>
                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                              <div>Rate: FREE</div>
                              <div>Delivery: Real-time (2-3 sec/comment)</div>
                              <div>Min Comments: 1</div>
                              <div>Max Comments: 100</div>
                              <div>Account Distribution: Automatic</div>
                              <div>Comment Style: Hindi-English Mix</div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              Comments are generated using AI and posted through real Instagram accounts. 
                              The system automatically distributes comments evenly across available accounts.
                            </p>
                          </>
                        ) : selectedService && (
                          <>
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
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading || (campaignType !== "comments" && !selectedService) || (campaignType !== "comments" && (user?.balance || 0) < (selectedService && targetCount ? calculateCost(selectedService, Number.parseInt(targetCount)) : 0))}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        {campaignType === "comments" ? "Starting Comment Automation..." : "Creating Campaign..."}
                      </>
                    ) : campaignType === "comments" ? (
                      <>
                        <MessageCircle className="mr-2 h-5 w-5" />
                        Start Comment Automation (FREE)
                      </>
                    ) : !selectedService ? (
                      "Select a Service First"
                    ) : (user?.balance || 0) < (selectedService && targetCount ? calculateCost(selectedService, Number.parseInt(targetCount)) : 0) ? (
                      "Insufficient Balance"
                    ) : (
                      <>
                        <Zap className="mr-2 h-5 w-5" />
                        Create Instagram Campaign (₹{selectedService && targetCount ? calculateCost(selectedService, Number.parseInt(targetCount)).toFixed(2) : "0.00"})
                      </>
                    )}
                  </Button>

                  {((campaignType !== "comments" && !selectedService) || !targetCount || !campaignName || !targetUrl || (campaignType === "comments" && !commentDescription.trim()) || (campaignType !== "comments" && (user?.balance || 0) < (selectedService && targetCount ? calculateCost(selectedService, Number.parseInt(targetCount)) : 0))) && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        {campaignType !== "comments" && !selectedService && "Please select a service."}
                        {!campaignName && "Please enter a campaign name."}
                        {!targetUrl && "Please enter an Instagram profile URL."}
                        {!targetCount && `Please enter ${campaignType === "comments" ? "number of comments" : "target count"}.`}
                        {campaignType === "comments" && !commentDescription.trim() && "Please provide a post description for AI comment generation."}
                        {campaignType !== "comments" && (user?.balance || 0) < (selectedService && targetCount ? calculateCost(selectedService, Number.parseInt(targetCount)) : 0) && "Insufficient balance for this campaign."}
                      </p>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns" className="space-y-6">
            <Card className="border border-purple-200 shadow-md overflow-hidden bg-white">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-purple-600" />
                  <span>My Instagram Campaigns</span>
                </CardTitle>
                <CardDescription>Manage your Instagram growth campaigns</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {campaigns.length > 0 ? (
                  <div className="space-y-4">
                    {campaigns.map((campaign) => (
                      <div
                        key={campaign.id}
                        className="p-4 border border-purple-100 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50"
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
                              className="border-purple-200 hover:border-purple-300"
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
                            <div className="font-medium text-purple-600">{campaign.currentCount}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Progress:</span>
                            <div className="font-medium text-purple-600">
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
                    <Instagram className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No campaigns found</p>
                    <p className="text-sm text-gray-500">Create your first Instagram growth campaign to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card className="border border-purple-200 shadow-md overflow-hidden bg-white">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  <span>Campaign Analytics</span>
                </CardTitle>
                <CardDescription>Detailed performance metrics for your Instagram campaigns</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Growth Overview</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Total Campaigns</span>
                        <span className="text-lg font-bold text-purple-600">{campaigns.length}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Active Campaigns</span>
                        <span className="text-lg font-bold text-purple-600">{campaigns.filter(c => c.status === 'active').length}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Completed Campaigns</span>
                        <span className="text-lg font-bold text-purple-600">{campaigns.filter(c => c.status === 'completed').length}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Performance Metrics</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-pink-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Success Rate</span>
                        <span className="text-lg font-bold text-pink-600">
                          {campaigns.length > 0 ? Math.round((campaigns.filter(c => c.status === 'completed').length / campaigns.length) * 100) : 0}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-pink-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Avg. Cost per Campaign</span>
                        <span className="text-lg font-bold text-pink-600">
                          ₹{campaigns.length > 0 ? (campaigns.reduce((sum, c) => sum + c.cost, 0) / campaigns.length).toFixed(2) : '0.00'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-pink-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Total ROI</span>
                        <span className="text-lg font-bold text-pink-600">
                          {campaigns.reduce((sum, c) => sum + c.currentCount, 0) > 0 ? '+' : ''}
                          {campaigns.reduce((sum, c) => sum + c.currentCount, 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
