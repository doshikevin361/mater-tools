"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Phone,
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  RepeatIcon as Record,
  Square,
  Download,
  Clock,
  User,
  FileText,
} from "lucide-react"
import { toast } from "sonner"

interface CallRecord {
  id: string
  phoneNumber: string
  duration: string
  timestamp: string
  status: "completed" | "missed" | "failed"
  recordingUrl?: string
  transcription?: string
  cost: number
}

interface ActiveCall {
  callSid: string
  phoneNumber: string
  status: "dialing" | "ringing" | "connected" | "ended"
  startTime: Date
  duration: number
}

export default function CallingPage() {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isCallActive, setIsCallActive] = useState(false)
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [callHistory, setCallHistory] = useState<CallRecord[]>([])
  const [userBalance, setUserBalance] = useState(0)
  const [callSettings, setCallSettings] = useState({
    autoRecord: true,
    transcription: true,
    voice: "alice" as "alice" | "man" | "woman",
    timeout: 30,
  })

  const callTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [callDuration, setCallDuration] = useState(0)

  useEffect(() => {
    loadUserData()
    loadCallHistory()

    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (isCallActive && activeCall?.status === "connected") {
      callTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1)
      }, 1000)
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current)
      }
    }

    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current)
      }
    }
  }, [isCallActive, activeCall?.status])

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

  const loadCallHistory = async () => {
    try {
      const userId = localStorage.getItem("userId")
      if (!userId) return

      // Mock call history for now - you can implement actual API
      const mockHistory: CallRecord[] = [
        {
          id: "1",
          phoneNumber: "+91 98765 43210",
          duration: "00:02:45",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          status: "completed",
          recordingUrl: "/api/recordings/sample.mp3",
          transcription: "Hello, this is a test call recording...",
          cost: 2.5,
        },
        {
          id: "2",
          phoneNumber: "+91 87654 32109",
          duration: "00:01:20",
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          status: "completed",
          cost: 1.75,
        },
      ]

      setCallHistory(mockHistory)
    } catch (error) {
      console.error("Failed to load call history:", error)
    }
  }

  const formatPhoneNumber = (number: string) => {
    const cleaned = number.replace(/\D/g, "")
    if (cleaned.length === 10) {
      return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`
    }
    return number
  }

  const validatePhoneNumber = (number: string) => {
    const cleaned = number.replace(/\D/g, "")
    return cleaned.length >= 10
  }

  const makeCall = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      toast.error("Please enter a valid phone number")
      return
    }

    if (userBalance < 1.5) {
      toast.error("Insufficient balance to make a call")
      return
    }

    try {
      setIsCallActive(true)
      setCallDuration(0)

      const newCall: ActiveCall = {
        callSid: `call_${Date.now()}`,
        phoneNumber: formatPhoneNumber(phoneNumber),
        status: "dialing",
        startTime: new Date(),
        duration: 0,
      }

      setActiveCall(newCall)
      toast.success("Initiating call...")

      // Simulate call progression
      setTimeout(() => {
        setActiveCall((prev) => (prev ? { ...prev, status: "ringing" } : null))
        toast.info("Ringing...")
      }, 2000)

      setTimeout(() => {
        setActiveCall((prev) => (prev ? { ...prev, status: "connected" } : null))
        toast.success("Call connected!")
        if (callSettings.autoRecord) {
          setIsRecording(true)
        }
      }, 5000)
    } catch (error) {
      console.error("Call initiation failed:", error)
      toast.error("Failed to initiate call")
      setIsCallActive(false)
      setActiveCall(null)
    }
  }

  const endCall = async () => {
    if (!activeCall) return

    try {
      const callDurationFormatted = formatDuration(callDuration)
      const callCost = Math.ceil(callDuration / 60) * 1.5

      // Add to call history
      const newRecord: CallRecord = {
        id: activeCall.callSid,
        phoneNumber: activeCall.phoneNumber,
        duration: callDurationFormatted,
        timestamp: new Date().toISOString(),
        status: "completed",
        recordingUrl: isRecording ? `/api/recordings/${activeCall.callSid}.mp3` : undefined,
        transcription:
          isRecording && callSettings.transcription ? "Call transcription will be available shortly..." : undefined,
        cost: callCost,
      }

      setCallHistory((prev) => [newRecord, ...prev])

      // Reset call state
      setIsCallActive(false)
      setActiveCall(null)
      setCallDuration(0)
      setIsRecording(false)
      setPhoneNumber("")

      toast.success(`Call ended. Duration: ${callDurationFormatted}`)

      // Update balance
      setUserBalance((prev) => prev - callCost)
    } catch (error) {
      console.error("Error ending call:", error)
      toast.error("Error ending call")
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    toast.info(isMuted ? "Microphone unmuted" : "Microphone muted")
  }

  const toggleRecording = () => {
    setIsRecording(!isRecording)
    toast.info(isRecording ? "Recording stopped" : "Recording started")
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500"
      case "missed":
        return "bg-yellow-500"
      case "failed":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const downloadRecording = (recordingUrl: string, phoneNumber: string) => {
    // Simulate download
    toast.success(`Downloading recording for ${phoneNumber}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Voice Calling
            </h1>
            <p className="text-gray-600 mt-1">Make calls, record conversations, and manage your calling history</p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1">
              Balance: ₹{userBalance.toFixed(2)}
            </Badge>
            <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-3 py-1">Rate: ₹1.50/min</Badge>
          </div>
        </div>

        <Tabs defaultValue="dialer" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white border border-blue-200">
            <TabsTrigger
              value="dialer"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white"
            >
              <Phone className="h-4 w-4 mr-2" />
              Dialer
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white"
            >
              <Clock className="h-4 w-4 mr-2" />
              Call History
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white"
            >
              <User className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dialer" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Dialer */}
              <Card className="border border-blue-200 shadow-md overflow-hidden bg-white">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                  <CardTitle className="flex items-center space-x-2">
                    <PhoneCall className="h-5 w-5 text-blue-600" />
                    <span>Make a Call</span>
                  </CardTitle>
                  <CardDescription>Enter a phone number to start a voice call</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      placeholder="+91 98765 43210"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      disabled={isCallActive}
                      className="border-blue-200 focus:border-blue-400 focus:ring-blue-400 text-lg"
                    />
                  </div>

                  {!isCallActive ? (
                    <Button
                      onClick={makeCall}
                      disabled={!phoneNumber || userBalance < 1.5}
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 text-lg font-semibold"
                    >
                      <Phone className="h-5 w-5 mr-2" />
                      Call Now
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                        <div className="text-lg font-semibold text-blue-600">
                          {activeCall?.status === "dialing" && "Dialing..."}
                          {activeCall?.status === "ringing" && "Ringing..."}
                          {activeCall?.status === "connected" && "Connected"}
                        </div>
                        <div className="text-sm text-gray-600">{activeCall?.phoneNumber}</div>
                        {activeCall?.status === "connected" && (
                          <div className="text-2xl font-bold text-blue-600 mt-2">{formatDuration(callDuration)}</div>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          variant="outline"
                          onClick={toggleMute}
                          className={`${isMuted ? "bg-red-50 border-red-200 text-red-600" : "border-blue-200 text-blue-600"}`}
                        >
                          {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                        </Button>

                        <Button
                          variant="outline"
                          onClick={toggleRecording}
                          className={`${isRecording ? "bg-red-50 border-red-200 text-red-600" : "border-blue-200 text-blue-600"}`}
                        >
                          {isRecording ? <Square className="h-4 w-4" /> : <Record className="h-4 w-4" />}
                        </Button>

                        <Button variant="outline" className="border-blue-200 text-blue-600 bg-transparent">
                          <Volume2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <Button
                        onClick={endCall}
                        className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 text-lg font-semibold"
                      >
                        <PhoneOff className="h-5 w-5 mr-2" />
                        End Call
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Call Status */}
              <Card className="border border-blue-200 shadow-md overflow-hidden bg-white">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <span>Call Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {activeCall ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm text-gray-600">Status</Label>
                          <div className="font-semibold capitalize">{activeCall.status}</div>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-600">Duration</Label>
                          <div className="font-semibold">{formatDuration(callDuration)}</div>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-600">Recording</Label>
                          <div className="font-semibold">{isRecording ? "Active" : "Inactive"}</div>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-600">Cost</Label>
                          <div className="font-semibold">₹{(Math.ceil(callDuration / 60) * 1.5).toFixed(2)}</div>
                        </div>
                      </div>

                      {isRecording && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="text-sm text-red-700 font-medium">Recording in progress</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Phone className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No active call</p>
                      <p className="text-sm">Enter a phone number to start calling</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card className="border border-blue-200 shadow-md overflow-hidden bg-white">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <span>Call History</span>
                </CardTitle>
                <CardDescription>View your recent calls and recordings</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {callHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No call history found</p>
                    <p className="text-sm text-gray-500">Your recent calls will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {callHistory.map((call) => (
                      <div
                        key={call.id}
                        className="p-4 border border-blue-100 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Phone className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-semibold">{call.phoneNumber}</div>
                              <div className="text-sm text-gray-600">{new Date(call.timestamp).toLocaleString()}</div>
                            </div>
                          </div>
                          <Badge className={`${getStatusColor(call.status)} text-white`}>{call.status}</Badge>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                          <div>
                            <span className="text-gray-600">Duration:</span>
                            <div className="font-medium">{call.duration}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Cost:</span>
                            <div className="font-medium">₹{call.cost.toFixed(2)}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Recording:</span>
                            <div className="font-medium">{call.recordingUrl ? "Available" : "None"}</div>
                          </div>
                        </div>

                        {call.recordingUrl && (
                          <div className="flex items-center space-x-2 pt-2 border-t border-blue-100">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => downloadRecording(call.recordingUrl!, call.phoneNumber)}
                              className="border-blue-200 text-blue-600 hover:bg-blue-50"
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                            {call.transcription && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-blue-200 text-blue-600 hover:bg-blue-50 bg-transparent"
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                Transcript
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="border border-blue-200 shadow-md overflow-hidden bg-white">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-blue-600" />
                  <span>Call Settings</span>
                </CardTitle>
                <CardDescription>Configure your calling preferences</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Auto Record Calls</Label>
                      <p className="text-sm text-gray-600">Automatically start recording when calls connect</p>
                    </div>
                    <Switch
                      checked={callSettings.autoRecord}
                      onCheckedChange={(checked) => setCallSettings((prev) => ({ ...prev, autoRecord: checked }))}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Call Transcription</Label>
                      <p className="text-sm text-gray-600">Generate text transcripts of recorded calls</p>
                    </div>
                    <Switch
                      checked={callSettings.transcription}
                      onCheckedChange={(checked) => setCallSettings((prev) => ({ ...prev, transcription: checked }))}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Default Voice</Label>
                    <Select
                      value={callSettings.voice}
                      onValueChange={(value: "alice" | "man" | "woman") =>
                        setCallSettings((prev) => ({ ...prev, voice: value }))
                      }
                    >
                      <SelectTrigger className="border-blue-200">
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
                    <Label>Call Timeout (seconds)</Label>
                    <Select
                      value={callSettings.timeout.toString()}
                      onValueChange={(value) =>
                        setCallSettings((prev) => ({ ...prev, timeout: Number.parseInt(value) }))
                      }
                    >
                      <SelectTrigger className="border-blue-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 seconds</SelectItem>
                        <SelectItem value="30">30 seconds</SelectItem>
                        <SelectItem value="45">45 seconds</SelectItem>
                        <SelectItem value="60">60 seconds</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="pt-4 border-t border-blue-100">
                  <h3 className="font-semibold mb-2">Pricing Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="font-medium">Outbound Calls</div>
                      <div className="text-blue-600">₹1.50 per minute</div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="font-medium">Recording Storage</div>
                      <div className="text-blue-600">Free for 30 days</div>
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
