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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import {
  Phone,
  PhoneCall,
  PhoneOff,
  PhoneIncoming,
  PhoneOutgoing,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Square,
  Play,
  Pause,
  Download,
  Clock,
  DollarSign,
  SkipBack,
  SkipForward,
  Trash2,
  RefreshCw,
  Settings,
  History,
  MessageSquare,
  Users,
  Link,
} from "lucide-react"

interface CallRecord {
  id: string
  callSid: string
  phoneNumber: string
  direction: "inbound" | "outbound"
  duration: number
  status: "completed" | "failed" | "busy" | "no-answer" | "in-progress" | "ringing"
  cost: number
  recordingUrl?: string
  recordingSid?: string
  transcript?: string
  timestamp: Date
  message?: string
  callType?: "voice" | "live" | "conference"
}

interface AudioPlayerProps {
  recordingUrl: string
  callId: string
  phoneNumber: string
}

function AudioPlayer({ recordingUrl, callId, phoneNumber }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState([80])
  const [isLoading, setIsLoading] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)
    const handleEnded = () => setIsPlaying(false)
    const handleLoadStart = () => setIsLoading(true)
    const handleCanPlay = () => setIsLoading(false)

    audio.addEventListener("timeupdate", updateTime)
    audio.addEventListener("loadedmetadata", updateDuration)
    audio.addEventListener("ended", handleEnded)
    audio.addEventListener("loadstart", handleLoadStart)
    audio.addEventListener("canplay", handleCanPlay)

    return () => {
      audio.removeEventListener("timeupdate", updateTime)
      audio.removeEventListener("loadedmetadata", updateDuration)
      audio.removeEventListener("ended", handleEnded)
      audio.removeEventListener("loadstart", handleLoadStart)
      audio.removeEventListener("canplay", handleCanPlay)
    }
  }, [])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume[0] / 100
    }
  }, [volume])

  const togglePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      audio.play()
      setIsPlaying(true)
    }
  }

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current
    if (!audio || !duration) return

    const newTime = (value[0] / 100) * duration
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  const skipBackward = () => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = Math.max(0, audio.currentTime - 10)
  }

  const skipForward = () => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = Math.min(duration, audio.currentTime + 10)
  }

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00"
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const downloadRecording = async () => {
    try {
      const response = await fetch(recordingUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `call-recording-${phoneNumber.replace(/\D/g, "")}-${callId}.mp3`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success("Recording downloaded")
    } catch (error) {
      toast.error("Failed to download recording")
    }
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-3 border">
      <audio ref={audioRef} src={recordingUrl} preload="metadata" />

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <Phone className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium">Call Recording</p>
            <p className="text-xs text-gray-500">{phoneNumber}</p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={downloadRecording} className="h-8 bg-transparent">
          <Download className="h-3 w-3" />
        </Button>
      </div>

      <div className="space-y-2">
        <Slider
          value={[progress]}
          onValueChange={handleSeek}
          max={100}
          step={0.1}
          className="w-full"
          disabled={!duration || isLoading}
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={skipBackward}
            disabled={!duration || isLoading}
            className="h-8 w-8 p-0 bg-transparent"
          >
            <SkipBack className="h-3 w-3" />
          </Button>

          <Button size="sm" onClick={togglePlayPause} disabled={!duration || isLoading} className="h-8 w-8 p-0">
            {isLoading ? (
              <div className="w-3 h-3 border border-gray-300 border-t-blue-600 rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-3 w-3" />
            ) : (
              <Play className="h-3 w-3" />
            )}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={skipForward}
            disabled={!duration || isLoading}
            className="h-8 w-8 p-0 bg-transparent"
          >
            <SkipForward className="h-3 w-3" />
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <VolumeX className="h-3 w-3 text-gray-400" />
          <Slider value={volume} onValueChange={setVolume} max={100} step={1} className="w-16" />
          <Volume2 className="h-3 w-3 text-gray-400" />
        </div>
      </div>
    </div>
  )
}

