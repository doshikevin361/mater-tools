"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import {
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  Bot,
  MessageCircle,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
} from "lucide-react"

interface CommentStats {
  total: number
  successful: number
  failed: number
  instagram: number
  facebook: number
  twitter: number
  youtube: number
}

interface CommentHistory {
  id: string
  platform: string
  postUrl: string
  comment: string
  status: "success" | "failed" | "pending"
  timestamp: string
  account: string
}

export default function SocialAutomationPage() {
  const [postUrl, setPostUrl] = useState("")
  const [postContent, setPostContent] = useState("")
  const [commentStyle, setCommentStyle] = useState("engaging")
  const [sentiment, setSentiment] = useState("positive")
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["instagram"])
  const [accountCount, setAccountCount] = useState(3)
  const [isCommenting, setIsCommenting] = useState(false)
  const [stats, setStats] = useState<CommentStats>({
    total: 0,
    successful: 0,
    failed: 0,
    instagram: 0,
    facebook: 0,
    twitter: 0,
    youtube: 0,
  })
  const [commentHistory, setCommentHistory] = useState<CommentHistory[]>([])
  const [notifications, setNotifications] = useState<string[]>([])

  // Platform examples
  const platformExamples = {
    instagram: {
      url: "https://www.instagram.com/p/ABC123/",
      content: "Beautiful sunset at the beach today! 🌅 #sunset #beach #nature",
    },
    facebook: {
      url: "https://www.facebook.com/post/123456789",
      content: "Just launched our new product! Excited to share this journey with everyone.",
    },
    twitter: {
      url: "https://twitter.com/user/status/123456789",
      content: "Breaking: New AI technology revolutionizes social media marketing",
    },
    youtube: {
      url: "https://www.youtube.com/watch?v=ABC123",
      content: "How to Build Amazing Web Applications - Complete Tutorial",
    },
  }

  const commentStyles = [
    { value: "engaging", label: "Engaging", icon: "🔥", description: "Conversation starters and interactive" },
    { value: "supportive", label: "Supportive", icon: "❤️", description: "Encouraging and uplifting" },
    { value: "question", label: "Question", icon: "💭", description: "Thoughtful questions to spark discussion" },
    { value: "compliment", label: "Compliment", icon: "👏", description: "Genuine praise and appreciation" },
    { value: "casual", label: "Casual", icon: "😊", description: "Natural, friend-like responses" },
  ]

  const sentimentOptions = [
    {
      value: "positive",
      label: "Positive",
      icon: ThumbsUp,
      color: "bg-green-500 hover:bg-green-600",
      description: "Generate supportive, encouraging, and positive comments",
    },
    {
      value: "negative",
      label: "Negative",
      icon: ThumbsDown,
      color: "bg-red-500 hover:bg-red-600",
      description: "Generate critical, questioning, or constructive criticism comments",
    },
    {
      value: "neutral",
      label: "Neutral",
      icon: MessageSquare,
      color: "bg-gray-500 hover:bg-gray-600",
      description: "Generate balanced, informative, and objective comments",
    },
  ]

  const platforms = [
    { id: "instagram", name: "Instagram", icon: Instagram, color: "text-pink-500" },
    { id: "facebook", name: "Facebook", icon: Facebook, color: "text-blue-500" },
    { id: "twitter", name: "Twitter", icon: Twitter, color: "text-cyan-500" },
    { id: "youtube", name: "YouTube", icon: Youtube, color: "text-red-500" },
  ]

  const loadExample = (platform: keyof typeof platformExamples) => {
    setPostUrl(platformExamples[platform].url)
    setPostContent(platformExamples[platform].content)
    setSelectedPlatforms([platform])
    toast.success(`Loaded ${platform} example`)
  }

  const handlePlatformToggle = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId) ? prev.filter((p) => p !== platformId) : [...prev, platformId],
    )
  }

  const addNotification = (message: string) => {
    setNotifications((prev) => [message, ...prev.slice(0, 9)])
  }

  const startCommenting = async () => {
    if (!postUrl.trim()) {
      toast.error("Please enter a post URL")
      return
    }

    if (selectedPlatforms.length === 0) {
      toast.error("Please select at least one platform")
      return
    }

    setIsCommenting(true)
    addNotification("🚀 Starting AI comment automation...")

    try {
      const response = await fetch("/api/social-automation/comment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postUrl,
          postContent,
          commentStyle,
          sentiment,
          platforms: selectedPlatforms,
          accountCount,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        addNotification(`✅ Successfully started commenting on ${selectedPlatforms.length} platforms`)

        // Simulate real-time updates
        const totalAccounts = selectedPlatforms.length * accountCount
        let completed = 0

        const updateInterval = setInterval(() => {
          completed++
          const platform = selectedPlatforms[Math.floor(Math.random() * selectedPlatforms.length)]
          const success = Math.random() > 0.2 // 80% success rate

          if (success) {
            addNotification(`✅ Comment posted successfully on ${platform}`)
            setStats((prev) => ({
              ...prev,
              successful: prev.successful + 1,
              total: prev.total + 1,
              [platform]: prev[platform as keyof CommentStats] + 1,
            }))
          } else {
            addNotification(`❌ Failed to comment on ${platform}`)
            setStats((prev) => ({
              ...prev,
              failed: prev.failed + 1,
              total: prev.total + 1,
            }))
          }

          // Add to history
          const newHistoryItem: CommentHistory = {
            id: Date.now().toString(),
            platform,
            postUrl,
            comment: data.sampleComment || "AI-generated comment",
            status: success ? "success" : "failed",
            timestamp: new Date().toLocaleString(),
            account: `account_${completed}`,
          }

          setCommentHistory((prev) => [newHistoryItem, ...prev.slice(0, 49)])

          if (completed >= totalAccounts) {
            clearInterval(updateInterval)
            setIsCommenting(false)
            addNotification("🎉 Comment automation completed!")
            toast.success("Comment automation completed!")
          }
        }, 2000)
      } else {
        throw new Error(data.error || "Failed to start commenting")
      }
    } catch (error) {
      console.error("Error starting comment automation:", error)
      toast.error("Failed to start comment automation")
      addNotification("❌ Failed to start comment automation")
      setIsCommenting(false)
    }
  }

  const selectedSentiment = sentimentOptions.find((s) => s.value === sentiment)

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Social Media Automation</h1>
          <p className="text-gray-600 mt-2">Automate intelligent comments across all social platforms</p>
        </div>
        <div className="flex items-center space-x-2">
          <Bot className="h-8 w-8 text-purple-500" />
          <Badge variant="secondary" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            AI Powered
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Comments</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <MessageCircle className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Successful</p>
                <p className="text-2xl font-bold text-green-600">{stats.successful}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.total > 0 ? Math.round((stats.successful / stats.total) * 100) : 0}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="automation" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="automation">Comment Automation</TabsTrigger>
          <TabsTrigger value="history">Comment History</TabsTrigger>
        </TabsList>

        <TabsContent value="automation" className="space-y-6">
          {/* Platform Examples */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bot className="h-5 w-5" />
                <span>Quick Examples</span>
              </CardTitle>
              <CardDescription>Load sample content for different platforms to test the automation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(platformExamples).map(([platform, example]) => {
                  const platformInfo = platforms.find((p) => p.id === platform)
                  const Icon = platformInfo?.icon || MessageCircle

                  return (
                    <Card
                      key={platform}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => loadExample(platform as keyof typeof platformExamples)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Icon className={`h-5 w-5 ${platformInfo?.color}`} />
                          <span className="font-medium capitalize">{platform}</span>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">{example.content}</p>
                        <Button size="sm" className="w-full mt-2 bg-transparent" variant="outline">
                          Load Example
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Post Details</CardTitle>
                  <CardDescription>Enter the social media post you want to comment on</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="postUrl">Post URL *</Label>
                    <Input
                      id="postUrl"
                      placeholder="https://www.instagram.com/p/ABC123/ or https://twitter.com/user/status/123"
                      value={postUrl}
                      onChange={(e) => setPostUrl(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="postContent">Post Content (Optional)</Label>
                    <Textarea
                      id="postContent"
                      placeholder="Describe the post content to help AI generate better comments..."
                      value={postContent}
                      onChange={(e) => setPostContent(e.target.value)}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Comment Settings</CardTitle>
                  <CardDescription>Customize how AI generates comments</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Sentiment Selection */}
                  <div>
                    <Label className="text-base font-medium">Comment Sentiment</Label>
                    <p className="text-sm text-gray-600 mb-3">{selectedSentiment?.description}</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {sentimentOptions.map((option) => {
                        const Icon = option.icon
                        return (
                          <Button
                            key={option.value}
                            variant={sentiment === option.value ? "default" : "outline"}
                            className={`h-auto p-4 flex flex-col items-center space-y-2 ${
                              sentiment === option.value ? option.color : ""
                            }`}
                            onClick={() => setSentiment(option.value)}
                          >
                            <Icon className="h-6 w-6" />
                            <span className="font-medium">{option.label}</span>
                          </Button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Comment Style */}
                  <div>
                    <Label htmlFor="commentStyle">Comment Style</Label>
                    <Select value={commentStyle} onValueChange={setCommentStyle}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {commentStyles.map((style) => (
                          <SelectItem key={style.value} value={style.value}>
                            <div className="flex items-center space-x-2">
                              <span>{style.icon}</span>
                              <div>
                                <div className="font-medium">{style.label}</div>
                                <div className="text-sm text-gray-500">{style.description}</div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Platform Selection */}
                  <div>
                    <Label className="text-base font-medium">Select Platforms</Label>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      {platforms.map((platform) => {
                        const Icon = platform.icon
                        return (
                          <div key={platform.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={platform.id}
                              checked={selectedPlatforms.includes(platform.id)}
                              onCheckedChange={() => handlePlatformToggle(platform.id)}
                            />
                            <Label htmlFor={platform.id} className="flex items-center space-x-2 cursor-pointer">
                              <Icon className={`h-4 w-4 ${platform.color}`} />
                              <span>{platform.name}</span>
                            </Label>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Account Count */}
                  <div>
                    <Label htmlFor="accountCount">Accounts per Platform</Label>
                    <Select
                      value={accountCount.toString()}
                      onValueChange={(value) => setAccountCount(Number.parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num} account{num > 1 ? "s" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={startCommenting}
                    disabled={isCommenting}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    size="lg"
                  >
                    {isCommenting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Commenting in Progress...
                      </>
                    ) : (
                      <>
                        <Bot className="h-4 w-4 mr-2" />
                        Start AI Comment Automation
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Live Activity Feed */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5" />
                    <span>Live Activity</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-gray-500 text-sm">No activity yet. Start commenting to see live updates.</p>
                    ) : (
                      notifications.map((notification, index) => (
                        <div key={index} className="text-sm p-2 bg-gray-50 rounded border-l-4 border-purple-500">
                          {notification}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Platform Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {platforms.map((platform) => {
                      const Icon = platform.icon
                      const count = stats[platform.id as keyof CommentStats] || 0
                      return (
                        <div key={platform.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Icon className={`h-4 w-4 ${platform.color}`} />
                            <span className="text-sm">{platform.name}</span>
                          </div>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Comment History</CardTitle>
              <CardDescription>View all automated comments and their status</CardDescription>
            </CardHeader>
            <CardContent>
              {commentHistory.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No comments yet. Start automating to see history.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {commentHistory.map((item) => {
                    const platform = platforms.find((p) => p.id === item.platform)
                    const Icon = platform?.icon || MessageCircle

                    return (
                      <div key={item.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <Icon className={`h-5 w-5 ${platform?.color}`} />
                            <div>
                              <p className="font-medium capitalize">{item.platform}</p>
                              <p className="text-sm text-gray-600">{item.account}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {item.status === "success" ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                            <span className="text-sm text-gray-500">{item.timestamp}</span>
                          </div>
                        </div>
                        <div className="mt-3">
                          <p className="text-sm bg-gray-50 p-2 rounded">{item.comment}</p>
                          <p className="text-xs text-gray-500 mt-1 truncate">{item.postUrl}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
