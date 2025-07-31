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
import { twilioVoiceBrowser } from "@/lib/twilio-voice-browser"
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
  Wifi,
  WifiOff,
} from "lucide-react"

interface CallRecord {
  id: string
  phoneNumber: string
  duration: number
  status: "completed" | "failed" | "busy" | "no-answer"
  cost: number
  recordingUrl?: string
  transcript?: string
  timestamp: Date
  type?: string
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
  const [isConnected, setIsConnected] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [callStatus, setCallStatus] = useState("idle")
  const callTimerRef = useRef<NodeJS.Timeout>()

  // Initialize Twilio Voice SDK
  useEffect(() => {
    console.log("Initializing Twilio Voice SDK...")
    initializeTwilioVoice()
  }, [])

  // Load call history on component mount
  useEffect(() => {
    fetchCallHistory()
  }, [])

  // Call timer effect
  useEffect(() => {
    if (isCallActive) {
      callTimerRef.current = setInterval(() => {
        setCallDuration((prev) => {
          const newDuration = prev + 1
          setCallCost(newDuration * 0.05) // $0.05 per minute
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

  const initializeTwilioVoice = async () => {
    try {
      setIsInitializing(true)
      await twilioVoiceBrowser.initialize()
      setIsConnected(true)
      toast.success("Voice calling ready! You can now make calls directly from your browser.")

      // Set up call event listeners
      const device = twilioVoiceBrowser.getDevice()
      if (device) {
        device.on("connect", (call: any) => {
          console.log("Device connect event fired:", call)
          setIsCallActive(true)
          setCallStatus("connected")
          setCallDuration(0)
          toast.success("Call connected!")
        })

        device.on("disconnect", (call: any) => {
          console.log("Device disconnect event fired:", call)
          setIsCallActive(false)
          setCallStatus("idle")
          setIsMuted(false)
          toast.info("Call ended")

          // Add to call history
          const newCall: CallRecord = {
            id: `call_${Date.now()}`,
            phoneNumber: phoneNumber,
            duration: callDuration,
            status: "completed",
            cost: callCost,
            timestamp: new Date(),
            type: "browser_call",
          }
          setCallHistory((prev) => [newCall, ...prev])

          // Deduct cost from balance
          setBalance((prev) => Math.max(0, prev - callCost))

          // Refresh call history from server
          fetchCallHistory()
        })

        device.on("error", (error: any) => {
          console.error("Call error:", error)
          setIsCallActive(false)
          setCallStatus("idle")
          toast.error(`Call error: ${error.message}`)
        })

        device.on("incoming", (call: any) => {
          toast.info(`Incoming call from ${call.parameters.From}`)
          setCallStatus("incoming")
        })
      }
    } catch (error) {
      console.error("Failed to initialize Twilio Voice:", error)
      setIsConnected(false)
      toast.error("Failed to initialize voice calling. Please check your internet connection and refresh the page.")
    } finally {
      setIsInitializing(false)
    }
  }

  const fetchCallHistory = async () => {
    try {
      const response = await fetch("/api/calling/history")
      const data = await response.json()

      if (data.success) {
        const formattedCalls = data.calls.map((call: any) => ({
          ...call,
          timestamp: new Date(call.timestamp),
        }))
        setCallHistory(formattedCalls)
      }
    } catch (error) {
      console.error("Failed to fetch call history:", error)
      // Fallback to mock data
      const mockHistory: CallRecord[] = [
        {
          id: "call_001",
          phoneNumber: "+919876543210",
          duration: 125,
          status: "completed",
          cost: 2.5,
          recordingUrl: "/api/recordings/sample-call-1.mp3",
          transcript: "Hello, this is a test call recording with customer service...",
          timestamp: new Date(Date.now() - 3600000),
          type: "browser_call",
        },
        {
          id: "call_002",
          phoneNumber: "+919123456789",
          duration: 89,
          status: "completed",
          cost: 1.75,
          recordingUrl: "/api/recordings/sample-call-2.mp3",
          timestamp: new Date(Date.now() - 7200000),
          type: "browser_call",
        },
      ]
      setCallHistory(mockHistory)
    }
  }

  const makeCall = async () => {
    if (!phoneNumber.trim()) {
      toast.error("Please enter a phone number")
      return
    }

    if (!isConnected) {
      toast.error("Voice calling not initialized. Please refresh the page.")
      return
    }

    if (balance < 1) {
      toast.error("Insufficient balance to make a call")
      return
    }

    try {
      setCallStatus("connecting")
      toast.info("Connecting call...")

      // Make API call to log the call attempt
      await fetch("/api/calling/make-call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber,
        }),
      })

      // Make the actual browser call
      await twilioVoiceBrowser.makeCall(phoneNumber)

      // The actual connection will be handled by the device event listeners
    } catch (error) {
      console.error("Error making call:", error)
      setCallStatus("idle")
      toast.error("Failed to make call. Please check your microphone permissions and try again.")
    }
  }

  const endCall = async () => {
    try {
      console.log("Attempting to end call, current state:", { isCallActive, callStatus })
      
      // First update UI state immediately to show the call is ending
      setCallStatus("ending")
      
      // Call the Twilio hangup function
      await twilioVoiceBrowser.hangupCall()
      
      // Reset call state immediately in case device events don't fire
      setTimeout(() => {
        setIsCallActive(false)
        setCallStatus("idle")
        setIsMuted(false)
        setCallDuration(0)
        setCallCost(0)
        console.log("Call state reset after timeout")
      }, 1000)
      
      toast.success("Call ended successfully")
    } catch (error) {
      console.error("Error ending call:", error)
      
      // Force reset state even if there's an error
      setIsCallActive(false)
      setCallStatus("idle")
      setIsMuted(false)
      setCallDuration(0)
      setCallCost(0)
      
      toast.error("Call ended (forced reset)")
    }
  }

  const toggleMute = async () => {
    try {
      const newMutedState = !isMuted
      await twilioVoiceBrowser.muteCall(newMutedState)
      setIsMuted(newMutedState)
      toast.info(newMutedState ? "Microphone muted" : "Microphone unmuted")
    } catch (error) {
      console.error("Error toggling mute:", error)
      toast.error("Failed to toggle mute")
    }
  }

  const handleVolumeChange = async (newVolume: number[]) => {
    try {
      setVolume(newVolume)
      await twilioVoiceBrowser.setVolume(newVolume[0])
    } catch (error) {
      console.error("Error setting volume:", error)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const formatPhoneNumber = (number: string) => {
    const cleaned = number.replace(/\D/g, "")

    // For Indian numbers
    if (cleaned.startsWith("91") && cleaned.length === 12) {
      const phoneDigits = cleaned.slice(2)
      return `+91 ${phoneDigits.slice(0, 5)} ${phoneDigits.slice(5)}`
    }

    if (cleaned.length === 10) {
      return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`
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
    if (!isCallActive) {
      setPhoneNumber((prev) => prev + digit)
    }
  }

  const clearNumber = () => {
    if (!isCallActive) {
      setPhoneNumber("")
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Browser Voice Calling</h1>
          <p className="text-muted-foreground">Make calls directly from your browser - no app download needed</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {isConnected ? <Wifi className="h-4 w-4 text-green-600" /> : <WifiOff className="h-4 w-4 text-red-600" />}
            <span className={`text-sm ${isConnected ? "text-green-600" : "text-red-600"}`}>
              {isInitializing ? "Initializing..." : isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Account Balance</p>
            <p className="text-2xl font-bold text-green-600">${balance.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dialer">Browser Dialer</TabsTrigger>
          <TabsTrigger value="history">Call History</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="dialer" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Dialer Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Phone className="h-5 w-5" />
                  <span>Click-to-Call Dialer</span>
                </CardTitle>
                <CardDescription>Enter Indian mobile number (automatic +91 prefix)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Mobile Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="9876543210"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                    disabled={isCallActive || !isConnected}
                    className="text-lg text-center"
                    maxLength={10}
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Will call: {phoneNumber ? formatPhoneNumber(phoneNumber) : "+91 XXXXX XXXXX"}
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
                        disabled={isCallActive || !isConnected}
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
                    disabled={isCallActive || !isConnected}
                    className="flex-1 bg-transparent"
                  >
                    Clear
                  </Button>
                  <Button
                    onClick={phoneNumber.slice(0, -1) ? () => setPhoneNumber(phoneNumber.slice(0, -1)) : undefined}
                    variant="outline"
                    disabled={isCallActive || !phoneNumber || !isConnected}
                    className="flex-1"
                  >
                    ⌫
                  </Button>
                </div>

                <div className="flex space-x-2">
                  {!isCallActive && callStatus !== "ending" ? (
                    <Button
                      onClick={makeCall}
                      className="flex-1"
                      size="lg"
                      disabled={!isConnected || isInitializing || callStatus === "connecting" || callStatus === "ending"}
                    >
                      <PhoneCall className="mr-2 h-4 w-4" />
                      {callStatus === "connecting" ? "Connecting..." : "Call Now"}
                    </Button>
                  ) : (
                    <Button 
                      onClick={endCall} 
                      variant="destructive" 
                      className="flex-1" 
                      size="lg"
                      disabled={callStatus === "ending"}
                    >
                      <PhoneOff className="mr-2 h-4 w-4" />
                      {callStatus === "ending" ? "Ending..." : "End Call"}
                    </Button>
                  )}
                </div>

                {!isConnected && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> Voice calling requires microphone access. Please allow microphone
                      permission when prompted.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Call Controls Card */}
            <Card>
              <CardHeader>
                <CardTitle>Live Call Controls</CardTitle>
                <CardDescription>
                  {isCallActive ? `Active call - ${formatDuration(callDuration)}` : "No active call"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isCallActive && (
                  <>
                    <div className="text-center space-y-2">
                      <div className="text-2xl font-bold">{formatPhoneNumber(phoneNumber)}</div>
                      <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{formatDuration(callDuration)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <DollarSign className="h-4 w-4" />
                          <span>${callCost.toFixed(2)}</span>
                        </div>
                      </div>
                      <Badge variant="default" className="bg-green-600">
                        🔴 LIVE - Browser Call
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Button onClick={toggleMute} variant={isMuted ? "destructive" : "outline"} size="lg">
                        {isMuted ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
                        {isMuted ? "Unmute" : "Mute"}
                      </Button>

                      <Button variant="outline" size="lg" disabled>
                        <Square className="mr-2 h-4 w-4" />
                        Recording
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center space-x-2">
                        {volume[0] > 0 ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                        <span>Call Volume: {volume[0]}%</span>
                      </Label>
                      <Slider value={volume} onValueChange={handleVolumeChange} max={100} step={1} className="w-full" />
                    </div>
                  </>
                )}

                {!isCallActive && (
                  <div className="text-center text-muted-foreground py-8">
                    <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No active call</p>
                    <p className="text-sm">Enter a number and press "Call Now" to start</p>
                    <p className="text-xs mt-2 text-blue-600">
                      ✨ Calls work directly through your browser microphone & speakers
                    </p>
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
              <CardDescription>View your recent browser calls and listen to recordings</CardDescription>
            </CardHeader>
            <CardContent>
              {callHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <PhoneCall className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No call history yet</p>
                  <p className="text-sm">Your browser calls will appear here</p>
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
                            <p className="font-medium text-lg">{formatPhoneNumber(call.phoneNumber)}</p>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <span className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{formatDuration(call.duration)}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <DollarSign className="h-3 w-3" />
                                <span>${call.cost.toFixed(2)}</span>
                              </span>
                              <span>{new Date(call.timestamp).toLocaleString()}</span>
                              {call.type && (
                                <Badge variant="outline" className="text-xs">
                                  {call.type}
                                </Badge>
                              )}
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
              <CardTitle>Browser Calling Settings</CardTitle>
              <CardDescription>Configure your browser-based calling preferences</CardDescription>
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
                <Label>Call Rate (India)</Label>
                <p className="text-sm text-muted-foreground">$0.05 per minute to Indian mobile numbers</p>
              </div>

              <div className="space-y-2">
                <Label>Current Balance</Label>
                <p className="text-2xl font-bold text-green-600">${balance.toFixed(2)}</p>
                <Button variant="outline" size="sm">
                  Add Funds
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Browser Requirements</Label>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>✅ Chrome, Firefox, Safari, Edge (latest versions)</p>
                  <p>✅ Microphone access required</p>
                  <p>✅ HTTPS connection (secure)</p>
                  <p>✅ No app download needed</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Connection Status</Label>
                <div className="flex items-center space-x-2">
                  {isConnected ? (
                    <>
                      <Wifi className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600">Connected - Ready to make calls</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-4 w-4 text-red-600" />
                      <span className="text-sm text-red-600">Disconnected - Please refresh page</span>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Environment Variables Required</Label>
                <div className="text-xs text-muted-foreground space-y-1 bg-gray-50 p-3 rounded">
                  <p>TWILIO_ACCOUNT_SID=your_account_sid</p>
                  <p>TWILIO_API_KEY=your_api_key</p>
                  <p>TWILIO_API_SECRET=your_api_secret</p>
                  <p>TWILIO_TWIML_APP_SID=your_twiml_app_sid</p>
                  <p>TWILIO_PHONE_NUMBER=your_twilio_number</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
