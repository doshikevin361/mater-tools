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
  Pause,
  Download,
  Clock,
  DollarSign,
  SkipBack,
  SkipForward,
} from "lucide-react"

interface CallRecord {
  id: string
  phoneNumber: string
  duration: number
  status: "completed" | "failed" | "busy" | "no-answer" | "in-progress"
  cost: number
  recordingUrl?: string
  transcript?: string
  timestamp: Date
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
  const [activeTab, setActiveTab] = useState("dialer")
  const [phoneNumber, setPhoneNumber] = useState("")
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
  const [callStatus, setCallStatus] = useState<string>("")
  const callTimerRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    fetchCallHistory()
    fetchUserBalance()
  }, [])

  useEffect(() => {
    if (isCallActive) {
      callTimerRef.current = setInterval(() => {
        setCallDuration((prev) => {
          const newDuration = prev + 1
          setCallCost((newDuration / 60) * 1.5) // ₹1.5 per minute
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

  const fetchUserBalance = async () => {
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
        setBalance(data.user?.balance || 0)
      }
    } catch (error) {
      console.error("Failed to fetch balance:", error)
    }
  }

  const fetchCallHistory = async () => {
    try {
      const userId = localStorage.getItem("userId")
      if (!userId) return

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

    if (!validateIndianPhoneNumber(phoneNumber)) {
      toast.error("Please enter a valid Indian phone number")
      return
    }

    if (balance < 1.5) {
      toast.error("Insufficient balance to make a call")
      return
    }

    try {
      setIsCallActive(true)
      setCallDuration(0)
      setCallCost(0)
      setCallStatus("Initiating call...")

      const response = await fetch("/api/calling/make-call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "user-id": localStorage.getItem("userId") || "",
        },
        body: JSON.stringify({
          to: formatIndianPhoneNumber(phoneNumber),
          record: autoRecord,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setCurrentCallSid(data.callSid)
        setCallStatus("Call initiated")
        if (autoRecord) {
          setIsRecording(true)
        }
        toast.success("Call initiated successfully")

        // Simulate call progression
        setTimeout(() => setCallStatus("Ringing..."), 2000)
        setTimeout(() => {
          setCallStatus("Connected")
          toast.success("Call connected!")
        }, 5000)
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to make call")
        setIsCallActive(false)
        setCallStatus("")
      }
    } catch (error) {
      console.error("Error making call:", error)
      toast.error("Failed to make call")
      setIsCallActive(false)
      setCallStatus("")
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
        }),
      })

      if (response.ok) {
        setIsCallActive(false)
        setIsRecording(false)
        setCallStatus("")
        setCurrentCallSid(null)

        // Deduct cost from balance
        setBalance((prev) => Math.max(0, prev - callCost))

        toast.success(`Call ended. Duration: ${formatDuration(callDuration)}. Cost: ₹${callCost.toFixed(2)}`)

        // Refresh call history
        fetchCallHistory()
        fetchUserBalance()
      }
    } catch (error) {
      console.error("Error ending call:", error)
      toast.error("Error ending call")
    }

    // Reset state regardless
    setIsCallActive(false)
    setIsRecording(false)
    setCallDuration(0)
    setCallCost(0)
    setCallStatus("")
    setCurrentCallSid(null)
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
      return `+91${cleaned}`
    } else if (cleaned.length === 12 && cleaned.startsWith("91")) {
      return `+${cleaned}`
    } else if (cleaned.length === 13 && cleaned.startsWith("91")) {
      return `+${cleaned}`
    }
    return `+91${cleaned}`
  }

  const displayIndianPhoneNumber = (number: string) => {
    const cleaned = number.replace(/\D/g, "")
    if (cleaned.length === 10) {
      return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`
    } else if (cleaned.length >= 12) {
      const withoutCountryCode = cleaned.slice(-10)
      return `+91 ${withoutCountryCode.slice(0, 5)} ${withoutCountryCode.slice(5)}`
    }
    return number
  }

  const validateIndianPhoneNumber = (number: string) => {
    const cleaned = number.replace(/\D/g, "")
    return cleaned.length === 10 || (cleaned.length >= 12 && cleaned.includes("91"))
  }

  const dialPadNumbers = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["*", "0", "#"],
  ]

  const addDigit = (digit: string) => {
    if (!isCallActive) {
      setPhoneNumber((prev) => prev + digit)
    }
  }

  const clearNumber = () => {
    if (!isCallActive) {
      setPhoneNumber("")
    }
  }

  const backspaceNumber = () => {
    if (!isCallActive && phoneNumber.length > 0) {
      setPhoneNumber((prev) => prev.slice(0, -1))
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Live Calling</h1>
          <p className="text-muted-foreground">Make calls, record conversations, and manage your calling history</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Account Balance</p>
            <p className="text-2xl font-bold text-green-600">₹{balance.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dialer">Dialer</TabsTrigger>
          <TabsTrigger value="history">Call History</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="dialer" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Phone className="h-5 w-5" />
                  <span>Phone Dialer</span>
                </CardTitle>
                <CardDescription>Enter an Indian phone number to make a call</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={displayIndianPhoneNumber(phoneNumber)}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                    disabled={isCallActive}
                    className="text-lg text-center"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                  {dialPadNumbers.map((row, rowIndex) =>
                    row.map((digit) => (
                      <Button
                        key={digit}
                        variant="outline"
                        size="lg"
                        onClick={() => addDigit(digit)}
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
                    onClick={clearNumber}
                    variant="outline"
                    disabled={isCallActive}
                    className="flex-1 bg-transparent"
                  >
                    Clear
                  </Button>
                  <Button
                    onClick={backspaceNumber}
                    variant="outline"
                    disabled={isCallActive || !phoneNumber}
                    className="flex-1 bg-transparent"
                  >
                    ⌫
                  </Button>
                </div>

                <div className="flex space-x-2">
                  {!isCallActive ? (
                    <Button
                      onClick={makeCall}
                      className="flex-1"
                      size="lg"
                      disabled={!validateIndianPhoneNumber(phoneNumber)}
                    >
                      <PhoneCall className="mr-2 h-4 w-4" />
                      Call
                    </Button>
                  ) : (
                    <Button onClick={endCall} variant="destructive" className="flex-1" size="lg">
                      <PhoneOff className="mr-2 h-4 w-4" />
                      End Call
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Call Controls</CardTitle>
                <CardDescription>
                  {isCallActive ? `${callStatus} - ${formatDuration(callDuration)}` : "No active call"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isCallActive && (
                  <>
                    <div className="text-center space-y-2">
                      <div className="text-2xl font-bold">{displayIndianPhoneNumber(phoneNumber)}</div>
                      <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{formatDuration(callDuration)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <DollarSign className="h-4 w-4" />
                          <span>₹{callCost.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="text-sm text-blue-600 font-medium">{callStatus}</div>
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

                    <div className="space-y-2">
                      <Label className="flex items-center space-x-2">
                        {volume[0] > 0 ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                        <span>Volume: {volume[0]}%</span>
                      </Label>
                      <Slider value={volume} onValueChange={setVolume} max={100} step={1} className="w-full" />
                    </div>
                  </>
                )}

                {!isCallActive && (
                  <div className="text-center text-muted-foreground py-8">
                    <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No active call</p>
                    <p className="text-sm">Enter an Indian number and press call to start</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Call History</CardTitle>
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
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Phone className="h-5 w-5 text-blue-600" />
                            </div>
                          </div>
                          <div>
                            <p className="font-medium text-lg">{call.phoneNumber}</p>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <span className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{formatDuration(call.duration)}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <DollarSign className="h-3 w-3" />
                                <span>₹{call.cost.toFixed(2)}</span>
                              </span>
                              <span>{new Date(call.timestamp).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant={
                            call.status === "completed"
                              ? "default"
                              : call.status === "failed"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {call.status}
                        </Badge>
                      </div>

                      {call.recordingUrl && (
                        <AudioPlayer recordingUrl={call.recordingUrl} callId={call.id} phoneNumber={call.phoneNumber} />
                      )}

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

                      {!call.recordingUrl && call.status === "completed" && (
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
                <Label>Call Rate</Label>
                <p className="text-sm text-muted-foreground">₹1.50 per minute for Indian numbers</p>
              </div>

              <div className="space-y-2">
                <Label>Current Balance</Label>
                <p className="text-2xl font-bold text-green-600">₹{balance.toFixed(2)}</p>
                <Button variant="outline" size="sm">
                  Add Funds
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Recording Storage</Label>
                <p className="text-sm text-muted-foreground">
                  Recordings are stored for 30 days and can be downloaded anytime
                </p>
              </div>

              <div className="space-y-2">
                <Label>Supported Numbers</Label>
                <p className="text-sm text-muted-foreground">
                  Indian mobile numbers (10 digits) - Format: +91 98765 43210
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
