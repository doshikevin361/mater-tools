"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { ContactSelector } from "@/components/contact-selector"
import { ContactImport } from "@/components/contact-import"
import { RichTextEditor } from "@/components/rich-text-editor"
import { CampaignDetailsModal } from "@/components/campaign-details-modal"
import { Mail, Send, Users, FileText, BarChart3, Palette, Eye } from "lucide-react"
import { toast } from "sonner"

interface Contact {
  _id: string
  name: string
  phone?: string
  email?: string
  userId: string
}

interface Campaign {
  _id: string
  name: string
  type: string
  subject?: string
  content?: string
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
  subject: string
  content: string
  category: string
}

export default function EmailPage() {
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([])
  const [subject, setSubject] = useState("")
  const [content, setContent] = useState("")
  const [campaignName, setCampaignName] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState<string>("custom")
  const [templates, setTemplates] = useState<Template[]>([
    {
      id: "1",
      name: "Welcome Email",
      subject: "Welcome to Our Platform!",
      content:
        "<h2>Welcome aboard!</h2><p>We're thrilled to have you join our community. Get ready for an amazing journey ahead!</p>",
      category: "Welcome",
    },
    {
      id: "2",
      name: "Newsletter",
      subject: "Monthly Newsletter - Latest Updates",
      content: "<h2>This Month's Highlights</h2><p>Here are the latest updates and news from our team...</p>",
      category: "Newsletter",
    },
    {
      id: "3",
      name: "Promotional Email",
      subject: "🎉 Special Offer Just for You!",
      content:
        "<h2>Exclusive Discount Inside!</h2><p>Don't miss out on this limited-time offer. Save up to 50% on selected items!</p>",
      category: "Promotion",
    },
    {
      id: "4",
      name: "Event Invitation",
      subject: "You're Invited to Our Exclusive Event",
      content:
        "<h2>Join Us for an Exclusive Event</h2><p>We're hosting a special event and would love to have you there!</p>",
      category: "Event",
    },
  ])
  const [isSending, setIsSending] = useState(false)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [userBalance, setUserBalance] = useState(0)
  const [previewMode, setPreviewMode] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("")
  const [showCampaignDetails, setShowCampaignDetails] = useState(false)

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

      const response = await fetch(`/api/campaigns?userId=${userId}&type=Email`)

      if (response.ok) {
        const data = await response.json()
        console.log("Email Campaigns data:", data) // Debug log
        setCampaigns(data.campaigns || [])
      } else {
        console.error("Failed to fetch Email campaigns:", response.status)
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
      setSubject(template.subject)
      setContent(template.content)
      setSelectedTemplate(templateId)
    } else {
      setSelectedTemplate("custom")
    }
  }

  const handleContactsImported = (contacts: Contact[]) => {
    setSelectedContacts([...selectedContacts, ...contacts])
    setShowImport(false)
  }

  const handleViewCampaignDetails = (campaignId: string) => {
    setSelectedCampaignId(campaignId)
    setShowCampaignDetails(true)
  }

  const calculateCost = () => {
    return selectedContacts.length * 0.1
  }

  const canSendCampaign = () => {
    return (
      selectedContacts.length > 0 &&
      subject.trim() !== "" &&
      content.trim() !== "" &&
      campaignName.trim() !== "" &&
      userBalance >= calculateCost() &&
      !isSending
    )
  }

  const sendEmailCampaign = async () => {
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
        subject: subject.trim(),
        content: content.trim(),
        campaignName,
        userId,
      }

      const response = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(result.message)
        // Reset form
        setSelectedContacts([])
        setSubject("")
        setContent("")
        setCampaignName("")
        setSelectedTemplate("custom")
        // Reload data
        loadCampaigns()
        loadUserData()
      } else {
        toast.error(result.message || "Failed to send email campaign")
      }
    } catch (error) {
      console.error("Email campaign error:", error)
      toast.error("Failed to send email campaign")
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Email Campaigns
            </h1>
            <p className="text-gray-600 mt-1">Send professional email campaigns with rich text formatting</p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1">
              Balance: ₹{userBalance.toFixed(2)}
            </Badge>
            <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-3 py-1">
              Cost: ₹0.10 per email
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="create" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white border border-blue-200">
            <TabsTrigger
              value="create"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white"
            >
              <Mail className="h-4 w-4 mr-2" />
              Create Campaign
            </TabsTrigger>
            <TabsTrigger
              value="templates"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white"
            >
              <Palette className="h-4 w-4 mr-2" />
              Templates
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Campaign History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Campaign Setup */}
              <Card className="border border-blue-200 shadow-md overflow-hidden bg-white">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                  <CardTitle className="flex items-center space-x-2">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <span>Campaign Setup</span>
                  </CardTitle>
                  <CardDescription>Configure your email campaign settings</CardDescription>
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
                      className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                    />
                  </div>

                  {/* Template Selection */}
                  <div className="space-y-2">
                    <Label>Email Template (Optional)</Label>
                    <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                      <SelectTrigger className="border-blue-200">
                        <SelectValue placeholder="Choose a template or create custom email" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom">Custom Email</SelectItem>
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

                  {/* Subject Line */}
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject Line</Label>
                    <Input
                      id="subject"
                      placeholder="Enter email subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                    />
                  </div>

                  {/* Preview Toggle */}
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewMode(!previewMode)}
                      className="border-blue-200 text-blue-600 hover:bg-blue-50"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {previewMode ? "Edit Mode" : "Preview Mode"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Selection */}
              <Card className="border border-blue-200 shadow-md overflow-hidden bg-white">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      <span>Select Recipients</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowImport(!showImport)}
                      className="border-blue-200 text-blue-600 hover:bg-blue-50"
                    >
                      {showImport ? "Hide Import" : "Import Contacts"}
                    </Button>
                  </CardTitle>
                  <CardDescription>Choose contacts to receive your email campaign</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {showImport && (
                    <ContactImport
                      onContactsImported={handleContactsImported}
                      platform="email"
                      existingContacts={selectedContacts}
                    />
                  )}
                  <ContactSelector
                    selectedContacts={selectedContacts}
                    onContactsChange={setSelectedContacts}
                    filterByEmail={true}
                    platform="email"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Email Content Editor */}
            <Card className="border border-blue-200 shadow-md overflow-hidden bg-white">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span>Email Content</span>
                </CardTitle>
                <CardDescription>Compose your email with rich text formatting</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {previewMode ? (
                  <div className="border border-blue-200 rounded-lg p-4 bg-gray-50 min-h-[300px]">
                    <div className="bg-white p-6 rounded shadow-sm">
                      <div className="border-b pb-4 mb-4">
                        <h3 className="font-semibold text-gray-900">Subject: {subject || "No subject"}</h3>
                      </div>
                      <div
                        className="prose max-w-none"
                        dangerouslySetInnerHTML={{ __html: content || "<p>No content</p>" }}
                      />
                    </div>
                  </div>
                ) : (
                  <RichTextEditor
                    value={content}
                    onChange={setContent}
                    placeholder="Compose your email message with rich formatting..."
                    height="400px"
                  />
                )}
              </CardContent>
            </Card>

            {/* Campaign Summary & Send */}
            <Card className="border border-blue-200 shadow-md overflow-hidden bg-white">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                <CardTitle>Campaign Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                    <div className="text-2xl font-bold text-blue-600">{selectedContacts.length}</div>
                    <div className="text-sm text-gray-600">Recipients</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                    <div className="text-2xl font-bold text-blue-600">₹{calculateCost().toFixed(2)}</div>
                    <div className="text-sm text-gray-600">Total Cost</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                    <div className="text-2xl font-bold text-blue-600">{subject.length}</div>
                    <div className="text-sm text-gray-600">Subject Length</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                    <div className="text-2xl font-bold text-blue-600">₹{userBalance.toFixed(2)}</div>
                    <div className="text-sm text-gray-600">Your Balance</div>
                  </div>
                </div>

                <Button
                  onClick={sendEmailCampaign}
                  disabled={!canSendCampaign()}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSending ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Sending Email Campaign...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-2" />
                      Send Email Campaign
                    </>
                  )}
                </Button>

                {!canSendCampaign() && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      {selectedContacts.length === 0 && "Please select at least one recipient."}
                      {subject.trim() === "" && "Please enter an email subject."}
                      {content.trim() === "" && "Please enter email content."}
                      {campaignName.trim() === "" && "Please enter a campaign name."}
                      {userBalance < calculateCost() && "Insufficient balance for this campaign."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <Card className="border border-blue-200 shadow-md overflow-hidden bg-white">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                <CardTitle className="flex items-center space-x-2">
                  <Palette className="h-5 w-5 text-blue-600" />
                  <span>Email Templates</span>
                </CardTitle>
                <CardDescription>Pre-designed templates to speed up your email creation</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map((template) => (
                    <Card
                      key={template.id}
                      className="border border-blue-100 hover:border-blue-200 transition-all cursor-pointer"
                      onClick={() => handleTemplateSelect(template.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900">{template.name}</h3>
                          <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs">
                            {template.category}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium text-gray-700 mb-2">{template.subject}</p>
                        <div
                          className="text-sm text-gray-600 line-clamp-2"
                          dangerouslySetInnerHTML={{ __html: template.content }}
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card className="border border-blue-200 shadow-md overflow-hidden bg-white">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <span>Email Campaign History</span>
                </CardTitle>
                <CardDescription>View your past email campaigns and their performance</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">Loading campaigns...</span>
                  </div>
                ) : campaigns.length === 0 ? (
                  <div className="text-center py-8">
                    <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No email campaigns found</p>
                    <p className="text-sm text-gray-500">Create your first email campaign to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {campaigns.map((campaign) => (
                      <div
                        key={campaign._id}
                        className="p-4 border border-blue-100 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900">{campaign.name}</h3>
                          <div className="flex items-center space-x-2">
                            <Badge className={`${getStatusColor(campaign.status)} text-white`}>{campaign.status}</Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewCampaignDetails(campaign._id)}
                              className="border-blue-200 text-blue-600 hover:bg-blue-50"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Subject:</span>
                            <div className="font-medium truncate">{campaign.subject || "No subject"}</div>
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

      {/* Campaign Details Modal */}
      <CampaignDetailsModal
        isOpen={showCampaignDetails}
        onClose={() => setShowCampaignDetails(false)}
        campaignId={selectedCampaignId}
        platform="email"
      />
    </div>
  )
}
