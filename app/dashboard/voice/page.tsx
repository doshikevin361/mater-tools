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
import { VoiceRecorder } from "@/components/voice-recorder"
import { Phone, MessageSquare, Users, Clock, Volume2, Mic, PhoneCall } from "lucide-react"
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
  campaignType: string
  message?: string
  audioUrl?: string
  status: string
  sent: number
  failed: number
  recipientCount: number
  cost: number
  createdAt: string
}

export default function VoicePage() {
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([])
  const [message, setMessage] = useState("")
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [campaignName, setCampaignName] = useState("")
  const [campaignType, setCampaignType] = useState<"tts" | "audio">("tts")
  const [voiceOptions, setVoiceOptions] = useState({
    voice: "alice" as "alice" | "man" | "woman",
    language: "en-US",
    record: false,
    timeout: 30,
  })
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
        headers: {
          "user-id": userId,
        },
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

      const response = await fetch(`/api/campaigns?userId=${userId}&type=Voice`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log("Voice campaigns data:", data)
        const voiceCampaigns = data.campaigns || []
        setCampaigns(voiceCampaigns)
      } else {
        console.error("Failed to load campaigns:", response.status)
        toast.error("Failed to load campaigns")
      }
    } catch (error) {
      console.error("Failed to load campaigns:", error)
      toast.error("Failed to load campaigns")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAudioReady = (blob: Blob, url: string) => {
    console.log("Audio ready:", { blob, url })
    setAudioBlob(blob)
    setAudioUrl(url)

    // If it's a server URL (not blob), set campaign type to audio
    if (!url.startsWith("blob:")) {
      setCampaignType("audio")
      toast.success("Audio uploaded successfully! Ready for voice campaign.")
    }
  }

  const calculateCost = () => {
    return selectedContacts.length * 1.5
  }

  const canSendCampaign = () => {
    const hasContacts = selectedContacts.length > 0
    const hasContent = campaignType === "tts" ? message.trim() !== "" : audioUrl !== null && audioUrl !== ""
    const hasName = campaignName.trim() !== ""
    const hasSufficientBalance = userBalance >= calculateCost()

    return hasContacts && hasContent && hasName && hasSufficientBalance && !isSending
  }

  const sendVoiceCampaign = async () => {
    if (!canSendCampaign()) {
      if (audioUrl && audioUrl.startsWith("blob:")) {
        toast.error("Please wait for the audio file to upload to the server first.")
        return
      }
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
        message: campaignType === "tts" ? message : undefined,
        audioUrl: campaignType === "audio" ? audioUrl : undefined,
        campaignName,
        campaignType,
        userId,
        voiceOptions,
      }

      console.log("Sending voice campaign:", payload)

      const response = await fetch("/api/voice/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(result.message)

        // Reset form
        setSelectedContacts([])
        setMessage("")
        setAudioUrl(null)
        setAudioBlob(null)
        setCampaignName("")
        setCampaignType("tts")

        // Reload campaigns and user balance
        loadCampaigns()
        loadUserData()
      } else {
        toast.error(result.message || "Failed to send voice campaign")
      }
    } catch (error) {
      console.error("Voice campaign error:", error)
      toast.error("Failed to send voice campaign")
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Voice Campaigns
            </h1>
            <p className="text-gray-600 mt-1">Send voice messages and audio campaigns to your contacts</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => (window.location.href = "/dashboard/calling")}
              variant="outline"
              className="border-purple-200 text-purple-600 hover:bg-purple-50"
            >
              <PhoneCall className="h-4 w-4 mr-2" />
              Live Calling
            </Button>
            <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1">
              Balance: ₹{userBalance.toFixed(2)}
            </Badge>
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1">
              Cost: ₹1.50 per call
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="create" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-white border border-purple-200">
            <TabsTrigger
              value="create"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white"
            >
              <Phone className="h-4 w-4 mr-2" />
              Create Campaign
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white"
            >
              <Clock className="h-4 w-4 mr-2" />
              Campaign History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Campaign Setup */}
              <Card className="border border-purple-200 shadow-md overflow-hidden bg-white">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
                  <CardTitle className="flex items-center space-x-2">
                    <Volume2 className="h-5 w-5 text-purple-600" />
                    <span>Campaign Setup</span>
                  </CardTitle>
                  <CardDescription>Configure your voice campaign settings</CardDescription>
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
                      className="border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                    />
                  </div>

                  {/* Campaign Type */}
                  <div className="space-y-2">
                    <Label>Campaign Type</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={campaignType === "tts" ? "default" : "outline"}
                        onClick={() => setCampaignType("tts")}
                        className={
                          campaignType === "tts"
                            ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                            : "border-purple-200 text-purple-600 hover:bg-purple-50"
                        }
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Text-to-Speech
                      </Button>
                      <Button
                        variant={campaignType === "audio" ? "default" : "outline"}
                        onClick={() => setCampaignType("audio")}
                        className={
                          campaignType === "audio"
                            ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                            : "border-purple-200 text-purple-600 hover:bg-purple-50"
                        }
                      >
                        <Mic className="h-4 w-4 mr-2" />
                        Audio File
                      </Button>
                    </div>
                  </div>

                  {/* Message Input for TTS */}
                  {campaignType === "tts" && (
                    <div className="space-y-2">
                      <Label htmlFor="message">Voice Message</Label>
                      <Textarea
                        id="message"
                        placeholder="Enter your voice message (will be converted to speech)"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={4}
                        className="border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                      />
                      <p className="text-xs text-gray-500">
                        This message will be converted to speech and played during the call.
                      </p>
                    </div>
                  )}

                  {/* Voice Options for TTS */}
                  {campaignType === "tts" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Voice</Label>
                        <Select
                          value={voiceOptions.voice}
                          onValueChange={(value: "alice" | "man" | "woman") =>
                            setVoiceOptions({ ...voiceOptions, voice: value })
                          }
                        >
                          <SelectTrigger className="border-purple-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="alice">Alice (Female)</SelectItem>
                            <SelectItem value="woman">Woman</SelectItem>
                            <SelectItem value="man">Man</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Language</Label>
                        <Select
                          value={voiceOptions.language}
                          onValueChange={(value) => setVoiceOptions({ ...voiceOptions, language: value })}
                        >
                          <SelectTrigger className="border-purple-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en-US">English (US)</SelectItem>
                            <SelectItem value="en-GB">English (UK)</SelectItem>
                            <SelectItem value="en-AU">English (AU)</SelectItem>
                            <SelectItem value="en-IN">English (India)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {/* Advanced Options */}
                  <div className="space-y-2">
                    <Label>Advanced Options</Label>
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={voiceOptions.record}
                          onChange={(e) => setVoiceOptions({ ...voiceOptions, record: e.target.checked })}
                          className="rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm">Record calls</span>
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Audio Recording/Upload */}
              {campaignType === "audio" && (
                <div className="lg:col-span-1">
                  <Card className="border border-red-200 mb-4 bg-red-50">
                    <CardContent className="p-4">
                      <p className="text-red-700 text-sm">
                        🔍 Debug: VoiceRecorder should appear below this message when campaign type is "audio"
                      </p>
                      <p className="text-xs text-red-600">Campaign Type: {campaignType}</p>
                    </CardContent>
                  </Card>
                  <VoiceRecorder onRecordingComplete={handleAudioReady} maxDuration={300} className="h-fit" />
                </div>
              )}

              {/* Debug - Always show recorder for testing */}
              <div className="lg:col-span-1">
                <Card className="border border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="text-blue-700">Debug: Voice Recorder (Always Visible)</CardTitle>
                    <CardDescription className="text-blue-600">
                      This recorder is always visible for testing. The one above only shows when campaign type is "audio".
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <VoiceRecorder onRecordingComplete={handleAudioReady} maxDuration={300} className="h-fit" />
                  </CardContent>
                </Card>
              </div>

              {/* Contact Selection */}
              <Card className="border border-purple-200 shadow-md overflow-hidden bg-white lg:col-span-2">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    <span>Select Recipients</span>
                  </CardTitle>
                  <CardDescription>Choose contacts to receive your voice campaign</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <ContactSelector
                    selectedContacts={selectedContacts}
                    onContactsChange={setSelectedContacts}
                    filterByPhone={true}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Campaign Summary & Send */}
            <Card className="border border-purple-200 shadow-md overflow-hidden bg-white">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
                <CardTitle>Campaign Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                    <div className="text-2xl font-bold text-purple-600">{selectedContacts.length}</div>
                    <div className="text-sm text-gray-600">Recipients</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                    <div className="text-2xl font-bold text-purple-600">₹{calculateCost().toFixed(2)}</div>
                    <div className="text-sm text-gray-600">Total Cost</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                    <div className="text-2xl font-bold text-purple-600">{campaignType === "tts" ? "TTS" : "Audio"}</div>
                    <div className="text-sm text-gray-600">Campaign Type</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                    <div className="text-2xl font-bold text-purple-600">₹{userBalance.toFixed(2)}</div>
                    <div className="text-sm text-gray-600">Your Balance</div>
                  </div>
                </div>

                <Button
                  onClick={sendVoiceCampaign}
                  disabled={!canSendCampaign()}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSending ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Sending Voice Campaign...
                    </>
                  ) : (
                    <>
                      <Phone className="h-5 w-5 mr-2" />
                      Send Voice Campaign
                    </>
                  )}
                </Button>

                {!canSendCampaign() && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      {selectedContacts.length === 0 && "Please select at least one recipient."}
                      {campaignType === "tts" && message.trim() === "" && "Please enter a voice message."}
                      {campaignType === "audio" && !audioUrl && "Please upload an audio file."}
                      {campaignName.trim() === "" && "Please enter a campaign name."}
                      {userBalance < calculateCost() && "Insufficient balance for this campaign."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card className="border border-purple-200 shadow-md overflow-hidden bg-white">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-purple-600" />
                  <span>Voice Campaign History</span>
                </CardTitle>
                <CardDescription>View your past voice campaigns and their performance</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    <span className="ml-2 text-gray-600">Loading campaigns...</span>
                  </div>
                ) : campaigns.length === 0 ? (
                  <div className="text-center py-8">
                    <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No voice campaigns found</p>
                    <p className="text-sm text-gray-500">Create your first voice campaign to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {campaigns.map((campaign) => (
                      <div
                        key={campaign._id}
                        className="p-4 border border-purple-100 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900">{campaign.name}</h3>
                          <Badge className={`${getStatusColor(campaign.status)} text-white`}>{campaign.status}</Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Type:</span>
                            <div className="font-medium">
                              {campaign.campaignType === "tts" ? "Text-to-Speech" : "Audio File"}
                            </div>
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
