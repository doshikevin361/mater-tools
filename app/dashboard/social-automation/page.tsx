"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { toast } from "sonner"
import {
  Bot,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  Play,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Users,
  MessageCircle,
  Sparkles,
  Target,
  Activity,
} from "lucide-react"

interface AutomationResult {
  automationId: string
  generatedComment: string
  statistics: {
    total: number
    successful: number
    failed: number
    successRate: number
  }
  results: Array<{
    account: {
      username: string
      platform: string
    }
    success: boolean
    comment: string
    timestamp: Date
    error?: string
  }>
}

interface ActivityItem {
  id: string
  type: "success" | "error" | "info"
  message: string
  timestamp: Date
  platform?: string
  username?: string
}

export default function SocialAutomationPage() {
  const [activeTab, setActiveTab] = useState("automation")

  // Form state
  const [postUrl, setPostUrl] = useState("")
  const [postContent, setPostContent] = useState("")
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["instagram"])
  const [commentStyle, setCommentStyle] = useState("engaging")
  const [sentiment, setSentiment] = useState("positive")
  const [accountCount, setAccountCount] = useState([3])

  // Automation state
  const [isRunning, setIsRunning] = useState(false)
  const [currentResult, setCurrentResult] = useState<AutomationResult | null>(null)
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([])
  const [automationHistory, setAutomationHistory] = useState<any[]>([])

  // Statistics
  const [stats, setStats] = useState({
    totalComments: 0,
    successRate: 0,
    platformBreakdown: {
      instagram: 0,
      facebook: 0,
      twitter: 0,
      youtube: 0,
    },
  })

  useEffect(() => {
    fetchAutomationHistory()
    calculateStats()
  }, [])

  const fetchAutomationHistory = async () => {
    try {
      const response = await fetch("/api/social-automation/comment")
      const data = await response.json()

      if (data.success) {
        setAutomationHistory(data.automations || [])
      }
    } catch (error) {
      console.error("Failed to fetch automation history:", error)
    }
  }

  const calculateStats = () => {
    // Mock statistics - replace with real data
    setStats({
      totalComments: 1247,
      successRate: 87.3,
      platformBreakdown: {
        instagram: 456,
        facebook: 321,
        twitter: 289,
        youtube: 181,
      },
    })
  }

  const addActivity = (type: "success" | "error" | "info", message: string, platform?: string, username?: string) => {
    const newActivity: ActivityItem = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date(),
      platform,
      username,
    }

    setActivityFeed((prev) => [newActivity, ...prev.slice(0, 49)]) // Keep last 50 items
  }

  const handlePlatformChange = (platform: string, checked: boolean) => {
    if (checked) {
      setSelectedPlatforms((prev) => [...prev, platform])
    } else {
      setSelectedPlatforms((prev) => prev.filter((p) => p !== platform))
    }
  }

  const loadExample = (platform: string) => {
    const examples = {
      instagram: {
        url: "https://www.instagram.com/p/ABC123/",
        content:
          "Beautiful sunset at the beach today! 🌅 Nature never fails to amaze me. #sunset #beach #nature #photography",
      },
      facebook: {
        url: "https://www.facebook.com/user/posts/123456789",
        content:
          "Just finished reading an amazing book about entrepreneurship. The insights about building resilient teams really resonated with me. Highly recommend it to anyone looking to grow their business!",
      },
      twitter: {
        url: "https://twitter.com/user/status/123456789",
        content:
          "Breaking: New AI breakthrough in natural language processing shows 40% improvement in understanding context. This could revolutionize how we interact with technology. #AI #Tech #Innovation",
      },
      youtube: {
        url: "https://www.youtube.com/watch?v=ABC123",
        content:
          "How to Build a Successful Startup in 2024 - Complete Guide. In this comprehensive tutorial, I'll walk you through the essential steps to launch and scale your startup, from idea validation to securing funding.",
      },
    }

    const example = examples[platform as keyof typeof examples]
    if (example) {
      setPostUrl(example.url)
      setPostContent(example.content)
      setSelectedPlatforms([platform])
      toast.success(`Loaded ${platform} example`)
    }
  }

  const startAutomation = async () => {
    if (!postUrl.trim()) {
      toast.error("Please enter a post URL")
      return
    }

    if (selectedPlatforms.length === 0) {
      toast.error("Please select at least one platform")
      return
    }

    setIsRunning(true)
    setCurrentResult(null)
    addActivity("info", "Starting AI comment automation...", undefined, undefined)

    try {
      const response = await fetch("/api/social-automation/comment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postUrl,
          postContent,
          platforms: selectedPlatforms,
          commentStyle,
          sentiment,
          accountCount: accountCount[0],
        }),
      })

      const data = await response.json()

      if (data.success) {
        setCurrentResult(data)
        addActivity(
          "success",
          `Automation completed! ${data.statistics.successful}/${data.statistics.total} comments posted successfully`,
        )

        // Add individual results to activity feed
        data.results.forEach((result: any) => {
          if (result.success) {
            addActivity("success", `Comment posted successfully`, result.account.platform, result.account.username)
          } else {
            addActivity(
              "error",
              `Failed to post comment: ${result.error}`,
              result.account.platform,
              result.account.username,
            )
          }
        })

        toast.success(`Automation completed! ${data.statistics.successful}/${data.statistics.total} comments posted`)
        fetchAutomationHistory()
      } else {
        throw new Error(data.error || "Automation failed")
      }
    } catch (error) {
      console.error("Automation error:", error)
      addActivity("error", `Automation failed: ${error.message}`)
      toast.error(`Automation failed: ${error.message}`)
    } finally {
      setIsRunning(false)
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "instagram":
        return <Instagram className="h-4 w-4" />
      case "facebook":
        return <Facebook className="h-4 w-4" />
      case "twitter":
        return <Twitter className="h-4 w-4" />
      case "youtube":
        return <Youtube className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "instagram":
        return "text-pink-600 bg-pink-100"
      case "facebook":
        return "text-blue-600 bg-blue-100"
      case "twitter":
        return "text-sky-600 bg-sky-100"
      case "youtube":
        return "text-red-600 bg-red-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Activity className="h-4 w-4 text-blue-600" />
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-2">
            <Bot className="h-8 w-8 text-blue-600" />
            <span>AI Social Media Automation</span>
            <Badge variant="secondary" className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              AI
            </Badge>
          </h1>
          <p className="text-muted-foreground">
            Automatically generate and post AI-powered comments across social media platforms
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Success Rate</p>
          <p className="text-2xl font-bold text-green-600">{stats.successRate}%</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Comments</p>
                <p className="text-2xl font-bold">{stats.totalComments.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">{stats.successRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Instagram className="h-5 w-5 text-pink-600" />
              <div>
                <p className="text-sm text-muted-foreground">Instagram</p>
                <p className="text-2xl font-bold">{stats.platformBreakdown.instagram}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Active Accounts</p>
                <p className="text-2xl font-bold">127</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="automation">AI Comment Automation</TabsTrigger>
          <TabsTrigger value="history">Activity History</TabsTrigger>
        </TabsList>

        <TabsContent value="automation" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Automation Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                  <span>AI Comment Generator</span>
                </CardTitle>
                <CardDescription>
                  Generate intelligent, contextual comments using AI and post them across social media platforms
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Platform Examples */}
                <div className="space-y-3">
                  <Label>Quick Examples</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        platform: "instagram",
                        name: "Instagram",
                        icon: Instagram,
                        color: "border-pink-200 hover:bg-pink-50",
                      },
                      {
                        platform: "facebook",
                        name: "Facebook",
                        icon: Facebook,
                        color: "border-blue-200 hover:bg-blue-50",
                      },
                      { platform: "twitter", name: "Twitter", icon: Twitter, color: "border-sky-200 hover:bg-sky-50" },
                      { platform: "youtube", name: "YouTube", icon: Youtube, color: "border-red-200 hover:bg-red-50" },
                    ].map(({ platform, name, icon: Icon, color }) => (
                      <Button
                        key={platform}
                        variant="outline"
                        size="sm"
                        onClick={() => loadExample(platform)}
                        className={`${color} justify-start`}
                        disabled={isRunning}
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        {name}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Post URL */}
                <div className="space-y-2">
                  <Label htmlFor="postUrl">Post URL *</Label>
                  <Input
                    id="postUrl"
                    placeholder="https://www.instagram.com/p/ABC123/"
                    value={postUrl}
                    onChange={(e) => setPostUrl(e.target.value)}
                    disabled={isRunning}
                  />
                  <p className="text-xs text-muted-foreground">
                    Supports Instagram, Facebook, Twitter, and YouTube URLs
                  </p>
                </div>

                {/* Post Content */}
                <div className="space-y-2">
                  <Label htmlFor="postContent">Post Content (Optional)</Label>
                  <Textarea
                    id="postContent"
                    placeholder="Describe the post content for better AI context..."
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    disabled={isRunning}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Adding post content helps AI generate more relevant comments
                  </p>
                </div>

                {/* Sentiment Selection */}
                <div className="space-y-3">
                  <Label>Comment Sentiment</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={sentiment === "positive" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSentiment("positive")}
                      disabled={isRunning}
                      className={
                        sentiment === "positive"
                          ? "bg-green-600 hover:bg-green-700"
                          : "border-green-200 hover:bg-green-50"
                      }
                    >
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      Positive
                    </Button>
                    <Button
                      variant={sentiment === "negative" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSentiment("negative")}
                      disabled={isRunning}
                      className={
                        sentiment === "negative" ? "bg-red-600 hover:bg-red-700" : "border-red-200 hover:bg-red-50"
                      }
                    >
                      <ThumbsDown className="h-4 w-4 mr-2" />
                      Negative
                    </Button>
                    <Button
                      variant={sentiment === "neutral" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSentiment("neutral")}
                      disabled={isRunning}
                      className={
                        sentiment === "neutral" ? "bg-gray-600 hover:bg-gray-700" : "border-gray-200 hover:bg-gray-50"
                      }
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Neutral
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {sentiment === "positive" && "Generate supportive, encouraging, and positive comments"}
                    {sentiment === "negative" && "Generate critical, questioning, or constructive criticism comments"}
                    {sentiment === "neutral" && "Generate balanced, informative, and objective comments"}
                  </p>
                </div>

                {/* Comment Style */}
                <div className="space-y-2">
                  <Label htmlFor="commentStyle">Comment Style</Label>
                  <Select value={commentStyle} onValueChange={setCommentStyle} disabled={isRunning}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="engaging">🔥 Engaging - Conversation starters</SelectItem>
                      <SelectItem value="supportive">❤️ Supportive - Encouraging responses</SelectItem>
                      <SelectItem value="question">💭 Question - Thoughtful questions</SelectItem>
                      <SelectItem value="compliment">👏 Compliment - Genuine praise</SelectItem>
                      <SelectItem value="casual">😊 Casual - Natural, friend-like</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Platform Selection */}
                <div className="space-y-3">
                  <Label>Target Platforms</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: "instagram", name: "Instagram", icon: Instagram, color: "text-pink-600" },
                      { id: "facebook", name: "Facebook", icon: Facebook, color: "text-blue-600" },
                      { id: "twitter", name: "Twitter", icon: Twitter, color: "text-sky-600" },
                      { id: "youtube", name: "YouTube", icon: Youtube, color: "text-red-600" },
                    ].map(({ id, name, icon: Icon, color }) => (
                      <div key={id} className="flex items-center space-x-2">
                        <Checkbox
                          id={id}
                          checked={selectedPlatforms.includes(id)}
                          onCheckedChange={(checked) => handlePlatformChange(id, checked as boolean)}
                          disabled={isRunning}
                        />
                        <Label htmlFor={id} className="flex items-center space-x-2 cursor-pointer">
                          <Icon className={`h-4 w-4 ${color}`} />
                          <span>{name}</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Account Count */}
                <div className="space-y-3">
                  <Label>Number of Accounts: {accountCount[0]}</Label>
                  <Slider
                    value={accountCount}
                    onValueChange={setAccountCount}
                    max={10}
                    min={1}
                    step={1}
                    disabled={isRunning}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">Use 1-10 accounts from your database for commenting</p>
                </div>

                {/* Start Button */}
                <Button
                  onClick={startAutomation}
                  disabled={isRunning || !postUrl.trim() || selectedPlatforms.length === 0}
                  className="w-full"
                  size="lg"
                >
                  {isRunning ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Running Automation...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Start AI Comment Automation
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Results & Activity */}
            <div className="space-y-6">
              {/* Current Results */}
              {currentResult && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Target className="h-5 w-5 text-green-600" />
                      <span>Automation Results</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <Bot className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">AI Generated Comment</span>
                      </div>
                      <p className="text-sm text-blue-700 italic">"{currentResult.generatedComment}"</p>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-green-600">{currentResult.statistics.successful}</p>
                        <p className="text-xs text-muted-foreground">Successful</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-red-600">{currentResult.statistics.failed}</p>
                        <p className="text-xs text-muted-foreground">Failed</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-blue-600">{currentResult.statistics.successRate}%</p>
                        <p className="text-xs text-muted-foreground">Success Rate</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Live Activity Feed */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    <span>Live Activity Feed</span>
                  </CardTitle>
                  <CardDescription>Real-time automation progress and results</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {activityFeed.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No activity yet</p>
                        <p className="text-sm">Start an automation to see live updates</p>
                      </div>
                    ) : (
                      activityFeed.map((activity) => (
                        <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
                          <div className="flex-shrink-0 mt-0.5">{getActivityIcon(activity.type)}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900">{activity.message}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <p className="text-xs text-gray-500">{activity.timestamp.toLocaleTimeString()}</p>
                              {activity.platform && (
                                <Badge variant="outline" className={`text-xs ${getPlatformColor(activity.platform)}`}>
                                  {getPlatformIcon(activity.platform)}
                                  <span className="ml-1">{activity.platform}</span>
                                </Badge>
                              )}
                              {activity.username && <span className="text-xs text-gray-500">@{activity.username}</span>}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Automation History</CardTitle>
              <CardDescription>View your recent AI comment automation sessions</CardDescription>
            </CardHeader>
            <CardContent>
              {automationHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No automation history yet</p>
                  <p className="text-sm">Your automation sessions will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {automationHistory.map((automation) => (
                    <div key={automation._id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Bot className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="font-medium">AI Comment Automation</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(automation.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant={automation.status === "completed" ? "default" : "secondary"}>
                          {automation.status}
                        </Badge>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-600 italic">"{automation.generatedComment}"</p>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-4">
                          <span>Platforms: {automation.platforms?.join(", ")}</span>
                          <span>Style: {automation.commentStyle}</span>
                          <span>Sentiment: {automation.sentiment}</span>
                        </div>
                        {automation.statistics && (
                          <span className="text-green-600 font-medium">
                            {automation.statistics.successful}/{automation.statistics.total} successful
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
