"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { ContactSelector } from "@/components/contact-selector"
import { ContactImport } from "@/components/contact-import"
import { MessageCircle, Send, Users, BarChart3, FileText } from "lucide-react"
import { toast } from "sonner"

interface Contact {
  _id: string
  name: string
  phone?: string
  mobile?: string
  email?: string
  userId: string
}

interface Campaign {
  _id: string
  name: string
  type: string
  message?: string
  senderId?: string
  status: string
  sent: number
  failed: number
  recipientCount: number
  cost: number
  createdAt: string
}

interface Template {
  id: string
  name: string
  content: string
  category: string
}

export default function SMSPage() {
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([])
  const [message, setMessage] = useState("")
  const [campaignName, setCampaignName] = useState("")
  const [senderId, setSenderId] = useState("FSTSMS")
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [showImport, setShowImport] = useState(false)
  const [templates, setTemplates] = useState<Template[]>([
    {
      id: "1",
      name: "Welcome Message",
      content: "Welcome to our service! We're excited to have you on board.",
      category: "Welcome",
    },
    {
      id: "2",
      name: "Promotional Offer",
      content: "🎉 Special offer just for you! Get 50% off on your next purchase. Use code: SAVE50",
      category: "Promotion",
    },
    {
      id: "3",
      name: "Appointment Reminder",
      content: "Reminder: You have an appointment scheduled for tomorrow at 2:00 PM. Please confirm your attendance.",
      category: "Reminder",
    },
    {
      id: "4",
      name: "Order Confirmation",
      content:
        "Your order #12345 has been confirmed and will be delivered within 2-3 business days. Thank you for your purchase!",
      category: "Order",
    },
  ])
  const [isSending, setIsSending] = useState(false)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [userBalance, setUserBalance] = useState(0)

  // Load user data and campaigns
  useEffect(() => {
    loadUserData()
    loadCampaigns()
  }, [])

  const loadUserData = async () => {
    try {
      const userId = localStorage.getItem("userId")
      if (!userId) return

      const response = await fetch("/api/user/profile", {
        headers: { "user-id": userId },
      })

      if (response.ok) {
        const data = await response.json()
        setUserBalance(data.user?.balance || 0)
      }
    } catch (error) {
      console.error("Failed to load user data:", error)
    }
  }

  const loadCampaigns = async () => {
    try {
      setIsLoading(true)
      const userId = localStorage.getItem("userId")
      if (!userId) return

      const response = await fetch(`/api/campaigns?userId=${userId}&type=SMS`)

      if (response.ok) {
        const data = await response.json()
        console.log("SMS Campaigns data:", data) // Debug log
        setCampaigns(data.campaigns || [])
      } else {
        console.error("Failed to fetch SMS campaigns:", response.status)
      }
    } catch (error) {
      console.error("Failed to load campaigns:", error)
      toast.error("Failed to load campaigns")
    } finally {
      setIsLoading(false)
    }
  }

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId)
    if (template) {
      setMessage(template.content)
      setSelectedTemplate(templateId)
    } else {
      setSelectedTemplate("")
    }
  }

  const handleContactsImported = (contacts: Contact[]) => {
    setSelectedContacts([...selectedContacts, ...contacts])
    setShowImport(false)
  }

  const calculateCost = () => {
    return selectedContacts.length * 0.25
  }

  const canSendCampaign = () => {
    return (
      selectedContacts.length > 0 &&
      message.trim() !== "" &&
      campaignName.trim() !== "" &&
      userBalance >= calculateCost() &&
      !isSending
    )
  }

  const sendSMSCampaign = async () => {
    if (!canSendCampaign()) {
      toast.error("Please fill in all required fields and ensure sufficient balance.")
      return
    }

    setIsSending(true)
    try {
      const userId = localStorage.getItem("userId")
      if (!userId) {
        toast.error("Please log in to send campaigns")
        return
      }

      const payload = {
        recipients: selectedContacts.map((contact) => contact._id),
        message: message.trim(),
        campaignName,
        senderId,
        userId,
      }

      const response = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(result.message)
        // Reset form
        setSelectedContacts([])
        setMessage("")
        setCampaignName("")
        setSelectedTemplate("")
        // Reload data
        loadCampaigns()
        loadUserData()
      } else {
        toast.error(result.message || "Failed to send SMS campaign")
      }
    } catch (error) {
      console.error("SMS campaign error:", error)
      toast.error("Failed to send SMS campaign")
    } finally {
      setIsSending(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-500"
      case "failed":
        return "bg-red-500"
      case "partially completed":
        return "bg-yellow-500"
      case "processing":
      case "sending":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              SMS Campaigns
            </h1>
            <p className="text-gray-600 mt-1">Send SMS messages to your contacts via Fast2SMS</p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1">
              Balance: ₹{userBalance.toFixed(2)}
            </Badge>
            <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1">
              Cost: ₹0.25 per SMS
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="create" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white border border-orange-200">
            <TabsTrigger
              value="create"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Create Campaign
            </TabsTrigger>
            <TabsTrigger
              value="templates"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white"
            >
              <FileText className="h-4 w-4 mr-2" />
              Templates
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Campaign History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Campaign Setup */}
              <Card className="border border-orange-200 shadow-md overflow-hidden bg-white">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b border-orange-100">
                  <CardTitle className="flex items-center space-x-2">
                    <MessageCircle className="h-5 w-5 text-orange-600" />
                    <span>Campaign Setup</span>
                  </CardTitle>
                  <CardDescription>Configure your SMS campaign settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  {/* Campaign Name */}
                  <div className="space-y-2">
                    <Label htmlFor="campaignName">Campaign Name</Label>
                    <Input
                      id="campaignName"
                      placeholder="Enter campaign name"
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      className="border-orange-200 focus:border-orange-400 focus:ring-orange-400"
                    />
                  </div>

                  {/* Sender ID */}
                  <div className="space-y-2">
                    <Label htmlFor="senderId">Sender ID</Label>
                    <Input
                      id="senderId"
                      placeholder="FSTSMS"
                      value={senderId}
                      onChange={(e) => setSenderId(e.target.value)}
                      maxLength={6}
                      className="border-orange-200 focus:border-orange-400 focus:ring-orange-400"
                    />
                    <p className="text-xs text-gray-500">6 characters max. Use your registered sender ID.</p>
                  </div>

                  {/* Template Selection */}
                  <div className="space-y-2">
                    <Label>Message Template (Optional)</Label>
                    <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                      <SelectTrigger className="border-orange-200">
                        <SelectValue placeholder="Choose a template or write custom message" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom">Custom Message</SelectItem>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            <div className="flex flex-col">
                              <span>{template.name}</span>
                              <span className="text-xs text-gray-500">{template.category}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Message Input */}
                  <div className="space-y-2">
                    <Label htmlFor="message">SMS Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Enter your SMS message here..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                      maxLength={160}
                      className="border-orange-200 focus:border-orange-400 focus:ring-orange-400"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Characters: {message.length}/160</span>
                      <span>SMS Count: {Math.ceil(message.length / 160) || 1}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Selection */}
              <Card className="border border-orange-200 shadow-md overflow-hidden bg-white">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b border-orange-100">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="h-5 w-5 text-orange-600" />
                      <span>Select Recipients</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowImport(!showImport)}
                      className="border-orange-200 text-orange-600 hover:bg-orange-50"
                    >
                      {showImport ? "Hide Import" : "Import Contacts"}
                    </Button>
                  </CardTitle>
                  <CardDescription>Choose contacts to receive your SMS campaign</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {showImport && (
                    <ContactImport
                      onContactsImported={handleContactsImported}
                      platform="sms"
                      existingContacts={selectedContacts}
                    />
                  )}
                  <ContactSelector
                    selectedContacts={selectedContacts}
                    onContactsChange={setSelectedContacts}
                    filterByPhone={true}
                    platform="sms"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Campaign Summary & Send */}
            <Card className="border border-orange-200 shadow-md overflow-hidden bg-white">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b border-orange-100">
                <CardTitle>Campaign Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-100">
                    <div className="text-2xl font-bold text-orange-600">{selectedContacts.length}</div>
                    <div className="text-sm text-gray-600">Recipients</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-100">
                    <div className="text-2xl font-bold text-orange-600">₹{calculateCost().toFixed(2)}</div>
                    <div className="text-sm text-gray-600">Total Cost</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-100">
                    <div className="text-2xl font-bold text-orange-600">{Math.ceil(message.length / 160) || 1}</div>
                    <div className="text-sm text-gray-600">SMS Parts</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-100">
                    <div className="text-2xl font-bold text-orange-600">₹{userBalance.toFixed(2)}</div>
                    <div className="text-sm text-gray-600">Your Balance</div>
                  </div>
                </div>

                <Button
                  onClick={sendSMSCampaign}
                  disabled={!canSendCampaign()}
                  className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSending ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Sending SMS Campaign...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-2" />
                      Send SMS Campaign
                    </>
                  )}
                </Button>

                {!canSendCampaign() && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      {selectedContacts.length === 0 && "Please select at least one recipient."}
                      {message.trim() === "" && "Please enter an SMS message."}
                      {campaignName.trim() === "" && "Please enter a campaign name."}
                      {userBalance < calculateCost() && "Insufficient balance for this campaign."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <Card className="border border-orange-200 shadow-md overflow-hidden bg-white">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b border-orange-100">
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-orange-600" />
                  <span>SMS Templates</span>
                </CardTitle>
                <CardDescription>Pre-built templates to speed up your campaign creation</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map((template) => (
                    <Card
                      key={template.id}
                      className="border border-orange-100 hover:border-orange-200 transition-all cursor-pointer"
                      onClick={() => handleTemplateSelect(template.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900">{template.name}</h3>
                          <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs">
                            {template.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-3">{template.content}</p>
                        <div className="mt-2 text-xs text-gray-500">{template.content.length} characters</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card className="border border-orange-200 shadow-md overflow-hidden bg-white">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b border-orange-100">
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-orange-600" />
                  <span>SMS Campaign History</span>
                </CardTitle>
                <CardDescription>View your past SMS campaigns and their performance</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                    <span className="ml-2 text-gray-600">Loading campaigns...</span>
                  </div>
                ) : campaigns.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No SMS campaigns found</p>
                    <p className="text-sm text-gray-500">Create your first SMS campaign to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {campaigns.map((campaign) => (
                      <div
                        key={campaign._id}
                        className="p-4 border border-orange-100 rounded-lg bg-gradient-to-r from-orange-50 to-red-50"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900">{campaign.name}</h3>
                          <Badge className={`${getStatusColor(campaign.status)} text-white`}>{campaign.status}</Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Sender ID:</span>
                            <div className="font-medium">{campaign.senderId || "FSTSMS"}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Recipients:</span>
                            <div className="font-medium">{campaign.recipientCount}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Sent:</span>
                            <div className="font-medium text-green-600">{campaign.sent}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Failed:</span>
                            <div className="font-medium text-red-600">{campaign.failed}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Cost:</span>
                            <div className="font-medium">₹{campaign.cost.toFixed(2)}</div>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">Created: {formatDate(campaign.createdAt)}</div>
                        {campaign.sent > 0 && (
                          <div className="mt-2">
                            <Progress value={(campaign.sent / campaign.recipientCount) * 100} className="h-2" />
                            <div className="text-xs text-gray-600 mt-1">
                              Success Rate: {((campaign.sent / campaign.recipientCount) * 100).toFixed(1)}%
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