export default function CallingPage() {
  const [activeTab, setActiveTab] = useState("live")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [livePhoneNumber, setLivePhoneNumber] = useState("")
  const [phoneNumber1, setPhoneNumber1] = useState("")
  const [phoneNumber2, setPhoneNumber2] = useState("")
  const [message, setMessage] = useState("Hello! This is a test call from our system. Thank you for your time.")
  const [isCallActive, setIsCallActive] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [volume, setVolume] = useState([80])
  const [callHistory, setCallHistory] = useState<CallRecord[]>([])
  const [balance, setBalance] = useState(25.5)
  const [autoRecord, setAutoRecord] = useState(true)
  const [callCost, setCallCost] = useState(0)
  const [currentCallSid, setCurrentCallSid] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isLiveCalling, setIsLiveCalling] = useState(false)
  const [voiceSettings, setVoiceSettings] = useState({
    voice: "alice",
    language: "en-US",
    speed: 1,
  })
  const callTimerRef = useRef<NodeJS.Timeout>()

  // Load call history and balance on component mount
  useEffect(() => {
    fetchCallHistory()
    fetchBalance()
  }, [])

  // Call timer effect
  useEffect(() => {
    if (isCallActive) {
      callTimerRef.current = setInterval(() => {
        setCallDuration((prev) => {
          const newDuration = prev + 1
          setCallCost((newDuration * 0.05) / 60) // $0.05 per minute
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
  }, [isCallActive])

  const fetchCallHistory = async () => {
    try {
      const response = await fetch("/api/calling/history?userId=demo-user")
      const data = await response.json()

      if (data.success) {
        setCallHistory(data.calls)
      }
    } catch (error) {
      console.error("Failed to fetch call history:", error)
      toast.error("Failed to load call history")
    }
  }

  const fetchBalance = async () => {
    try {
      const response = await fetch("/api/calling/balance")
      const data = await response.json()

      if (data.success) {
        setBalance(Number.parseFloat(data.balance) || 25.5)
      }
    } catch (error) {
      console.error("Failed to fetch balance:", error)
    }
  }

  const formatIndianNumber = (number: string) => {
    // Remove all non-digit characters
    const cleaned = number.replace(/\D/g, "")

    // Handle different Indian number formats
    if (cleaned.startsWith("91") && cleaned.length === 12) {
      return cleaned // Already has country code
    } else if (cleaned.length === 10) {
      return `91${cleaned}` // Add India country code
    } else if (cleaned.startsWith("0") && cleaned.length === 11) {
      return `91${cleaned.substring(1)}` // Remove leading 0 and add country code
    }

    return cleaned
  }

  const makeLiveCall = async () => {
    if (!livePhoneNumber.trim()) {
      toast.error("Please enter a phone number")
      return
    }

    if (balance < 1) {
      toast.error("Insufficient balance to make a call")
      return
    }

    setIsLiveCalling(true)

    try {
      const formattedNumber = formatIndianNumber(livePhoneNumber)

      const response = await fetch("/api/calling/live-call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: `+${formattedNumber}`,
          userId: "demo-user",
        }),
      })

      const data = await response.json()

      if (data.success) {
        setIsCallActive(true)
        setCallDuration(0)
        setCallCost(0)
        setCurrentCallSid(data.callSid)

        if (autoRecord) {
          setIsRecording(true)
        }

        toast.success("Live call initiated! You will receive a call on your phone to connect.")

        // Refresh call history
        setTimeout(() => {
          fetchCallHistory()
        }, 2000)
      } else {
        throw new Error(data.error || "Failed to make live call")
      }
    } catch (error) {
      console.error("Error making live call:", error)
      toast.error(error.message || "Failed to make live call")
    } finally {
      setIsLiveCalling(false)
    }
  }

  const makeCall = async () => {
    if (!phoneNumber.trim()) {
      toast.error("Please enter a phone number")
      return
    }

    if (!message.trim()) {
      toast.error("Please enter a message")
      return
    }

    if (balance < 1) {
      toast.error("Insufficient balance to make a call")
      return
    }

    setIsLoading(true)

    try {
      const formattedNumber = formatIndianNumber(phoneNumber)

      const response = await fetch("/api/calling/make-call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: `+${formattedNumber}`,
          message,
          voiceOptions: voiceSettings,
          userId: "demo-user",
        }),
      })

      const data = await response.json()

      if (data.success) {
        setIsCallActive(true)
        setCallDuration(0)
        setCallCost(0)
        setCurrentCallSid(data.callSid)

        if (autoRecord) {
          setIsRecording(true)
        }

        toast.success("Voice call initiated successfully")

        // Refresh call history
        setTimeout(() => {
          fetchCallHistory()
        }, 2000)
      } else {
        throw new Error(data.error || "Failed to make call")
      }
    } catch (error) {
      console.error("Error making call:", error)
      toast.error(error.message || "Failed to make call")
    } finally {
      setIsLoading(false)
    }
  }

  const makeConferenceCall = async () => {
    if (!phoneNumber1.trim() || !phoneNumber2.trim()) {
      toast.error("Please enter both phone numbers")
      return
    }

    if (balance < 2) {
      toast.error("Insufficient balance for conference call (minimum $2 required)")
      return
    }

    setIsConnecting(true)

    try {
      const formattedNumber1 = formatIndianNumber(phoneNumber1)
      const formattedNumber2 = formatIndianNumber(phoneNumber2)

      const response = await fetch("/api/calling/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber1: `+${formattedNumber1}`,
          phoneNumber2: `+${formattedNumber2}`,
          userId: "demo-user",
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Conference call initiated! Both parties will be called.")

        // Clear the form
        setPhoneNumber1("")
        setPhoneNumber2("")

        // Refresh call history after a delay
        setTimeout(() => {
          fetchCallHistory()
        }, 3000)
      } else {
        throw new Error(data.error || "Failed to create conference call")
      }
    } catch (error) {
      console.error("Error making conference call:", error)
      toast.error(error.message || "Failed to create conference call")
    } finally {
      setIsConnecting(false)
    }
  }

  const endCall = () => {
    setIsCallActive(false)
    setIsRecording(false)
    setCurrentCallSid(null)

    // Deduct cost from balance
    setBalance((prev) => Math.max(0, prev - callCost))

    toast.success(`Call ended. Cost: $${callCost.toFixed(2)}`)

    // Refresh call history
    setTimeout(() => {
      fetchCallHistory()
    }, 1000)
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

  const deleteCallRecord = async (callSid: string) => {
    try {
      const response = await fetch(`/api/calling/history?callSid=${callSid}&userId=demo-user`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Call record deleted")
        fetchCallHistory()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("Error deleting call record:", error)
      toast.error("Failed to delete call record")
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const formatPhoneNumber = (number: string) => {
    const cleaned = number.replace(/\D/g, "")
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    } else if (cleaned.length === 12 && cleaned.startsWith("91")) {
      const indianNumber = cleaned.substring(2)
      return `+91 ${indianNumber.slice(0, 5)} ${indianNumber.slice(5)}`
    }
    return number
  }

  const dialPadNumbers = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["*", "0", "#"],
  ]

  const addDigit = (digit: string, target: "voice" | "live") => {
    if (!isCallActive) {
      if (target === "voice") {
        setPhoneNumber((prev) => prev + digit)
      } else {
        setLivePhoneNumber((prev) => prev + digit)
      }
    }
  }

  const clearNumber = (target: "voice" | "live") => {
    if (!isCallActive) {
      if (target === "voice") {
        setPhoneNumber("")
      } else {
        setLivePhoneNumber("")
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "default"
      case "failed":
        return "destructive"
      case "in-progress":
      case "ringing":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getDirectionIcon = (direction: string) => {
    return direction === "inbound" ? (
      <PhoneIncoming className="h-4 w-4 text-green-600" />
    ) : (
      <PhoneOutgoing className="h-4 w-4 text-blue-600" />
    )
  }

  const getCallTypeIcon = (callType?: string) => {
    switch (callType) {
      case "live":
        return <PhoneCall className="h-3 w-3 text-green-600" />
      case "conference":
        return <Users className="h-3 w-3 text-purple-600" />
      default:
        return <MessageSquare className="h-3 w-3 text-blue-600" />
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Live Calling System</h1>
          <p className="text-muted-foreground">
            Make live calls, voice calls, 2-way calling, and manage your calling history
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button onClick={fetchCallHistory} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Account Balance</p>
            <p className="text-2xl font-bold text-green-600">${balance.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="live">
            <PhoneCall className="h-4 w-4 mr-2" />
            Live Call
          </TabsTrigger>
          <TabsTrigger value="voice">
            <Phone className="h-4 w-4 mr-2" />
            Voice Call
          </TabsTrigger>
          <TabsTrigger value="conference">
            <Users className="h-4 w-4 mr-2" />
            2-Way Call
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            History ({callHistory.length})
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Live Call Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PhoneCall className="h-5 w-5 text-green-600" />
                  <span>Live Call</span>
                </CardTitle>
                <CardDescription>
                  Make a live call where you can talk directly to the person. You'll receive a call on your phone to
                  connect.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="livePhone">Phone Number to Call</Label>
                  <Input
                    id="livePhone"
                    type="tel"
                    placeholder="9876543210 or +919876543210"
                    value={livePhoneNumber}
                    onChange={(e) => setLivePhoneNumber(e.target.value)}
                    disabled={isCallActive}
                    className="text-lg text-center"
                  />
                  <p className="text-xs text-muted-foreground">
                    The person will be called, and you'll receive a call to connect
                  </p>
                </div>

                {/* Dial Pad for Live Call */}
                <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                  {dialPadNumbers.map((row, rowIndex) =>
                    row.map((digit) => (
                      <Button
                        key={`live-${digit}`}
                        variant="outline"
                        size="lg"
                        onClick={() => addDigit(digit, "live")}
                        disabled={isCallActive}
                        className="h-12 text-lg font-semibold"
                      >
                        {digit}
                      </Button>
                    )),
                  )}
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={() => clearNumber("live")}
                    variant="outline"
                    disabled={isCallActive}
                    className="flex-1 bg-transparent"
                  >
                    Clear
                  </Button>
                  <Button
                    onClick={
                      livePhoneNumber.slice(0, -1) ? () => setLivePhoneNumber(livePhoneNumber.slice(0, -1)) : undefined
                    }
                    variant="outline"
                    disabled={isCallActive || !livePhoneNumber}
                    className="flex-1"
                  >
                    ⌫
                  </Button>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-800 mb-2">How Live Calling Works:</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Enter the number you want to call</li>
                    <li>• Click "Start Live Call"</li>
                    <li>• You'll receive a call on your phone</li>
                    <li>• Answer to be connected to the other person</li>
                    <li>• Have a normal conversation!</li>
                  </ul>
                </div>

                <Button
                  onClick={makeLiveCall}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                  disabled={isLiveCalling || !livePhoneNumber}
                >
                  {isLiveCalling ? (
                    <>
                      <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Initiating Live Call...
                    </>
                  ) : (
                    <>
                      <PhoneCall className="mr-2 h-4 w-4" />
                      Start Live Call
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Call Status Card */}
            <Card>
              <CardHeader>
                <CardTitle>Call Status</CardTitle>
                <CardDescription>
                  {isCallActive ? `Active call - ${formatDuration(callDuration)}` : "No active call"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isCallActive && (
                  <>
                    <div className="text-center space-y-2">
                      <div className="text-2xl font-bold">{formatPhoneNumber(livePhoneNumber || phoneNumber)}</div>
                      <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{formatDuration(callDuration)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <DollarSign className="h-4 w-4" />
                          <span>${callCost.toFixed(3)}</span>
                        </div>
                      </div>
                      {currentCallSid && <div className="text-xs text-muted-foreground">Call ID: {currentCallSid}</div>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Button onClick={toggleMute} variant={isMuted ? "destructive" : "outline"} size="lg">
                        {isMuted ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
                        {isMuted ? "Unmute" : "Mute"}
                      </Button>

                      <Button onClick={toggleRecording} variant={isRecording ? "destructive" : "outline"} size="lg">
                        {isRecording ? <Square className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                        {isRecording ? "Stop Rec" : "Record"}
                      </Button>
                    </div>

                    <Button onClick={endCall} variant="destructive" className="w-full" size="lg">
                      <PhoneOff className="mr-2 h-4 w-4" />
                      End Call
                    </Button>
                  </>
                )}

                {!isCallActive && (
                  <div className="text-center text-muted-foreground py-8">
                    <PhoneCall className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No active call</p>
                    <p className="text-sm">Start a live call to see controls here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="voice" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Voice Call Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Phone className="h-5 w-5" />
                  <span>Voice Call (Text-to-Speech)</span>
                </CardTitle>
                <CardDescription>Send a voice message that will be spoken to the recipient</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="9876543210 or +919876543210"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={isCallActive}
                    className="text-lg text-center"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Voice Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Enter the message to be spoken during the call..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={isCallActive}
                    rows={3}
                  />
                </div>

                {/* Dial Pad for Voice Call */}
                <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                  {dialPadNumbers.map((row, rowIndex) =>
                    row.map((digit) => (
                      <Button
                        key={`voice-${digit}`}
                        variant="outline"
                        size="lg"
                        onClick={() => addDigit(digit, "voice")}
                        disabled={isCallActive}
                        className="h-12 text-lg font-semibold"
                      >
                        {digit}
                      </Button>
                    )),
                  )}
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={() => clearNumber("voice")}
                    variant="outline"
                    disabled={isCallActive}
                    className="flex-1 bg-transparent"
                  >
                    Clear
                  </Button>
                  <Button
                    onClick={phoneNumber.slice(0, -1) ? () => setPhoneNumber(phoneNumber.slice(0, -1)) : undefined}
                    variant="outline"
                    disabled={isCallActive || !phoneNumber}
                    className="flex-1"
                  >
                    ⌫
                  </Button>
                </div>

                <Button onClick={makeCall} className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Calling...
                    </>
                  ) : (
                    <>
                      <Phone className="mr-2 h-4 w-4" />
                      Make Voice Call
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Voice Settings Card */}
            <Card>
              <CardHeader>
                <CardTitle>Voice Settings</CardTitle>
                <CardDescription>Configure how your message will be spoken</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Voice</Label>
                    <Select
                      value={voiceSettings.voice}
                      onValueChange={(value) => setVoiceSettings((prev) => ({ ...prev, voice: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alice">Alice (Female)</SelectItem>
                        <SelectItem value="man">Man (Male)</SelectItem>
                        <SelectItem value="woman">Woman (Female)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Language</Label>
                    <Select
                      value={voiceSettings.language}
                      onValueChange={(value) => setVoiceSettings((prev) => ({ ...prev, language: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en-US">English (US)</SelectItem>
                        <SelectItem value="en-GB">English (UK)</SelectItem>
                        <SelectItem value="es-ES">Spanish</SelectItem>
                        <SelectItem value="fr-FR">French</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Speech Speed: {voiceSettings.speed}x</Label>
                  <Slider
                    value={[voiceSettings.speed]}
                    onValueChange={(value) => setVoiceSettings((prev) => ({ ...prev, speed: value[0] }))}
                    min={0.5}
                    max={2}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-2">Preview Message:</h4>
                  <p className="text-sm text-blue-700 italic">"{message || "Enter a message to see preview"}"</p>
                  <p className="text-xs text-blue-600 mt-2">
                    Voice: {voiceSettings.voice} | Speed: {voiceSettings.speed}x
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="conference" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>2-Way Conference Call</span>
              </CardTitle>
              <CardDescription>
                Connect two phone numbers together. Both parties will be called and connected in a conference.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone1">First Phone Number</Label>
                    <Input
                      id="phone1"
                      type="tel"
                      placeholder="9876543210"
                      value={phoneNumber1}
                      onChange={(e) => setPhoneNumber1(e.target.value)}
                      disabled={isConnecting}
                      className="text-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone2">Second Phone Number</Label>
                    <Input
                      id="phone2"
                      type="tel"
                      placeholder="9123456789"
                      value={phoneNumber2}
                      onChange={(e) => setPhoneNumber2(e.target.value)}
                      disabled={isConnecting}
                      className="text-lg"
                    />
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <h4 className="font-medium text-purple-800 mb-2">How it works:</h4>
                    <ul className="text-sm text-purple-700 space-y-1">
                      <li>• Both numbers will receive a call simultaneously</li>
                      <li>• Once both parties answer, they'll be connected</li>
                      <li>• The call will be recorded automatically</li>
                      <li>• Cost: $0.10 per minute for conference calls</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <Link className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium mb-2">Connect Two Numbers</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Enter both phone numbers and click connect to start a 2-way call
                    </p>

                    <Button
                      onClick={makeConferenceCall}
                      size="lg"
                      disabled={isConnecting || !phoneNumber1 || !phoneNumber2}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      {isConnecting ? (
                        <>
                          <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Link className="mr-2 h-4 w-4" />
                          Connect Numbers
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Supported Formats:</Label>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>• 9876543210 (10 digits)</p>
                      <p>• +919876543210 (with country code)</p>
                      <p>• 09876543210 (with leading zero)</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Call History</span>
                <Button onClick={fetchCallHistory} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </CardTitle>
              <CardDescription>View your recent calls and listen to recordings</CardDescription>
            </CardHeader>
            <CardContent>
              {callHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <PhoneCall className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No call history yet</p>
                  <p className="text-sm">Your calls will appear here</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {callHistory.map((call) => (
                    <div key={call.id} className="border rounded-lg p-4 space-y-4">
                      {/* Call Info Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              {getDirectionIcon(call.direction)}
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <p className="font-medium text-lg">{formatPhoneNumber(call.phoneNumber)}</p>
                              <Badge variant="outline" className="text-xs">
                                {call.direction === "inbound" ? "Incoming" : "Outgoing"}
                              </Badge>
                              <div className="flex items-center space-x-1">
                                {getCallTypeIcon(call.callType)}
                                <span className="text-xs text-muted-foreground capitalize">
                                  {call.callType || "voice"}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <span className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{formatDuration(call.duration)}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <DollarSign className="h-3 w-3" />
                                <span>${call.cost.toFixed(3)}</span>
                              </span>
                              <span>{new Date(call.timestamp).toLocaleString()}</span>
                            </div>
                            {call.message && (
                              <div className="mt-1 text-sm text-muted-foreground flex items-center space-x-1">
                                <MessageSquare className="h-3 w-3" />
                                <span className="truncate max-w-md">{call.message}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={getStatusColor(call.status)}>{call.status}</Badge>
                          <Button
                            onClick={() => deleteCallRecord(call.callSid)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Recording Player */}
                      {call.recordingUrl && (
                        <AudioPlayer recordingUrl={call.recordingUrl} callId={call.id} phoneNumber={call.phoneNumber} />
                      )}

                      {/* Transcript */}
                      {call.transcript && (
                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                              <span className="text-xs text-white font-bold">T</span>
                            </div>
                            <span className="text-sm font-medium text-blue-800">Transcript</span>
                          </div>
                          <p className="text-sm text-blue-700 leading-relaxed">{call.transcript}</p>
                        </div>
                      )}

                      {/* No Recording Message */}
                      {!call.recordingUrl && call.status === "completed" && call.duration > 0 && (
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <p className="text-sm text-gray-600 text-center">No recording available for this call</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Call Settings</CardTitle>
                <CardDescription>Configure your calling preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-record calls</Label>
                    <p className="text-sm text-muted-foreground">Automatically start recording when a call begins</p>
                  </div>
                  <Switch checked={autoRecord} onCheckedChange={setAutoRecord} />
                </div>

                <div className="space-y-2">
                  <Label>Your Phone Number (for live calls)</Label>
                  <Input placeholder="+919876543210" className="text-sm" defaultValue="+919876543210" disabled />
                  <p className="text-xs text-muted-foreground">
                    This is the number you'll receive calls on for live calling
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Call Types</Label>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <PhoneCall className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Live Call:</span>
                      <span className="text-muted-foreground">Real conversation with the person</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Voice Call:</span>
                      <span className="text-muted-foreground">Text-to-speech message delivery</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-purple-600" />
                      <span className="font-medium">Conference:</span>
                      <span className="text-muted-foreground">Connect two people together</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Your account balance and usage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">Current Balance</p>
                  <p className="text-3xl font-bold text-green-600">${balance.toFixed(2)}</p>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Live calls</span>
                    <span className="text-sm font-medium">$0.05/minute</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Voice calls</span>
                    <span className="text-sm font-medium">$0.05/minute</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Conference calls</span>
                    <span className="text-sm font-medium">$0.10/minute</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Recording storage</span>
                    <span className="text-sm font-medium">Free</span>
                  </div>
                </div>

                <Button className="w-full bg-transparent" variant="outline">
                  Add Funds
                </Button>

                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h4 className="font-medium text-yellow-800 mb-2">Important Note:</h4>
                  <p className="text-sm text-yellow-700">
                    For live calls, make sure to update your phone number in the TwiML endpoint
                    (/api/calling/live-twiml/route.ts) to receive the connection calls.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
