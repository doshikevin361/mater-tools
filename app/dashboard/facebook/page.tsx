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
  ThumbsUp,
  ThumbsDown,
  Send,
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

interface FacebookAccount {
  _id: string
  email: string
  username?: string
  status: string
  verified: boolean
}

interface CommentCampaign {
  _id: string
  name: string
  platform: string
  targetUrl: string
  sentiment: string
  totalComments: number
  completedComments: number
  failedComments: number
  status: string
  createdAt: string
}

export default function FacebookPage() {
  const [campaigns, setCampaigns] = useState<FacebookCampaign[]>([])
  const [accounts, setAccounts] = useState<FacebookAccount[]>([])
  const [commentCampaigns, setCommentCampaigns] = useState<CommentCampaign[]>([])
  const [loading, setLoading] = useState(false)
  const [commentLoading, setCommentLoading] = useState(false)
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

  // Comment form state
  const [commentTargetUrl, setCommentTargetUrl] = useState("")
  const [commentSentiment, setCommentSentiment] = useState<"positive" | "negative" | "">("")
  const [commentCount, setCommentCount] = useState("50")
  const [generatedComments, setGeneratedComments] = useState<string[]>([])
  const [showComments, setShowComments] = useState(false)

  useEffect(() => {
    fetchCampaigns()
    fetchAccounts()
    fetchCommentCampaigns()
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

  const fetchAccounts = async () => {
    try {
      const userData = localStorage.getItem("user")
      if (!userData) return

      const user = JSON.parse(userData)
      const userId = user._id || user.id

      const response = await fetch(`/api/facebook-accounts/create?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setAccounts(data.accounts || [])
      }
    } catch (error) {
      console.error("Error fetching accounts:", error)
    }
  }

  const fetchCommentCampaigns = async () => {
    try {
      const userData = localStorage.getItem("user")
      if (!userData) return

      const user = JSON.parse(userData)
      const userId = user._id || user.id

      const response = await fetch(`/api/comments/campaigns?userId=${userId}&platform=facebook`)
      if (response.ok) {
        const data = await response.json()
        setCommentCampaigns(data.campaigns || [])
      }
    } catch (error) {
      console.error("Error fetching comment campaigns:", error)
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

  const generateComments = async () => {
    if (!commentTargetUrl || !commentSentiment) {
      toast({
        title: "Missing Information",
        description: "Please provide target URL and select sentiment",
        variant: "destructive",
      })
      return
    }

    setCommentLoading(true)
    try {
      const response = await fetch("/api/comments/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: "facebook",
          sentiment: commentSentiment,
          targetUrl: commentTargetUrl,
          count: Number.parseInt(commentCount),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setGeneratedComments(data.comments)
        setShowComments(true)
        toast({
          title: "Comments Generated!",
          description: `Generated ${data.comments.length} ${commentSentiment} comments for Facebook.`,
        })
      } else {
        throw new Error("Failed to generate comments")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate comments. Please try again.",
        variant: "destructive",
      })
    } finally {
      setCommentLoading(false)
    }
  }

  const postComments = async () => {
    if (generatedComments.length === 0) {
      toast({
        title: "No Comments",
        description: "Please generate comments first",
        variant: "destructive",
      })
      return
    }

    if (accounts.length === 0) {
      toast({
        title: "No Accounts",
        description: "No Facebook accounts available. Please create accounts first.",
        variant: "destructive",
      })
      return
    }

    setCommentLoading(true)
    try {
      const userData = localStorage.getItem("user")
      if (!userData) throw new Error("User not logged in")

      const user = JSON.parse(userData)
      const userId = user._id || user.id

      const response = await fetch("/api/comments/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          platform: "facebook",
          targetUrl: commentTargetUrl,
          comments: generatedComments,
          sentiment: commentSentiment,
          campaignName: `Facebook ${commentSentiment} Comments - ${new Date().toLocaleDateString()}`,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Comments Posted!",
          description: `Started posting ${generatedComments.length} comments. ${data.results.successful} successful, ${data.results.failed} failed.`,
        })

        // Reset form
        setCommentTargetUrl("")
        setCommentSentiment("")
        setGeneratedComments([])
        setShowComments(false)

        // Refresh comment campaigns
        fetchCommentCampaigns()
      } else {
        throw new Error("Failed to post comments")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to post comments. Please try again.",
        variant: "destructive",
      })
    } finally {
      setCommentLoading(false)
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
            <p className="text-gray-600 mt-1">Boost your Facebook presence with targeted campaigns and comments</p>
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
            <CardTitle className="text-sm font-medium text-gray-700">Available Accounts</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-gradient">{accounts.length}</div>
            <p className="text-xs text-gray-600 mt-1">
              <span className="text-blue-600 font-medium">{accounts.filter((a) => a.status === "active").length}</span>{" "}
              active accounts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="create" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-white/50 backdrop-blur-sm border border-purple-200">
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
            value="comments"
            className="data-[state=active]:bg-brand-gradient data-[state=active]:text-white"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Comments
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
                              <Pause className="h-4 w-4 text-gray-600" />
                            ) : (
                              <Play className="h-4 w-4 text-gray-600" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Target: {campaign.targetCount}</p>
                          <p className="text-sm text-gray-600">Current: {campaign.currentCount}</p>
                        </div>
                        <div>
                          <Progress value={(campaign.currentCount / campaign.targetCount) * 100} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comments">
          <Card className="card-gradient shadow-brand">
            <CardHeader>
              <CardTitle className="text-brand-gradient">Facebook Comments</CardTitle>
              <CardDescription>Generate and post comments on your Facebook posts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="commentTargetUrl">Target URL</Label>
                  <Input
                    id="commentTargetUrl"
                    placeholder="https://facebook.com/your-post"
                    value={commentTargetUrl}
                    onChange={(e) => setCommentTargetUrl(e.target.value)}
                    className="border-purple-200 focus:border-purple-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="commentSentiment">Sentiment</Label>
                  <Select value={commentSentiment} onValueChange={setCommentSentiment}>
                    <SelectTrigger className="border-purple-200 focus:border-purple-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="positive">
                        <div className="flex items-center gap-2">
                          <ThumbsUp className="h-4 w-4 text-green-600" />
                          Positive
                        </div>
                      </SelectItem>
                      <SelectItem value="negative">
                        <div className="flex items-center gap-2">
                          <ThumbsDown className="h-4 w-4 text-red-600" />
                          Negative
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="commentCount">Number of Comments</Label>
                  <Input
                    id="commentCount"
                    type="number"
                    placeholder="50"
                    value={commentCount}
                    onChange={(e) => setCommentCount(e.target.value)}
                    className="border-purple-200 focus:border-purple-400"
                  />
                </div>
              </div>

              <Button
                onClick={generateComments}
                disabled={commentLoading}
                className="w-full btn-gradient text-white shadow-brand"
              >
                {commentLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating Comments...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Generate Comments
                  </>
                )}
              </Button>

              {showComments && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Generated Comments</h3>
                  <div className="max-h-60 overflow-y-auto">
                    {generatedComments.map((comment, index) => (
                      <div key={index} className="p-4 bg-white rounded-lg border border-gray-200">
                        {comment}
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={postComments}
                    disabled={commentLoading}
                    className="w-full btn-gradient text-white shadow-brand"
                  >
                    {commentLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Posting Comments...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Post Comments
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card className="card-gradient shadow-brand">
            <CardHeader>
              <CardTitle className="text-brand-gradient">Analytics</CardTitle>
              <CardDescription>View detailed analytics for your Facebook campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Placeholder for analytics content */}
              <p className="text-gray-600">Analytics will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
