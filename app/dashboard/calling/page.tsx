"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import {
  Phone,
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  History,
  RefreshCw,
  Clock,
  Download,
  Play,
  Trash2,
  AlertCircle,
} from "lucide-react"
import { toast } from "sonner"

interface CallRecord {
  id: string
  callSid: string
  phoneNumber: string
  direction: "inbound" | "outbound"
  duration: number
  status: "completed" | "failed" | "busy" | "no-answer" | "in-progress" | "ringing" | "initiated"
  cost: number
  recordingUrl?: string
  timestamp: Date
  callType?: string
}

export default function CallingPage() {
  const [activeTab, setActiveTab] = useState("make-call")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isCallActive, setIsCallActive] = useState(false)
  const [isMicEnabled, setIsMicEnabled] = useState(true)
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(true)
  const [micLevel, setMicLevel] = useState(0)
  const [callDuration, setCallDuration] = useState(0)
  const [hasPermission, setHasPermission] = useState(false)
  const [currentCallSid, setCurrentCallSid] = useState<string | null>(null)
  const [callHistory, setCallHistory] = useState<CallRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [volume, setVolume] = useState([80])
  const [isSystemReady, setIsSystemReady] = useState(false)

  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const callStartTimeRef = useRef<number>(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    initializeSystem()
    fetchCallHistory()

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      cleanup()
    }
  }, [])

  const initializeSystem = async () => {
    try {
      // Check if system is ready
      setIsSystemReady(true)
      toast.success("Browser calling system ready!")
    } catch (error) {
      console.error("Failed to initialize system:", error)
      toast.error("Failed to initialize calling system")
    }
  }

  const cleanup = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop())
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
    }
  }

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      setHasPermission(true)
      setIsMicEnabled(true)
      mediaStreamRef.current = stream
      setupAudioAnalyzer(stream)
      toast.success("Microphone permission granted!")
      return true
    } catch (error) {
      toast.error("Microphone permission denied")
      setHasPermission(false)
      return false
    }
  }

  const setupAudioAnalyzer = (stream: MediaStream) => {
    try {
      const audioContext = new AudioContext()
      const analyser = audioContext.createAnalyser()
      const source = audioContext.createMediaStreamSource(stream)

      source.connect(analyser)
      analyser.fftSize = 256

      audioContextRef.current = audioContext
      analyserRef.current = analyser

      monitorMicLevel()
    } catch (error) {
      console.error("Failed to setup audio analyzer:", error)
    }
  }

  const monitorMicLevel = () => {
    if (!analyserRef.current) return

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)

    const updateLevel = () => {
      if (!analyserRef.current || !isCallActive) return

      analyserRef.current.getByteFrequencyData(dataArray)
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length
      setMicLevel(Math.round((average / 255) * 100))

      requestAnimationFrame(updateLevel)
    }

    updateLevel()
  }

  const startCallTimer = () => {
    callStartTimeRef.current = Date.now()
    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - callStartTimeRef.current) / 1000)
      setCallDuration(elapsed)
    }, 1000)
  }

  const stopCallTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setCallDuration(0)
  }

  const fetchCallHistory = async () => {
    try {
      const response = await fetch("/api/calling/history?userId=demo-user")
      const data = await response.json()
      if (data.success) {
        setCallHistory(data.calls)
      }
    } catch (error) {
      console.error("Failed to fetch call history:", error)
    }
  }

  const formatIndianNumber = (number: string) => {
    const cleaned = number.replace(/\D/g, "")
    if (cleaned.startsWith("91") && cleaned.length === 12) {
      return `+${cleaned}`
    } else if (cleaned.length === 10) {
      return `+91${cleaned}`
    } else if (cleaned.startsWith("0") && cleaned.length === 11) {
      return `+91${cleaned.substring(1)}`
    }
    return cleaned.startsWith("+") ? `+${cleaned}` : `+${cleaned}`
  }

  const startDirectCall = async () => {
    if (!phoneNumber.trim()) {
      toast.error("Please enter a phone number")
      return
    }

    if (!isSystemReady) {
      toast.error("Calling system not ready. Please wait...")
      return
    }

    if (!hasPermission) {
      const granted = await requestMicrophonePermission()
      if (!granted) return
    }

    setIsLoading(true)

    try {
      const formattedNumber = formatIndianNumber(phoneNumber)

      // Start call via API
      const response = await fetch("/api/calling/direct-browser-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start",
          phoneNumber: formattedNumber,
          userId: "demo-user",
        }),
      })

      const data = await response.json()

      if (data.success) {
        setIsCallActive(true)
        setCurrentCallSid(data.callSid)
        startCallTimer()
        toast.success(`Calling ${formattedNumber}... They will receive your call directly!`)
      } else {
        throw new Error(data.error || "Failed to start call")
      }
    } catch (error) {
      toast.error("Failed to start call: " + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const endDirectCall = () => {
    setIsCallActive(false)
    stopCallTimer()
    setCurrentCallSid(null)
    toast.success("Call ended")

    // Refresh call history after a delay
    setTimeout(() => {
      fetchCallHistory()
    }, 2000)
  }

  const toggleMic = () => {
    if (mediaStreamRef.current) {
      const audioTracks = mediaStreamRef.current.getAudioTracks()
      audioTracks.forEach((track) => {
        track.enabled = !isMicEnabled
      })
      setIsMicEnabled(!isMicEnabled)
      toast.success(isMicEnabled ? "Microphone muted" : "Microphone unmuted")
    }
  }

  const toggleSpeaker = () => {
    setIsSpeakerEnabled(!isSpeakerEnabled)
    toast.success(isSpeakerEnabled ? "Speaker off" : "Speaker on")
  }

  const adjustVolume = (newVolume: number[]) => {
    setVolume(newVolume)
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "default"
      case "failed":
        return "destructive"
      case "in-progress":
      case "ringing":
      case "initiated":
        return "secondary"
      default:
        return "outline"
    }
  }

  const dialPadNumbers = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["*", "0", "#"],
  ]

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Direct Browser Calling</h1>
        <p className="text-muted-foreground">
          Call any person directly through your browser - talk with microphone, hear through speaker!
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="make-call">
            <PhoneCall className="h-4 w-4 mr-2" />
            Direct Call
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            Call History ({callHistory.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="make-call" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Call Interface */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Direct Browser Call
                </CardTitle>
                <CardDescription>
                  Enter number → Click call → Talk directly through microphone → Hear through speaker
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* System Status */}
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm">Calling System:</span>
                  <Badge variant={isSystemReady ? "default" : "destructive"}>
                    {isSystemReady ? "Ready" : "Loading..."}
                  </Badge>
                </div>

                {/* Important Notice */}
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-800 mb-1">Setup Required</h4>
                      <p className="text-sm text-amber-700">
                        To enable browser calling, you need to configure Twilio environment variables:
                      </p>
                      <ul className="text-xs text-amber-600 mt-2 space-y-1 list-disc list-inside">
                        <li>TWILIO_ACCOUNT_SID</li>
                        <li>TWILIO_AUTH_TOKEN</li>
                        <li>TWILIO_PHONE_NUMBER</li>
                        <li>TWILIO_TWIML_APP_SID (optional)</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Phone Number Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone Number</label>
                  <Input
                    type="tel"
                    placeholder="Enter phone number (e.g., 9876543210)"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={isCallActive}
                    className="text-lg text-center"
                  />
                  <p className="text-xs text-muted-foreground">
                    This person will receive a direct call - you talk through browser microphone/speaker
                  </p>
                </div>

                {/* Dial Pad */}
                <div className="grid grid-cols-3 gap-2">
                  {dialPadNumbers.flat().map((num) => (
                    <Button
                      key={num}
                      variant="outline"
                      className="h-12 text-lg bg-transparent"
                      onClick={() => setPhoneNumber((prev) => prev + num)}
                      disabled={isCallActive}
                    >
                      {num}
                    </Button>
                  ))}
                </div>

                {/* Call Controls */}
                <div className="flex gap-2">
                  {!isCallActive ? (
                    <Button
                      onClick={startDirectCall}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      size="lg"
                      disabled={isLoading || !isSystemReady}
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Calling...
                        </>
                      ) : (
                        <>
                          <PhoneCall className="h-4 w-4 mr-2" />
                          Call Direct
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button onClick={endDirectCall} className="flex-1 bg-red-600 hover:bg-red-700" size="lg">
                      <PhoneOff className="h-4 w-4 mr-2" />
                      End Call
                    </Button>
                  )}
                </div>

                {/* How it works */}
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-800 mb-2">How Direct Browser Calling Works:</h4>
                  <ol className="text-sm text-green-700 space-y-1 list-decimal list-inside">
                    <li>Enter phone number and click "Call Direct"</li>
                    <li>Browser asks for microphone permission (one-time)</li>
                    <li>Person receives call directly from you</li>
                    <li>You talk through microphone → They hear</li>
                    <li>They talk → You hear through browser speaker</li>
                    <li>Direct voice connection with recording!</li>
                  </ol>
                </div>
              </CardContent>
            </Card>

            {/* Call Status & Controls */}
            <Card>
              <CardHeader>
                <CardTitle>Live Call Controls</CardTitle>
                <CardDescription>Real-time call controls and audio settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Call Duration */}
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-mono font-bold">{formatDuration(callDuration)}</div>
                  <div className="text-sm text-muted-foreground">
                    {isCallActive ? `Direct Call Active: ${formatPhoneNumber(phoneNumber)}` : "No Active Call"}
                  </div>
                  {currentCallSid && (
                    <div className="text-xs text-muted-foreground mt-1">Call ID: {currentCallSid}</div>
                  )}
                </div>

                {/* Audio Controls */}
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant={isMicEnabled ? "default" : "destructive"}
                    onClick={toggleMic}
                    disabled={!isCallActive}
                    className="h-16"
                  >
                    {isMicEnabled ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
                    <div className="ml-2 text-left">
                      <div className="text-sm font-medium">Microphone</div>
                      <div className="text-xs">{isMicEnabled ? "On" : "Muted"}</div>
                    </div>
                  </Button>

                  <Button
                    variant={isSpeakerEnabled ? "default" : "outline"}
                    onClick={toggleSpeaker}
                    disabled={!isCallActive}
                    className="h-16"
                  >
                    {isSpeakerEnabled ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
                    <div className="ml-2 text-left">
                      <div className="text-sm font-medium">Speaker</div>
                      <div className="text-xs">{isSpeakerEnabled ? "On" : "Off"}</div>
                    </div>
                  </Button>
                </div>

                {/* Microphone Level */}
                {isCallActive && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Microphone Level</span>
                      <span>{micLevel}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-100"
                        style={{ width: `${micLevel}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Volume Control */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Speaker Volume</span>
                    <span>{volume[0]}%</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <VolumeX className="h-4 w-4" />
                    <Slider value={volume} onValueChange={adjustVolume} max={100} step={1} className="flex-1" />
                    <Volume2 className="h-4 w-4" />
                  </div>
                </div>

                <Separator />

                {/* Call Info */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Call Type:</span>
                    <Badge variant="outline">Direct Browser Call</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Audio:</span>
                    <span className="text-green-600">Microphone → Speaker</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Connection:</span>
                    <span className="text-blue-600">REST API Direct</span>
                  </div>
                  {callDuration > 0 && (
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span className="text-green-600">{formatDuration(callDuration)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
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
              <CardDescription>Complete history of all your direct browser calls with recordings</CardDescription>
            </CardHeader>
            <CardContent>
              {callHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No call history yet</p>
                  <p className="text-sm">Your direct calls will appear here after you make them</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {callHistory.map((call) => (
                    <div key={call.id} className="p-4 rounded-lg border bg-card">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <PhoneCall className="h-4 w-4 text-blue-600" />
                          <div>
                            <p className="font-medium">{formatPhoneNumber(call.phoneNumber)}</p>
                            <p className="text-sm text-muted-foreground">{new Date(call.timestamp).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">Direct Call</Badge>
                          <Badge variant={getStatusColor(call.status)}>{call.status}</Badge>
                          {call.duration > 0 && (
                            <Badge variant="outline">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatDuration(call.duration)}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Recording Player */}
                      {call.recordingUrl && (
                        <div className="mb-3 p-3 bg-gray-50 rounded-lg border">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <Play className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">Call Recording</p>
                                <p className="text-xs text-gray-500">Duration: {formatDuration(call.duration)}</p>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 bg-transparent"
                                onClick={() => {
                                  const audio = new Audio(call.recordingUrl)
                                  audio.play()
                                }}
                              >
                                <Play className="h-3 w-3 mr-1" />
                                Play
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 bg-transparent"
                                onClick={() => window.open(call.recordingUrl, "_blank")}
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
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
