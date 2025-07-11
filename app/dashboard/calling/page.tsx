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
  Voicemail,
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
  callType?: "voice" | "live" | "conference" | "direct"
}

interface VoicemailRecord {
  id: string
  from: string
  to: string
  duration: number
  recordingUrl: string
  timestamp: Date
  status: "new" | "read"
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
  const [activeTab, setActiveTab] = useState("twilio-call")
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
  const [voicemails, setVoicemails] = useState<VoicemailRecord[]>([])
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

  useEffect(() => {
    fetchCallHistory()
    fetchVoicemails()
    fetchBalance()
  }, [])

  useEffect(() => {
    if (isCallActive) {
      callTimerRef.current = setInterval(() => {
        setCallDuration((prev) => {
          const newDuration = prev + 1
          setCallCost((newDuration * 0.05) / 60)
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
      toast.error("Failed to load call history")
    }
  }

  const fetchVoicemails = async () => {
    try {
      const response = await fetch("/api/voicemails?userId=demo-user")
      const data = await response.json()

      if (data.success) {
        setVoicemails(data.voicemails)
      }
    } catch (error) {
      toast.error("Failed to load voicemails")
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
      // Silent fail
    }
  }

  const formatIndianNumber = (number: string) => {
    const cleaned = number.replace(/\D/g, "")

    if (cleaned.startsWith("91") && cleaned.length === 12) {
      return cleaned
    } else if (cleaned.length === 10) {
      return `91${cleaned}`
    } else if (cleaned.startsWith("0") && cleaned.length === 11) {
      return `91${cleaned.substring(1)}`
    }

    return cleaned
  }

  const makeTwilioCall = async () => {
    if (!phoneNumber.trim()) {
      toast.error("Please enter a phone number")
      return
    }

    if (balance < 1) {
      toast.error("Insufficient balance to make a call")
      return
    }

    setIsLoading(true)

    try {
      const formattedNumber = formatIndianNumber(phoneNumber)

      const response = await fetch("/api/calling/call-twilio-number", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetNumber: `+${formattedNumber}`,
          userId: "demo-user",
          callType: "direct",
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

        toast.success("Call initiated from your Twilio number!")

        setTimeout(() => {
          fetchCallHistory()
        }, 2000)
      } else {
        throw new Error(data.error || "Failed to make call from Twilio number")
      }
    } catch (error) {
      toast.error(error.message || "Failed to make call from Twilio number")
    } finally {
      setIsLoading(false)
    }
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

        setTimeout(() => {
          fetchCallHistory()
        }, 2000)
      } else {
        throw new Error(data.error || "Failed to make live call")
      }
    } catch (error) {
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

        setTimeout(() => {
          fetchCallHistory()
        }, 2000)
      } else {
        throw new Error(data.error || "Failed to make call")
      }
    } catch (error) {
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

        setPhoneNumber1("")
        setPhoneNumber2("")

        setTimeout(() => {
          fetchCallHistory()
        }, 3000)
      } else {
        throw new Error(data.error || "Failed to create conference call")
      }
    } catch (error) {
      toast.error(error.message || "Failed to create conference call")
    } finally {
      setIsConnecting(false)
    }
  }

  const endCall = () => {
    setIsCallActive(false)
    setIsRecording(false)
    setCurrentCallSid(null)

    setBalance((prev) => Math.max(0, prev - callCost))

    toast.success(`Call ended. Cost: $${callCost.toFixed(2)}`)

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
      toast.error("Failed to delete call record")
    }
  }

