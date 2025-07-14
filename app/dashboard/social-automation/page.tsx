"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  MessageCircle,
  Bot,
  Users,
  RefreshCw,
  CheckCircle,
  XCircle,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  Zap,
  Star,
  TrendingUp,
  Activity,
  Bell,
  Clock,
  Link,
  Hash,
  Sparkles,
  Target,
  Send,
  Eye,
  ThumbsUp,
  MessageSquare,
  Heart,
  Lightbulb,
  Wand2,
} from "lucide-react"
import { toast } from "sonner"

interface CommentActivity {
  _id: string
  platform: string
  email: string
  postUrl: string
  comment: string
  success: boolean
  error?: string
  createdAt: string
}

interface Notification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  time: string
  createdAt: string
}

export default function SocialAutomationPage() {
  const [postUrl, setPostUrl] = useState("")
  const [postContent, setPostContent] = useState("")
  const [commentStyle, setCommentStyle] = useState("engaging")
  const [accountCount, setAccountCount] = useState(3)
  const [selectedPlatforms, setSelectedPlatforms] = useState(["instagram", "facebook", "twitter"])
  const [activities, setActivities] = useState<CommentActivity[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [commenting, setCommenting] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("comment")
  const [stats, setStats] = useState({
    total: 0,
    successful: 0,
    failed: 0,
    platforms: {
      instagram: 0,
      facebook: 0,
      twitter: 0,
      youtube: 0,
    },
  })

  // Platform-specific examples
  const platformExamples = {
    instagram: {
      url: "https://www.instagram.com/p/ABC123/",
      content:
        "Just finished my morning workout! 💪 Feeling energized and ready to tackle the day. What's your favorite way to start the morning? #MorningMotivation #Fitness",
    },
    facebook: {
      url: "https://www.facebook.com/user/posts/123456789",
      content:
        "Excited to share that our team just launched a new project! It's been months of hard work, but seeing it come together is incredibly rewarding. Thank you to everyone who supported us along the way.",
    },
    twitter: {
      url: "https://twitter.com/user/status/123456789",
      content:
        "Just discovered this amazing coffee shop in downtown! ☕ The atmosphere is perfect for getting work done. Sometimes the best offices are the ones you stumble upon by accident. #CoffeeShop #RemoteWork",
    },
    youtube: {
      url: "https://www.youtube.com/watch?v=ABC123",
      content:
        "In this video, I'll show you how to create stunning digital art using free software. We'll cover basic techniques, color theory, and composition tips that will help you create professional-looking artwork even as a beginner.",
    },
  }

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
      } catch (error) {
        console.error("Error parsing user data:", error)
      }
    }

    fetchActivities()
    fetchNotifications()

    // Set up polling for real-time updates during commenting
    const interval = setInterval(() => {
      if (commenting) {
        fetchActivities()
        fetchNotifications()
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [commenting])

  const fetchActivities = async () => {
    setLoading(true)
    try {
      const userId = user?._id || "demo_user"
      const response = await fetch(`/api/social-automation/comment?userId=${userId}&limit=100`)
      const data = await response.json()

      if (data.success) {
        setActivities(data.activities)
        setStats({
          total: data.summary.total,
          successful: data.summary.successful,
          failed: data.summary.failed,
          platforms: data.summary.platforms,
        })
      }
    } catch (error) {
      console.error("Error fetching activities:", error)
      toast.error("Failed to fetch comment activities")
    } finally {
      setLoading(false)
    }
  }

  const fetchNotifications = async () => {
    try {
      const userId = user?._id || "demo_user"
      const response = await fetch(`/api/notifications?userId=${userId}&limit=10`)
      const data = await response.json()

      if (data.success) {
        setNotifications(data.notifications)
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
    }
  }

  // Add sentiment state
  const [sentiment, setSentiment] = useState("positive")

  const startCommenting = async () => {
    if (!postUrl.trim()) {
      toast.error("Please enter a post URL")
      return
    }

    if (selectedPlatforms.length === 0) {
      toast.error("Please select at least one platform")
      return
    }

    if (accountCount < 1 || accountCount > 10) {
      toast.error("Account count must be between 1 and 10")
      return
    }

    if (!user) {
      toast.error("Please login first")
      return
    }

    setCommenting(true)
    try {
      const response = await fetch("/api/social-automation/comment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user._id || "demo_user",
          postUrl: postUrl.trim(),
          postContent: postContent.trim(),
          commentStyle,
          sentiment, // Add this line
          accountCount,
          platforms: selectedPlatforms,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        fetchActivities()
        fetchNotifications()

        // Clear form
        setPostUrl("")
        setPostContent("")
      } else {
        toast.error(data.message || "Failed to start commenting")
      }
    } catch (error) {
      console.error("Error starting commenting:", error)
      toast.error("Failed to start commenting")
    } finally {
      setCommenting(false)
    }
  }

  const handlePlatformChange = (platform: string, checked: boolean) => {
    if (checked) {
      setSelectedPlatforms([...selectedPlatforms, platform])
    } else {
      setSelectedPlatforms(selectedPlatforms.filter((p) => p !== platform))
    }
  }

  const loadExample = (platform: string) => {
    const example = platformExamples[platform as keyof typeof platformExamples]
    if (example) {
      setPostUrl(example.url)
      setPostContent(example.content)
      setSelectedPlatforms([platform])
      toast.success(`Loaded ${platform} example`)
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "instagram":
        return <Instagram className="h-4 w-4 text-pink-500" />
      case "facebook":
        return <Facebook className="h-4 w-4 text-blue-500" />
      case "twitter":
        return <Twitter className="h-4 w-4 text-cyan-500" />
      case "youtube":
        return <Youtube className="h-4 w-4 text-red-500" />
      default:
        return <MessageCircle className="h-4 w-4" />
    }
  }

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "instagram":
        return "from-pink-500 to-purple-500"
      case "facebook":
        return "from-blue-500 to-blue-600"
      case "twitter":
        return "from-cyan-500 to-blue-500"
      case "youtube":
        return "from-red-500 to-red-600"
      default:
        return "from-gray-500 to-gray-600"
    }
  }

  const successRate = stats.total > 0 ? Math.round((stats.successful / stats.total) * 100) : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-100 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=60 height=60 viewBox=0 0 60 60 xmlns=http://www.w3.org/2000/svg%3E%3Cg fill=none fillRule=evenodd%3E%3Cg fill=%23a855f7 fillOpacity=0.05%3E%3Ccircle cx=30 cy=30 r=2/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-pink-400/20 to-orange-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <div className="relative z-10 mx-auto max-w-7xl space-y-8 p-6">
        {/* Header Section */}
        <div className="text-center py-12">
          <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm border border-purple-200 rounded-full px-6 py-3 mb-6">
            <Bot className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-700">AI Social Media Automation</span>
            <Zap className="h-5 w-5 text-yellow-500" />
          </div>

          <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent mb-6">
            Social Media Comment Bot
          </h1>

          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Automate intelligent comments across Instagram, Facebook, Twitter, and YouTube using your existing accounts
            with AI-powered content generation.
          </p>

          <div className="flex items-center justify-center gap-8 mt-8">
            <div className="flex items-center gap-2 text-slate-600">
              <Bot className="h-5 w-5 text-purple-500" />
              <span className="font-medium">AI-Generated Comments</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Users className="h-5 w-5 text-pink-500" />
              <span className="font-medium">Multi-Account Support</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Star className="h-5 w-5 text-yellow-500" />
              <span className="font-medium">Cross-Platform</span>
            </div>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-white/70 backdrop-blur-sm border border-purple-200/50 hover:bg-white/80 transition-all duration-300 hover:scale-105 hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Comments</CardTitle>
              <MessageCircle className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
              <p className="text-xs text-slate-500 mt-1">Comments posted</p>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border border-purple-200/50 hover:bg-white/80 transition-all duration-300 hover:scale-105 hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{successRate}%</div>
              <Progress value={successRate} className="mt-2 h-2" />
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border border-purple-200/50 hover:bg-white/80 transition-all duration-300 hover:scale-105 hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Successful</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stats.successful}</div>
              <p className="text-xs text-slate-500 mt-1">Comments posted</p>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border border-purple-200/50 hover:bg-white/80 transition-all duration-300 hover:scale-105 hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Failed</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stats.failed}</div>
              <p className="text-xs text-slate-500 mt-1">Comments failed</p>
            </CardContent>
          </Card>
        </div>

        {/* Platform Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-white/70 backdrop-blur-sm border border-pink-200/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Instagram</CardTitle>
              <Instagram className="h-4 w-4 text-pink-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stats.platforms.instagram}</div>
              <p className="text-xs text-slate-500 mt-1">Comments posted</p>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border border-blue-200/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Facebook</CardTitle>
              <Facebook className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stats.platforms.facebook}</div>
              <p className="text-xs text-slate-500 mt-1">Comments posted</p>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border border-cyan-200/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Twitter</CardTitle>
              <Twitter className="h-4 w-4 text-cyan-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stats.platforms.twitter}</div>
              <p className="text-xs text-slate-500 mt-1">Replies posted</p>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border border-red-200/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">YouTube</CardTitle>
              <Youtube className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stats.platforms.youtube}</div>
              <p className="text-xs text-slate-500 mt-1">Comments posted</p>
            </CardContent>
          </Card>
        </div>

        {/* Notifications Panel */}
        {notifications.length > 0 && (
          <Card className="bg-white/80 backdrop-blur-sm border border-purple-200/50 shadow-xl">
            <CardHeader>
              <CardTitle className="text-purple-600 flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-40 overflow-y-auto">
                {notifications.slice(0, 5).map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border ${
                      notification.type === "success"
                        ? "bg-green-50 border-green-200 text-green-800"
                        : notification.type === "error"
                          ? "bg-red-50 border-red-200 text-red-800"
                          : notification.type === "warning"
                            ? "bg-yellow-50 border-yellow-200 text-yellow-800"
                            : "bg-blue-50 border-blue-200 text-blue-800"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{notification.title}</h4>
                        <p className="text-sm mt-1">{notification.message}</p>
                      </div>
                      <span className="text-xs opacity-70">{notification.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Card className="bg-white/80 backdrop-blur-sm border border-purple-200/50 shadow-xl">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <CardHeader className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10 rounded-t-lg border-b border-purple-200/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                    <Wand2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-slate-800">AI Social Media Automation</CardTitle>
                    <CardDescription className="text-slate-600 text-base mt-1">
                      Generate and post intelligent comments across all major social platforms
                    </CardDescription>
                  </div>
                </div>
              </div>

              <TabsList className="grid w-full grid-cols-2 bg-white/50 border border-purple-200">
                <TabsTrigger
                  value="comment"
                  className="data-[state=active]:bg-white data-[state=active]:text-purple-700"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Comment Automation
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="data-[state=active]:bg-white data-[state=active]:text-purple-700"
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Comment History
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="p-8">
              <TabsContent value="comment" className="space-y-8">
                {/* Platform Examples Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(platformExamples).map(([platform, example]) => (
                    <Card
                      key={platform}
                      className="bg-white/50 border border-purple-200/50 hover:bg-white/70 transition-all duration-300 hover:scale-105 cursor-pointer"
                      onClick={() => loadExample(platform)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                          {getPlatformIcon(platform)}
                          <CardTitle className="text-sm font-semibold capitalize">{platform}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-xs text-slate-600 line-clamp-3">{example.content}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-3 text-xs border-purple-200 text-purple-700 hover:bg-purple-50 bg-transparent"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Load Example
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column - Post Details */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-base flex items-center gap-2">
                        <Link className="h-4 w-4 text-purple-500" />
                        Post URL *
                      </Label>
                      <Input
                        type="url"
                        value={postUrl}
                        onChange={(e) => setPostUrl(e.target.value)}
                        placeholder="https://instagram.com/p/... or https://facebook.com/... or https://twitter.com/... or https://youtube.com/watch?v=..."
                        className="h-12 bg-white border-purple-300 hover:border-purple-400 focus:border-purple-500 transition-colors"
                      />
                      <p className="text-xs text-slate-500">
                        Enter the URL of the post you want to comment on (Instagram, Facebook, Twitter, or YouTube)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-base flex items-center gap-2">
                        <Hash className="h-4 w-4 text-purple-500" />
                        Post Content (Optional)
                      </Label>
                      <Textarea
                        value={postContent}
                        onChange={(e) => setPostContent(e.target.value)}
                        placeholder="Paste the post content here to help AI generate more relevant comments..."
                        className="min-h-[120px] bg-white border-purple-300 hover:border-purple-400 focus:border-purple-500 transition-colors resize-none"
                      />
                      <p className="text-xs text-slate-500">
                        Optional: Helps AI generate more contextual and relevant comments
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-base flex items-center gap-2">
                        <Bot className="h-4 w-4 text-purple-500" />
                        Comment Style
                      </Label>
                      <Select value={commentStyle} onValueChange={setCommentStyle}>
                        <SelectTrigger className="h-12 bg-white border-purple-300 hover:border-purple-400 focus:border-purple-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="engaging">
                            <div className="flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-purple-500" />
                              Engaging & Friendly
                            </div>
                          </SelectItem>
                          <SelectItem value="supportive">
                            <div className="flex items-center gap-2">
                              <Heart className="h-4 w-4 text-pink-500" />
                              Supportive & Encouraging
                            </div>
                          </SelectItem>
                          <SelectItem value="question">
                            <div className="flex items-center gap-2">
                              <Lightbulb className="h-4 w-4 text-yellow-500" />
                              Thoughtful Questions
                            </div>
                          </SelectItem>
                          <SelectItem value="compliment">
                            <div className="flex items-center gap-2">
                              <ThumbsUp className="h-4 w-4 text-green-500" />
                              Genuine Compliments
                            </div>
                          </SelectItem>
                          <SelectItem value="casual">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="h-4 w-4 text-blue-500" />
                              Casual & Natural
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-slate-500">Choose the tone and style for AI-generated comments</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-base flex items-center gap-2">
                        <Target className="h-4 w-4 text-purple-500" />
                        Comment Sentiment
                      </Label>
                      <div className="flex gap-3">
                        <Button
                          type="button"
                          variant={sentiment === "positive" ? "default" : "outline"}
                          onClick={() => setSentiment("positive")}
                          className={`flex-1 h-12 ${
                            sentiment === "positive"
                              ? "bg-green-500 hover:bg-green-600 text-white"
                              : "border-green-300 text-green-700 hover:bg-green-50"
                          }`}
                        >
                          <ThumbsUp className="h-4 w-4 mr-2" />
                          Positive
                        </Button>
                        <Button
                          type="button"
                          variant={sentiment === "negative" ? "default" : "outline"}
                          onClick={() => setSentiment("negative")}
                          className={`flex-1 h-12 ${
                            sentiment === "negative"
                              ? "bg-orange-500 hover:bg-orange-600 text-white"
                              : "border-orange-300 text-orange-700 hover:bg-orange-50"
                          }`}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Constructive
                        </Button>
                      </div>
                      <p className="text-xs text-slate-500">
                        Choose whether to generate positive/supportive comments or constructive/alternative perspective
                        comments
                      </p>
                    </div>
                  </div>

                  {/* Right Column - Settings */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-base flex items-center gap-2">
                        <Users className="h-4 w-4 text-purple-500" />
                        Number of Accounts
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={accountCount}
                        onChange={(e) => setAccountCount(Number.parseInt(e.target.value) || 1)}
                        className="h-12 bg-white border-purple-300 hover:border-purple-400 focus:border-purple-500 transition-colors text-center text-lg font-semibold"
                      />
                      <p className="text-xs text-slate-500">How many accounts to use for commenting (1-10)</p>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-slate-700 font-semibold text-base">Select Platforms</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center space-x-3 p-3 rounded-lg border border-pink-200 bg-pink-50/50">
                          <Checkbox
                            id="instagram"
                            checked={selectedPlatforms.includes("instagram")}
                            onCheckedChange={(checked) => handlePlatformChange("instagram", checked as boolean)}
                          />
                          <Label htmlFor="instagram" className="flex items-center gap-2 cursor-pointer">
                            <Instagram className="h-4 w-4 text-pink-500" />
                            Instagram
                          </Label>
                        </div>
                        <div className="flex items-center space-x-3 p-3 rounded-lg border border-blue-200 bg-blue-50/50">
                          <Checkbox
                            id="facebook"
                            checked={selectedPlatforms.includes("facebook")}
                            onCheckedChange={(checked) => handlePlatformChange("facebook", checked as boolean)}
                          />
                          <Label htmlFor="facebook" className="flex items-center gap-2 cursor-pointer">
                            <Facebook className="h-4 w-4 text-blue-500" />
                            Facebook
                          </Label>
                        </div>
                        <div className="flex items-center space-x-3 p-3 rounded-lg border border-cyan-200 bg-cyan-50/50">
                          <Checkbox
                            id="twitter"
                            checked={selectedPlatforms.includes("twitter")}
                            onCheckedChange={(checked) => handlePlatformChange("twitter", checked as boolean)}
                          />
                          <Label htmlFor="twitter" className="flex items-center gap-2 cursor-pointer">
                            <Twitter className="h-4 w-4 text-cyan-500" />
                            Twitter
                          </Label>
                        </div>
                        <div className="flex items-center space-x-3 p-3 rounded-lg border border-red-200 bg-red-50/50">
                          <Checkbox
                            id="youtube"
                            checked={selectedPlatforms.includes("youtube")}
                            onCheckedChange={(checked) => handlePlatformChange("youtube", checked as boolean)}
                          />
                          <Label htmlFor="youtube" className="flex items-center gap-2 cursor-pointer">
                            <Youtube className="h-4 w-4 text-red-500" />
                            YouTube
                          </Label>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500">Select which platforms to comment on</p>
                    </div>

                    <Button
                      onClick={startCommenting}
                      disabled={commenting || !postUrl.trim() || selectedPlatforms.length === 0}
                      className="w-full h-14 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 hover:from-purple-700 hover:via-pink-700 hover:to-orange-700 text-white border-0 shadow-lg font-semibold text-base transition-all duration-300 hover:scale-105 hover:shadow-xl"
                    >
                      {commenting ? (
                        <>
                          <RefreshCw className="mr-3 h-5 w-5 animate-spin" />
                          Commenting in Progress...
                        </>
                      ) : (
                        <>
                          <Send className="mr-3 h-5 w-5" />
                          Start AI Commenting
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Features List */}
                <div className="mt-8 pt-8 border-t border-purple-200">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Bot className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-700">AI-Powered Comments</div>
                        <div className="text-sm text-slate-500">Contextual and engaging responses</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-pink-100 rounded-lg">
                        <Users className="h-5 w-5 text-pink-600" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-700">Multi-Account Support</div>
                        <div className="text-sm text-slate-500">Use multiple accounts simultaneously</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Activity className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-700">Cross-Platform</div>
                        <div className="text-sm text-slate-500">Instagram, Facebook, Twitter, YouTube</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Target className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-700">Smart Targeting</div>
                        <div className="text-sm text-slate-500">Relevant and natural comments</div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="history" className="space-y-6">
                {/* Comment History */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg">
                      <MessageCircle className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-800">Comment History ({stats.total})</h3>
                      <p className="text-slate-600 text-base mt-1">
                        View your automated commenting activity across all platforms
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={fetchActivities}
                    disabled={loading}
                    variant="outline"
                    className="border-purple-200 text-purple-700 hover:bg-purple-50 bg-transparent"
                  >
                    {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  </Button>
                </div>

                <div className="rounded-lg border border-purple-200 bg-white overflow-hidden shadow-sm">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-purple-50 border-purple-200">
                        <TableHead className="text-slate-700 font-semibold">Platform</TableHead>
                        <TableHead className="text-slate-700 font-semibold">Account</TableHead>
                        <TableHead className="text-slate-700 font-semibold">Post URL</TableHead>
                        <TableHead className="text-slate-700 font-semibold">Comment</TableHead>
                        <TableHead className="text-slate-700 font-semibold">Status</TableHead>
                        <TableHead className="text-slate-700 font-semibold">Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-slate-500 py-16">
                            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-500" />
                            <p className="text-lg font-medium">Loading comment history...</p>
                          </TableCell>
                        </TableRow>
                      ) : activities.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-slate-500 py-16">
                            <div className="flex flex-col items-center">
                              <div className="p-4 bg-purple-100 rounded-full mb-4">
                                <MessageCircle className="h-12 w-12 text-purple-400" />
                              </div>
                              <p className="text-lg font-medium text-slate-600">No comment history found</p>
                              <p className="text-sm text-slate-400 mt-1">
                                Start your first automated commenting session
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        activities.map((activity) => (
                          <TableRow
                            key={activity._id}
                            className="border-purple-200 hover:bg-purple-50 transition-colors"
                          >
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getPlatformIcon(activity.platform)}
                                <span className="font-medium capitalize">{activity.platform}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-slate-700 font-mono text-sm">{activity.email}</TableCell>
                            <TableCell>
                              <a
                                href={activity.postUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-purple-600 hover:text-purple-800 underline text-sm max-w-[200px] truncate block"
                              >
                                {activity.postUrl}
                              </a>
                            </TableCell>
                            <TableCell className="max-w-[300px]">
                              {activity.success ? (
                                <p className="text-slate-700 text-sm truncate" title={activity.comment}>
                                  {activity.comment}
                                </p>
                              ) : (
                                <span className="text-slate-400 text-sm">No comment</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`${
                                  activity.success
                                    ? "bg-green-50 text-green-700 border-green-200"
                                    : "bg-red-50 text-red-700 border-red-200"
                                } font-medium`}
                              >
                                {activity.success ? (
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                ) : (
                                  <XCircle className="h-3 w-3 mr-1" />
                                )}
                                {activity.success ? "Success" : "Failed"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-slate-500 text-sm">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(activity.createdAt).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  )
}
