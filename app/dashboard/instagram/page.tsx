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
import { Instagram, Users, Heart, MessageCircle, Eye, TrendingUp, Target, Play, Pause, Camera } from "lucide-react"

interface InstagramCampaign {
  id: string
  name: string
  type: "followers" | "likes" | "comments" | "views" | "story_views"
  targetUrl: string
  targetCount: number
  currentCount: number
  status: "active" | "paused" | "completed" | "failed"
  cost: number
  createdAt: string
  completedAt?: string
}

export default function InstagramPage() {
  const [campaigns, setCampaigns] = useState<InstagramCampaign[]>([])
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)

  // Form states
  const [campaignType, setCampaignType] = useState<string>("followers")
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
      loadCampaigns()
    }
  }, [])

  // Load existing campaigns
  const loadCampaigns = async () => {
    try {
      const userInfo = getUserInfo()
      if (!userInfo?._id) return

      const response = await fetch(`/api/instagram/campaigns?userId=${userInfo._id}`)
      const result = await response.json()

      if (result.success) {
        setCampaigns(result.campaigns)
      }
    } catch (error) {
      console.error("Error loading campaigns:", error)
    }
  }

  // Create new campaign
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?._id) return

    setLoading(true)
    try {
      const response = await fetch("/api/instagram/campaigns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user._id,
          name: campaignName,
          type: campaignType,
          targetUrl,
          targetCount: Number.parseInt(targetCount),
        }),
      })

      const result = await response.json()

      if (result.success) {
        setCampaigns([result.campaign, ...campaigns])
        // Reset form
        setCampaignName("")
        setTargetUrl("")
        setTargetCount("")
        alert("Campaign created successfully!")
      } else {
        alert(result.message || "Failed to create campaign")
      }
    } catch (error) {
      console.error("Error creating campaign:", error)
      alert("Failed to create campaign")
    } finally {
      setLoading(false)
    }
  }

  // Toggle campaign status
  const toggleCampaign = async (campaignId: string, action: "pause" | "resume") => {
    try {
      const response = await fetch(`/api/instagram/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      })

      const result = await response.json()

      if (result.success) {
        loadCampaigns() // Reload campaigns
      }
    } catch (error) {
      console.error("Error toggling campaign:", error)
    }
  }

  // Calculate pricing
  const calculatePrice = (type: string, count: number) => {
    const rates = {
      followers: 0.08, // ₹0.08 per follower
      likes: 0.03, // ₹0.03 per like
      comments: 0.12, // ₹0.12 per comment
      views: 0.01, // ₹0.01 per view
      story_views: 0.02, // ₹0.02 per story view
    }
    return (rates[type as keyof typeof rates] * count).toFixed(2)
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600">
            <Instagram className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Instagram Growth</h1>
            <p className="text-muted-foreground">Grow your Instagram with real followers, likes, and engagement</p>
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
              <CardTitle>Create Instagram Growth Campaign</CardTitle>
              <CardDescription>
                Boost your Instagram profile with real followers, likes, comments, and views
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateCampaign} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="campaignName">Campaign Name</Label>
                    <Input
                      id="campaignName"
                      placeholder="e.g., Brand Awareness Campaign"
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="campaignType">Growth Type</Label>
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetUrl">Instagram Profile/Post URL</Label>
                  <Input
                    id="targetUrl"
                    placeholder="https://instagram.com/your-profile"
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
                      min="1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Estimated Cost</Label>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold text-green-600">
                        ₹{targetCount ? calculatePrice(campaignType, Number.parseInt(targetCount)) : "0.00"}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        (₹
                        {campaignType === "followers"
                          ? "0.08"
                          : campaignType === "likes"
                            ? "0.03"
                            : campaignType === "comments"
                              ? "0.12"
                              : campaignType === "views"
                                ? "0.01"
                                : "0.02"}{" "}
                        per {campaignType === "story_views" ? "story view" : campaignType.slice(0, -1)})
                      </span>
                    </div>
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Creating Campaign..." : "Create Campaign"}
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
              <CardDescription>Manage your Instagram growth campaigns</CardDescription>
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
                            <div className="flex space-x-2">
                              {campaign.status === "active" ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => toggleCampaign(campaign.id, "pause")}
                                >
                                  <Pause className="h-4 w-4" />
                                </Button>
                              ) : campaign.status === "paused" ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => toggleCampaign(campaign.id, "resume")}
                                >
                                  <Play className="h-4 w-4" />
                                </Button>
                              ) : null}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Instagram className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No campaigns yet</h3>
                  <p className="text-muted-foreground mb-4">Create your first Instagram growth campaign</p>
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
                <CardTitle className="text-sm font-medium">Total Followers Gained</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {campaigns
                    .filter((c) => c.type === "followers")
                    .reduce((sum, c) => sum + c.currentCount, 0)
                    .toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">+18% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {campaigns
                    .filter((c) => c.type === "likes")
                    .reduce((sum, c) => sum + c.currentCount, 0)
                    .toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">+25% from last month</p>
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
                    .filter((c) => c.type === "views" || c.type === "story_views")
                    .reduce((sum, c) => sum + c.currentCount, 0)
                    .toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">+32% from last month</p>
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