  const markVoicemailAsRead = async (voicemailId: string) => {
    try {
      const response = await fetch("/api/voicemails", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          voicemailId,
          status: "read",
        }),
      })

      const data = await response.json()

      if (data.success) {
        fetchVoicemails()
      }
    } catch (error) {
      // Silent fail
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

  const addDigit = (digit: string, target: "voice" | "live" | "twilio") => {
    if (!isCallActive) {
      if (target === "voice") {
        setPhoneNumber((prev) => prev + digit)
      } else if (target === "live") {
        setLivePhoneNumber((prev) => prev + digit)
      } else if (target === "twilio") {
        setPhoneNumber((prev) => prev + digit)
      }
    }
  }

  const clearNumber = (target: "voice" | "live" | "twilio") => {
    if (!isCallActive) {
      if (target === "voice") {
        setPhoneNumber("")
      } else if (target === "live") {
        setLivePhoneNumber("")
      } else if (target === "twilio") {
        setPhoneNumber("")
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
      case "direct":
        return <Phone className="h-3 w-3 text-orange-600" />
      default:
        return <MessageSquare className="h-3 w-3 text-blue-600" />
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Advanced Calling System</h1>
          <p className="text-muted-foreground">
            Call with your Twilio number, make live calls, voice calls, and manage everything
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
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="twilio-call">
            <Phone className="h-4 w-4 mr-2" />
            Twilio Call
          </TabsTrigger>
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
          <TabsTrigger value="voicemails">
            <Voicemail className="h-4 w-4 mr-2" />
            Voicemails ({voicemails.filter((vm) => vm.status === "new").length})
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            History ({callHistory.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="twilio-call" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Phone className="h-5 w-5 text-orange-600" />
                  <span>Call with Your Twilio Number</span>
                </CardTitle>
                <CardDescription>
                  Make calls directly from your Twilio number (+19252617266). The call will appear to come from your
                  Twilio number.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="twilio-phone">Phone Number to Call</Label>
                  <Input
                    id="twilio-phone"
                    type="tel"
                    placeholder="9876543210 or +919876543210"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={isCallActive}
                    className="text-lg text-center"
                  />
                  <p className="text-xs text-muted-foreground">
                    This number will receive a call from your Twilio number
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                  {dialPadNumbers.map((row, rowIndex) =>
                    row.map((digit) => (
                      <Button
                        key={`twilio-${digit}`}
                        variant="outline"
                        size="lg"
                        onClick={() => addDigit(digit, "twilio")}
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
                    onClick={() => clearNumber("twilio")}
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

                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <h4 className="font-medium text-orange-800 mb-2">How Twilio Calling Works:</h4>
                  <ul className="text-sm text-orange-700 space-y-1">
                    <li>• Your Twilio number (+19252617266) calls the target number</li>
                    <li>• The person sees your Twilio number as the caller ID</li>
                    <li>• They answer and hear a greeting message</li>
                    <li>• Perfect for business calls and outreach</li>
                  </ul>
                </div>

                <Button
                  onClick={makeTwilioCall}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  size="lg"
                  disabled={isLoading || !phoneNumber}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Calling from Twilio...
                    </>
                  ) : (
                    <>
                      <Phone className="mr-2 h-4 w-4" />
                      Call from Twilio Number
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Incoming Call Features</CardTitle>
                <CardDescription>When someone calls your Twilio number (+19252617266)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-3">Incoming Call Menu:</h4>
                  <div className="space-y-2 text-sm text-blue-700">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="w-8 h-6 flex items-center justify-center">
                        1
                      </Badge>
                      <span>Connect to customer support (your phone)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="w-8 h-6 flex items-center justify-center">
                        2
                      </Badge>
                      <span>Leave a voice message</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="w-8 h-6 flex items-center justify-center">
                        3
                      </Badge>
                      <span>Connect to a specific number</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="w-8 h-6 flex items-center justify-center">
                        0
                      </Badge>
                      <span>Repeat menu</span>
                    </div>
                  </div>
                </div>

                <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
                  <PhoneIncoming className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium mb-2">Your Twilio Number</p>
                  <p className="text-2xl font-bold text-blue-600">+19252617266</p>
                  <p className="text-sm text-muted-foreground mt-2">Share this number for people to call you</p>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h4 className="font-medium text-yellow-800 mb-2">Setup Required:</h4>
                  <p className="text-sm text-yellow-700">
                    Configure your Twilio number webhook to point to:
                    <br />
                    <code className="bg-yellow-100 px-2 py-1 rounded text-xs">
                      https://master-tool.vercel.app/api/calling/incoming-call
                    </code>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="live" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  <ol className="text-sm text-green-700 space-y-1 list-decimal list-inside">
                    <li>System calls the target person</li>
                    <li>They hear hold music while waiting</li>
                    <li>System calls YOUR phone (+919876543210)</li>
                    <li>You answer to be connected</li>
                    <li>Have a normal conversation!</li>
                  </ol>
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
                      Connecting Live Call...
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

            <Card>
              <CardHeader>
                <CardTitle>Call Controls</CardTitle>
                <CardDescription>Manage your active calls</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isCallActive ? (
                  <div className="space-y-4">
                    <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
                      <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <PhoneCall className="h-8 w-8 text-white" />
                      </div>
                      <p className="text-lg font-medium text-green-800">Call Active</p>
                      <p className="text-3xl font-bold text-green-600">{formatDuration(callDuration)}</p>
                      <p className="text-sm text-green-700">Cost: ${callCost.toFixed(3)}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        onClick={toggleMute}
                        variant={isMuted ? "destructive" : "outline"}
                        className="flex-1"
                        size="lg"
                      >
                        {isMuted ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
                        {isMuted ? "Unmute" : "Mute"}
                      </Button>

                      <Button
                        onClick={toggleRecording}
                        variant={isRecording ? "destructive" : "outline"}
                        className="flex-1"
                        size="lg"
                      >
                        {isRecording ? <Square className="mr-2 h-4 w-4" /> : <Phone className="mr-2 h-4 w-4" />}
                        {isRecording ? "Stop Rec" : "Record"}
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label>Volume</Label>
                      <div className="flex items-center space-x-2">
                        <VolumeX className="h-4 w-4" />
                        <Slider value={volume} onValueChange={setVolume} max={100} step={1} className="flex-1" />
                        <Volume2 className="h-4 w-4" />
                      </div>
                    </div>

                    <Button onClick={endCall} variant="destructive" className="w-full" size="lg">
                      <PhoneOff className="mr-2 h-4 w-4" />
                      End Call
                    </Button>
                  </div>
                ) : (
                  <div className="text-center p-8 text-muted-foreground">
                    <PhoneOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No active calls</p>
                    <p className="text-sm">Start a call to see controls here</p>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-record">Auto Record Calls</Label>
                    <Switch id="auto-record" checked={autoRecord} onCheckedChange={setAutoRecord} />
                  </div>
                  <p className="text-xs text-muted-foreground">Automatically start recording when a call begins</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="voice" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  <span>Voice Call (Text-to-Speech)</span>
                </CardTitle>
                <CardDescription>
                  Send a voice message using text-to-speech. The system will call and play your message.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="voicePhone">Phone Number</Label>
                  <Input
                    id="voicePhone"
                    type="tel"
                    placeholder="9876543210 or +919876543210"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={isCallActive}
                    className="text-lg text-center"
                  />
                </div>

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

                <div className="space-y-2">
                  <Label htmlFor="message">Message to Speak</Label>
                  <Textarea
                    id="message"
                    placeholder="Enter your message here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={isCallActive}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    This message will be converted to speech and played during the call
                  </p>
                </div>

                <Button
                  onClick={makeCall}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="lg"
                  disabled={isLoading || !phoneNumber || !message}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Making Voice Call...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Make Voice Call
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Voice Settings</span>
                </CardTitle>
                <CardDescription>Customize the voice and speech settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="voice-select">Voice Type</Label>
                  <Select
                    value={voiceSettings.voice}
                    onValueChange={(value) => setVoiceSettings({ ...voiceSettings, voice: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alice">Alice (Female, Clear)</SelectItem>
                      <SelectItem value="man">Man (Male, Deep)</SelectItem>
                      <SelectItem value="woman">Woman (Female, Warm)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language-select">Language</Label>
                  <Select
                    value={voiceSettings.language}
                    onValueChange={(value) => setVoiceSettings({ ...voiceSettings, language: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en-US">English (US)</SelectItem>
                      <SelectItem value="en-GB">English (UK)</SelectItem>
                      <SelectItem value="en-AU">English (Australia)</SelectItem>
                      <SelectItem value="en-IN">English (India)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Speech Speed: {voiceSettings.speed}x</Label>
                  <Slider
                    value={[voiceSettings.speed]}
                    onValueChange={(value) => setVoiceSettings({ ...voiceSettings, speed: value[0] })}
                    max={2}
                    min={0.5}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Slow (0.5x)</span>
                    <span>Normal (1x)</span>
                    <span>Fast (2x)</span>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-2">Preview Message:</h4>
                  <p className="text-sm text-blue-700 italic">
                    "{message.substring(0, 100)}
                    {message.length > 100 ? "..." : ""}"
                  </p>
                  <p className="text-xs text-blue-600 mt-2">
                    Voice: {voiceSettings.voice} | Speed: {voiceSettings.speed}x | Language: {voiceSettings.language}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-record-voice">Auto Record Voice Calls</Label>
                    <Switch id="auto-record-voice" checked={autoRecord} onCheckedChange={setAutoRecord} />
                  </div>
                  <p className="text-xs text-muted-foreground">Automatically record voice calls for playback</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="conference" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-purple-600" />
                <span>2-Way Conference Call</span>
              </CardTitle>
              <CardDescription>
                Connect two people together in a conference call. Both parties will be called and connected.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone1">First Person's Number</Label>
                    <Input
                      id="phone1"
                      type="tel"
                      placeholder="9876543210"
                      value={phoneNumber1}
                      onChange={(e) => setPhoneNumber1(e.target.value)}
                      disabled={isConnecting}
                      className="text-lg text-center"
                    />
                  </div>

                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Users className="h-6 w-6 text-purple-600" />
                    </div>
                    <p className="text-sm text-muted-foreground">Will be connected to</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone2">Second Person's Number</Label>
                    <Input
                      id="phone2"
                      type="tel"
                      placeholder="9876543210"
                      value={phoneNumber2}
                      onChange={(e) => setPhoneNumber2(e.target.value)}
                      disabled={isConnecting}
                      className="text-lg text-center"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <h4 className="font-medium text-purple-800 mb-2">How Conference Calling Works:</h4>
                    <ol className="text-sm text-purple-700 space-y-1 list-decimal list-inside">
                      <li>System calls the first person</li>
                      <li>System calls the second person</li>
                      <li>Both are placed in a conference room</li>
                      <li>They can talk to each other directly</li>
                      <li>Call is recorded for your records</li>
                    </ol>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <h4 className="font-medium text-yellow-800 mb-2">Cost Information:</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• Two simultaneous calls are made</li>
                      <li>• Cost: ~$0.10 per minute total</li>
                      <li>• Minimum balance required: $2.00</li>
                      <li>• Current balance: ${balance.toFixed(2)}</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button
                onClick={makeConferenceCall}
                className="w-full bg-purple-600 hover:bg-purple-700"
                size="lg"
                disabled={isConnecting || !phoneNumber1 || !phoneNumber2 || balance < 2}
              >
                {isConnecting ? (
                  <>
                    <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Connecting Conference Call...
                  </>
                ) : (
                  <>
                    <Link className="mr-2 h-4 w-4" />
                    Connect Both Numbers
                  </>
                )}
              </Button>

              {balance < 2 && (
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <p className="text-sm text-red-700">
                    <strong>Insufficient Balance:</strong> Conference calls require a minimum balance of $2.00. Your
                    current balance is ${balance.toFixed(2)}.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="voicemails" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Voicemail className="h-5 w-5" />
                  <span>Voicemails</span>
                </div>
                <Badge variant="secondary">{voicemails.filter((vm) => vm.status === "new").length} New</Badge>
              </CardTitle>
              <CardDescription>
                Voicemails left by callers when they call your Twilio number and select option 2
              </CardDescription>
            </CardHeader>
            <CardContent>
              {voicemails.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Voicemail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No voicemails yet</p>
                  <p className="text-sm">Voicemails will appear here when people call your Twilio number</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {voicemails.map((voicemail) => (
                    <div
                      key={voicemail.id}
                      className={`p-4 rounded-lg border ${
                        voicemail.status === "new" ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              voicemail.status === "new" ? "bg-blue-100" : "bg-gray-100"
                            }`}
                          >
                            <Voicemail
                              className={`h-5 w-5 ${voicemail.status === "new" ? "text-blue-600" : "text-gray-600"}`}
                            />
                          </div>
                          <div>
                            <p className="font-medium">{formatPhoneNumber(voicemail.from)}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(voicemail.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={voicemail.status === "new" ? "default" : "secondary"}>
                            {voicemail.status === "new" ? "New" : "Read"}
                          </Badge>
                          <Badge variant="outline">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDuration(voicemail.duration)}
                          </Badge>
                        </div>
                      </div>

                      {voicemail.recordingUrl && (
                        <AudioPlayer
                          recordingUrl={voicemail.recordingUrl}
                          callId={voicemail.id}
                          phoneNumber={voicemail.from}
                        />
                      )}

                      {voicemail.status === "new" && (
                        <div className="mt-3 flex justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markVoicemailAsRead(voicemail.id)}
                            className="bg-transparent"
                          >
                            Mark as Read
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <History className="h-5 w-5" />
                  <span>Call History</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button onClick={fetchCallHistory} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Badge variant="secondary">{callHistory.length} Total Calls</Badge>
                </div>
              </CardTitle>
              <CardDescription>Complete history of all your calls with recordings and details</CardDescription>
            </CardHeader>
            <CardContent>
              {callHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No call history yet</p>
                  <p className="text-sm">Your calls will appear here after you make them</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {callHistory.map((call) => (
                    <div key={call.id} className="p-4 rounded-lg border bg-card">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          {getDirectionIcon(call.direction)}
                          <div>
                            <p className="font-medium">{formatPhoneNumber(call.phoneNumber)}</p>
                            <p className="text-sm text-muted-foreground">{new Date(call.timestamp).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getCallTypeIcon(call.callType)}
                          <Badge variant={getStatusColor(call.status)}>{call.status}</Badge>
                          {call.duration > 0 && (
                            <Badge variant="outline">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatDuration(call.duration)}
                            </Badge>
                          )}
                          {call.cost > 0 && (
                            <Badge variant="outline">
                              <DollarSign className="h-3 w-3 mr-1" />${call.cost.toFixed(3)}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {call.message && (
                        <div className="mb-3 p-3 bg-muted rounded-lg">
                          <p className="text-sm">
                            <strong>Message:</strong> {call.message}
                          </p>
                        </div>
                      )}

                      {call.recordingUrl && (
                        <div className="mb-3">
                          <AudioPlayer
                            recordingUrl={call.recordingUrl}
                            callId={call.id}
                            phoneNumber={call.phoneNumber}
                          />
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <div className="text-xs text-muted-foreground">Call ID: {call.callSid}</div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteCallRecord(call.callSid)}
                          className="bg-transparent text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
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
