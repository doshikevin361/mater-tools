"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
  Phone,
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Square,
  Play,
  Download,
  Clock,
  DollarSign,
  FileAudio,
  FileText,
  Calendar,
  User,
  Trash2,
} from "lucide-react"

interface CallRecord {
  id: string
  phoneNumber: string
  duration: number
  status: "completed" | "failed" | "busy" | "no-answer" | "cancelled"
  cost: number
  recordingUrl?: string
  recordingDuration?: number
  recordingSize?: string
  transcript?: string
  timestamp: Date
  callSid?: string
}

interface CallSettings {
  autoRecord: boolean
  transcription: boolean
  voice: "alice" | "man" | "woman"
  timeout: number
}

export default function CallingPage() {
  const [activeTab, setActiveTab] = useState("dialer")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isCallActive, setIsCallActive] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [callStatus, setCallStatus] = useState<"dialing" | "ringing" | "connected" | "ended">("dialing")
  const [isMuted, setIsMuted] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [volume, setVolume] = useState([80])
  const [callHistory, setCallHistory] = useState<CallRecord[]>([])
  const [balance, setBalance] = useState(125.5)
  const [settings, setSettings] = useState<CallSettings>({
    autoRecord: true,
    transcription: true,
    voice: "alice",
    timeout: 30,
  })
  const [callCost, setCallCost] = useState(0)
  const [currentCallSid, setCurrentCallSid] = useState<string | null>(null)
  const callTimerRef = useRef<NodeJS.Timeout>()

  // Load call history on component mount
  useEffect(() => {
    fetchCallHistory()
  }, [])

  // Call timer effect
  useEffect(() => {
    if (isCallActive && callStatus === "connected") {
      callTimerRef.current = setInterval(() => {
        setCallDuration((prev) => {
          const newDuration = prev + 1
          setCallCost(newDuration * 0.025) // ₹0.025 per second (₹1.5 per minute)
          return newDuration
        })
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
  }, [isCallActive, callStatus])

  const fetchCallHistory = async () => {
    try {
      const userId = localStorage.getItem("userId") || "demo-user"
      const response = await fetch(`/api/calling/history?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setCallHistory(data.calls || [])
      }
    } catch (error) {
      console.error("Failed to fetch call history:", error)
    }
  }

  const makeCall = async () => {
    if (!phoneNumber.trim()) {
      toast.error("Please enter a phone number")
      return
    }

    // Validate Indian phone number
    const cleanNumber = phoneNumber.replace(/\D/g, "")
    if (cleanNumber.length !== 10) {
      toast.error("Please enter a valid 10-digit Indian phone number")
      return
    }

    if (balance < 2) {
      toast.error("Insufficient balance to make a call (Minimum ₹2 required)")
      return
    }

    try {
      const fullNumber = `+91${cleanNumber}`
      const response = await fetch("/api/calling/make-call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: fullNumber,
          record: settings.autoRecord,
          voice: settings.voice,
          timeout: settings.timeout,
          userId: localStorage.getItem("userId") || "demo-user",
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setIsCallActive(true)
        setCallDuration(0)
        setCallCost(0)
        setCallStatus("dialing")
        setCurrentCallSid(data.callSid)

        if (settings.autoRecord) {
          setIsRecording(true)
        }

        toast.success("Call initiated successfully")

        // Simulate call progression
        setTimeout(() => setCallStatus("ringing"), 2000)
        setTimeout(() => {
          setCallStatus("connected")
          toast.success("Call connected!")
        }, 5000)
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to make call")
      }
    } catch (error) {
      console.error("Error making call:", error)
      toast.error("Failed to make call")
    }
  }

  const endCall = async () => {
    if (!currentCallSid) return

    try {
      const response = await fetch("/api/calling/end-call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          callSid: currentCallSid,
          duration: callDuration,
          cost: callCost,
          userId: localStorage.getItem("userId") || "demo-user",
        }),
      })

      if (response.ok) {
        setIsCallActive(false)
        setIsRecording(false)
        setCallDuration(0)
        setCallStatus("ended")
        setCurrentCallSid(null)

        // Deduct cost from balance
        setBalance((prev) => Math.max(0, prev - callCost))

        toast.success(`Call ended. Cost: ₹${callCost.toFixed(2)}`)

        // Refresh call history
        fetchCallHistory()
      }
    } catch (error) {
      console.error("Error ending call:", error)
      toast.error("Failed to end call properly")
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    toast.info(isMuted ? "Microphone unmuted" : "Microphone muted")
  }

  const toggleRecording = () => {
    if (isCallActive) {
      setIsRecording(!isRecording)
      toast.info(isRecording ? "Recording stopped" : "Recording started")
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const formatIndianPhoneNumber = (number: string) => {
    const cleaned = number.replace(/\D/g, "")
    if (cleaned.length === 10) {
      return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`
    } else if (cleaned.length === 12 && cleaned.startsWith("91")) {
      const phoneOnly = cleaned.slice(2)
      return `+91 ${phoneOnly.slice(0, 5)} ${phoneOnly.slice(5)}`
    }
    return number
  }

  const dialPadNumbers = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["*", "0", "#"],
  ]

  const addDigit = (digit: string) => {
    if (!isCallActive && phoneNumber.length < 10) {
      setPhoneNumber((prev) => prev + digit)
    }
  }

  const clearNumber = () => {
    if (!isCallActive) {
      setPhoneNumber("")
    }
  }

  const deleteLastDigit = () => {
    if (!isCallActive && phoneNumber.length > 0) {
      setPhoneNumber((prev) => prev.slice(0, -1))
    }
  }

  const downloadRecording = async (recordingUrl: string, callId: string, phoneNumber: string) => {
    try {
      toast.info("Downloading recording...")
      const response = await fetch(recordingUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `call-recording-${formatIndianPhoneNumber(phoneNumber).replace(/\s/g, "")}-${callId}.mp3`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success("Recording downloaded successfully")
    } catch (error) {
      toast.error("Failed to download recording")
    }
  }

  const playRecording = (recordingUrl: string) => {
    const audio = new Audio(recordingUrl)
    audio.play().catch(() => {
      toast.error("Failed to play recording")
    })
  }

  const deleteCall = async (callId: string) => {
    try {
      const response = await fetch(`/api/calling/delete-call`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ callId }),
      })

      if (response.ok) {
        setCallHistory((prev) => prev.filter((call) => call.id !== callId))
        toast.success("Call record deleted")
      } else {
        toast.error("Failed to delete call record")
      }
    } catch (error) {
      toast.error("Failed to delete call record")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "failed":
        return "bg-red-100 text-red-800 border-red-200"
      case "busy":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "no-answer":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "cancelled":
        return "bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getCallStatusDisplay = () => {
    switch (callStatus) {
      case "dialing":
        return "Dialing..."
      case "ringing":
        return "Ringing..."
      case "connected":
        return "Connected"
      case "ended":
        return "Call Ended"
      default:
        return "Unknown"
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Live Calling
          </h1>
          <p className="text-muted-foreground mt-1">
            Make calls, record conversations, and manage your calling history
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Account Balance</p>
            <p className="text-2xl font-bold text-green-600">₹{balance.toFixed(2)}</p>
          </div>
          <Badge className="bg-blue-100 text-blue-800 border border-blue-200">Rate: ₹1.5/min</Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-white border border-gray-200">
          <TabsTrigger value="dialer" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
            <Phone className="h-4 w-4 mr-2" />
            Dialer
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
            <Clock className="h-4 w-4 mr-2" />
            Call History
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
            <User className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dialer" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Dialer Card */}
            <Card className="border border-blue-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                <CardTitle className="flex items-center space-x-2">
                  <Phone className="h-5 w-5 text-blue-600" />
                  <span>Phone Dialer</span>
                </CardTitle>
                <CardDescription>Enter a 10-digit Indian phone number to make a call</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-medium text-gray-600 bg-gray-100 px-3 py-2 rounded-l-md border border-r-0">
                      +91
                    </span>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="98765 43210"
                      value={formatIndianPhoneNumber(phoneNumber).replace("+91 ", "")}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/\D/g, "")
                        if (cleaned.length <= 10) {
                          setPhoneNumber(cleaned)
                        }
                      }}
                      disabled={isCallActive}
                      className="text-lg text-center border-l-0 rounded-l-none focus:border-blue-400"
                      maxLength={11}
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    Preview: {phoneNumber ? formatIndianPhoneNumber(phoneNumber) : "+91 XXXXX XXXXX"}
                  </p>
                </div>

                {/* Dial Pad */}
                <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                  {dialPadNumbers.map((row, rowIndex) =>
                    row.map((digit) => (
                      <Button
                        key={digit}
                        variant="outline"
                        size="lg"
                        onClick={() => addDigit(digit)}
                        disabled={isCallActive || (digit !== "*" && digit !== "#" && phoneNumber.length >= 10)}
                        className="h-12 text-lg font-semibold border-blue-200 hover:bg-blue-50"
                      >
                        {digit}
                      </Button>
                    )),
                  )}
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={clearNumber}
                    variant="outline"
                    disabled={isCallActive || !phoneNumber}
                    className="flex-1 border-blue-200 text-blue-600 hover:bg-blue-50 bg-transparent"
                  >
                    Clear
                  </Button>
                  <Button
                    onClick={deleteLastDigit}
                    variant="outline"
                    disabled={isCallActive || !phoneNumber}
                    className="flex-1 border-blue-200 text-blue-600 hover:bg-blue-50 bg-transparent"
                  >
                    ⌫
                  </Button>
                </div>

                <div className="flex space-x-2">
                  {!isCallActive ? (
                    <Button
                      onClick={makeCall}
                      className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                      size="lg"
                      disabled={phoneNumber.length !== 10}
                    >
                      <PhoneCall className="mr-2 h-4 w-4" />
                      Call Now
                    </Button>
                  ) : (
                    <Button
                      onClick={endCall}
                      className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                      size="lg"
                    >
                      <PhoneOff className="mr-2 h-4 w-4" />
                      End Call
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Call Controls Card */}
            <Card className="border border-blue-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                <CardTitle className="flex items-center space-x-2">
                  <PhoneCall className="h-5 w-5 text-blue-600" />
                  <span>Call Controls</span>
                </CardTitle>
                <CardDescription>
                  {isCallActive ? `${getCallStatusDisplay()} - ${formatDuration(callDuration)}` : "No active call"}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {isCallActive && (
                  <>
                    <div className="text-center space-y-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                      <div className="text-2xl font-bold text-blue-700">{formatIndianPhoneNumber(phoneNumber)}</div>
                      <div className="flex items-center justify-center space-x-6 text-sm">
                        <div className="flex items-center space-x-1 text-blue-600">
                          <Clock className="h-4 w-4" />
                          <span className="font-semibold">{formatDuration(callDuration)}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-green-600">
                          <DollarSign className="h-4 w-4" />
                          <span className="font-semibold">₹{callCost.toFixed(2)}</span>
                        </div>
                      </div>
                      <Badge
                        className={`${callStatus === "connected" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
                      >
                        {getCallStatusDisplay()}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        onClick={toggleMute}
                        variant={isMuted ? "destructive" : "outline"}
                        size="lg"
                        className={!isMuted ? "border-blue-200 text-blue-600 hover:bg-blue-50" : ""}
                      >
                        {isMuted ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
                        {isMuted ? "Unmute" : "Mute"}
                      </Button>

                      <Button
                        onClick={toggleRecording}
                        variant={isRecording ? "destructive" : "outline"}
                        size="lg"
                        className={!isRecording ? "border-blue-200 text-blue-600 hover:bg-blue-50" : ""}
                      >
                        {isRecording ? <Square className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                        {isRecording ? "Stop Rec" : "Record"}
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center space-x-2">
                        {volume[0] > 0 ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                        <span>Volume: {volume[0]}%</span>
                      </Label>
                      <Slider value={volume} onValueChange={setVolume} max={100} step={1} className="w-full" />
                    </div>

                    {isRecording && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                          <span className="text-sm text-red-700 font-medium">Recording in progress</span>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {!isCallActive && (
                  <div className="text-center text-muted-foreground py-8">
                    <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">No active call</p>
                    <p className="text-sm">Enter a number and press call to start</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card className="border border-blue-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <span>Call History</span>
              </CardTitle>
              <CardDescription>View your recent calls, recordings, and transcripts</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {callHistory.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <PhoneCall className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">No call history yet</p>
                  <p className="text-sm">Your calls will appear here after you make them</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {callHistory.map((call) => (
                    <div
                      key={call.id}
                      className="p-4 border border-blue-100 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <Phone className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-lg">{formatIndianPhoneNumber(call.phoneNumber)}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-4 w-4" />
                                <span>{new Date(call.timestamp).toLocaleString()}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="h-4 w-4" />
                                <span>{formatDuration(call.duration)}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <DollarSign className="h-4 w-4" />
                                <span>₹{call.cost.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(call.status)}>{call.status}</Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteCall(call.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Recording Information */}
                      {call.recordingUrl && (
                        <div className="mt-4 p-3 bg-white border border-blue-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <FileAudio className="h-4 w-4 text-blue-600" />
                              <span className="font-medium text-sm">Recording Available</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {call.recordingSize && `Size: ${call.recordingSize}`}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
                            <span>Duration: {formatDuration(call.recordingDuration || call.duration)}</span>
                            <span>•</span>
                            <span>Format: MP3</span>
                            <span>•</span>
                            <span>Quality: HD</span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => playRecording(call.recordingUrl!)}
                              className="border-blue-200 text-blue-600 hover:bg-blue-50"
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Play
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => downloadRecording(call.recordingUrl!, call.id, call.phoneNumber)}
                              className="border-green-200 text-green-600 hover:bg-green-50"
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                            {call.transcript && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-purple-200 text-purple-600 hover:bg-purple-50 bg-transparent"
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                Transcript
                              </Button>
                            )}
                          </div>

                          {call.transcript && (
                            <div className="mt-3 p-2 bg-gray-50 border border-gray-200 rounded text-sm">
                              <p className="font-medium text-gray-700 mb-1">Transcript:</p>
                              <p className="text-gray-600 italic">{call.transcript}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {!call.recordingUrl && (
                        <div className="mt-3 p-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-500 text-center">
                          No recording available for this call
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
          <Card className="border border-blue-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5 text-blue-600" />
                <span>Call Settings</span>
              </CardTitle>
              <CardDescription>Configure your calling preferences and options</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Auto-record calls</Label>
                    <p className="text-sm text-muted-foreground">Automatically start recording when a call connects</p>
                  </div>
                  <Switch
                    checked={settings.autoRecord}
                    onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, autoRecord: checked }))}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Call transcription</Label>
                    <p className="text-sm text-muted-foreground">Generate text transcripts of recorded calls</p>
                  </div>
                  <Switch
                    checked={settings.transcription}
                    onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, transcription: checked }))}
                  />
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="text-base font-medium">Voice selection</Label>
                  <Select
                    value={settings.voice}
                    onValueChange={(value: "alice" | "man" | "woman") =>
                      setSettings((prev) => ({ ...prev, voice: value }))
                    }
                  >
                    <SelectTrigger className="border-blue-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alice">Alice (Female, Clear)</SelectItem>
                      <SelectItem value="woman">Woman (Natural)</SelectItem>
                      <SelectItem value="man">Man (Professional)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-medium">Call timeout</Label>
                  <Select
                    value={settings.timeout.toString()}
                    onValueChange={(value) => setSettings((prev) => ({ ...prev, timeout: Number.parseInt(value) }))}
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

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Billing Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Phone className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">Call Rate</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">₹1.50/min</p>
                    <p className="text-sm text-gray-600">For Indian numbers</p>
                  </div>
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      <span className="font-medium">Current Balance</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">₹{balance.toFixed(2)}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 border-green-200 text-green-600 hover:bg-green-50 bg-transparent"
                    >
                      Add Funds
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">Important Notes:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• All calls are made to Indian numbers (+91)</li>
                  <li>• Recording storage is free for 30 days</li>
                  <li>• Transcription service charges apply separately</li>
                  <li>• Minimum balance of ₹2 required to make calls</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
