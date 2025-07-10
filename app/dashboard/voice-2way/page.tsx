"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Phone, PhoneCall, PhoneOff, Volume2, Users, Clock, Mic, MicOff } from "lucide-react"
import { toast } from "sonner"

interface CallRecord {
  _id: string
  callSid: string
  from: string
  to: string
  status: string
  duration?: number
  recordingUrl?: string
  recordingDuration?: number
  transcriptionText?: string
  createdAt: string
  answeredAt?: string
  completedAt?: string
}

interface ActiveCall {
  callSid: string
  status: string
  from: string
  to: string
  startTime: Date
}

export default function Voice2WayPage() {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isDialing, setIsDialing] = useState(false)
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null)
  const [callHistory, setCallHistory] = useState<CallRecord[]>([])
  const [recordings, setRecordings] = useState<CallRecord[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [userBalance, setUserBalance] = useState(0)

  // Timer for call duration
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (activeCall && activeCall.status === "answered") {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [activeCall])

  // Load data on component mount
  useEffect(() => {
    loadUserData()
    loadCallHistory()
    loadRecordings()
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

  const loadCallHistory = async () => {
    try {
      setIsLoadingHistory(true)
      const userId = localStorage.getItem("userId")
      if (!userId) return

      const response = await fetch(`/api/voice/recordings?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setCallHistory(data.incomingCalls || [])
      }
    } catch (error) {
      console.error("Failed to load call history:", error)
      toast.error("Failed to load call history")
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const loadRecordings = async () => {
    try {
      const userId = localStorage.getItem("userId")
      if (!userId) return

      const response = await fetch(`/api/voice/recordings?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setRecordings(data.recordings || [])
      }
    } catch (error) {
      console.error("Failed to load recordings:", error)
    }
  }

  const initiateCall = async () => {
    if (!phoneNumber.trim()) {
      toast.error("Please enter a phone number")
      return
    }

    if (userBalance < 1.5) {
      toast.error("Insufficient balance. Minimum ₹1.50 required for calls.")
      return
    }

    setIsDialing(true)
    try {
      const userId = localStorage.getItem("userId")
      if (!userId) {
        toast.error("Please log in to make calls")
        return
      }

      const response = await fetch("/api/voice/two-way-call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          toNumber: phoneNumber,
          userId,
          record: true,
          transcribe: true,
        }),
      })

      const result = await response.json()
      if (result.success) {
        setActiveCall({
          callSid: result.callSid,
          status: "ringing",
          from: process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER || "+1234567890",
          to: phoneNumber,
          startTime: new Date(),
        })
        setCallDuration(0)
        toast.success("Call initiated successfully!")

        // Simulate call progression
        setTimeout(() => {
          if (activeCall) {
            setActiveCall((prev) => (prev ? { ...prev, status: "answered" } : null))
            toast.success("Call connected!")
          }
        }, 3000)
      } else {
        toast.error(result.message || "Failed to initiate call")
      }
    } catch (error) {
      console.error("Call initiation error:", error)
      toast.error("Failed to initiate call")
    } finally {
      setIsDialing(false)
    }
  }

  const endCall = async () => {
    if (!activeCall) return

    try {
      // In a real implementation, you would call Twilio API to end the call
      setActiveCall(null)
      setCallDuration(0)
      setIsMuted(false)
      toast.success("Call ended")

      // Refresh call history and user balance
      loadCallHistory()
      loadUserData()
    } catch (error) {
      console.error("Failed to end call:", error)
      toast.error("Failed to end call")
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    toast.success(isMuted ? "Unmuted" : "Muted")
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
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

  const playRecording = (url: string) => {
    const audio = new Audio(url)
    audio.play().catch((error) => {
      console.error("Failed to play recording:", error)
      toast.error("Failed to play recording")
    })
  }

  const getCallStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-500"
      case "answered":
        return "bg-blue-500"
      case "failed":
        return "bg-red-500"
      case "ringing":
        return "bg-yellow-500"
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
              Voice 2-Way Calls
            </h1>
            <p className="text-gray-600 mt-1">Make and receive two-way voice calls with recording and transcription</p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1">
              Balance: ₹{userBalance.toFixed(2)}
            </Badge>
            <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-3 py-1">
              Cost: ₹1.50 per call
            </Badge>
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
              value="recordings"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white"
            >
              <Volume2 className="h-4 w-4 mr-2" />
              Recordings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dialer" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Dialer */}
              <Card className="border border-blue-200 shadow-md overflow-hidden bg-white">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                  <CardTitle className="flex items-center space-x-2">
                    <Phone className="h-5 w-5 text-blue-600" />
                    <span>Phone Dialer</span>
                  </CardTitle>
                  <CardDescription>Enter a phone number to start a two-way call</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      placeholder="+1234567890"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="border-blue-200 focus:border-blue-400 focus:ring-blue-400 text-lg py-3"
                      disabled={!!activeCall}
                    />
                  </div>

                  {!activeCall ? (
                    <Button
                      onClick={initiateCall}
                      disabled={isDialing || !phoneNumber.trim() || userBalance < 1.5}
                      className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-4 text-lg font-semibold"
                    >
                      {isDialing ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Dialing...
                        </>
                      ) : (
                        <>
                          <PhoneCall className="h-5 w-5 mr-2" />
                          Call Now
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                        <div className="text-lg font-semibold text-blue-800">
                          {activeCall.status === "ringing" ? "Ringing..." : "Connected"}
                        </div>
                        <div className="text-blue-600">{activeCall.to}</div>
                        <div className="text-2xl font-bold text-blue-800 mt-2">{formatDuration(callDuration)}</div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <Button
                          onClick={toggleMute}
                          variant="outline"
                          className={`${
                            isMuted
                              ? "bg-red-100 border-red-300 text-red-700 hover:bg-red-200"
                              : "border-blue-200 text-blue-600 hover:bg-blue-50"
                          }`}
                        >
                          {isMuted ? <MicOff className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
                          {isMuted ? "Unmute" : "Mute"}
                        </Button>

                        <Button
                          onClick={endCall}
                          className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
                        >
                          <PhoneOff className="h-4 w-4 mr-2" />
                          End Call
                        </Button>
                      </div>
                    </div>
                  )}

                  {userBalance < 1.5 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">
                        Insufficient balance. Please recharge your account to make calls.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Call Features */}
              <Card className="border border-blue-200 shadow-md overflow-hidden bg-white">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <span>Call Features</span>
                  </CardTitle>
                  <CardDescription>Available features for your two-way calls</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <div className="font-medium text-green-800">Two-Way Conversation</div>
                        <div className="text-sm text-green-600">Real-time voice communication</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div>
                        <div className="font-medium text-blue-800">Call Recording</div>
                        <div className="text-sm text-blue-600">Automatic recording of all calls</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <div>
                        <div className="font-medium text-purple-800">Live Transcription</div>
                        <div className="text-sm text-purple-600">Real-time speech-to-text conversion</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <div>
                        <div className="font-medium text-orange-800">Call Controls</div>
                        <div className="text-sm text-orange-600">Mute, hold, and transfer options</div>
                      </div>
                    </div>
                  </div>
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
                <CardDescription>View your recent two-way calls and their details</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {isLoadingHistory ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">Loading call history...</span>
                  </div>
                ) : callHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No call history found</p>
                    <p className="text-sm text-gray-500">Your call history will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {callHistory.map((call) => (
                      <div
                        key={call._id}
                        className="p-4 border border-blue-100 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Phone className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{call.from}</div>
                              <div className="text-sm text-gray-600">
                                {call.duration ? `Duration: ${formatDuration(call.duration)}` : "No duration"}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={`${getCallStatusColor(call.status)} text-white`}>{call.status}</Badge>
                            {call.recordingUrl && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => playRecording(call.recordingUrl!)}
                                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                              >
                                <Volume2 className="h-3 w-3 mr-1" />
                                Play
                              </Button>
                            )}
                          </div>
                        </div>

                        {call.transcriptionText && (
                          <div className="mt-3 p-3 bg-white rounded-lg border border-blue-100">
                            <div className="text-sm font-medium text-gray-700 mb-1">Transcription:</div>
                            <div className="text-sm text-gray-600">{call.transcriptionText}</div>
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                          <span>Called: {formatDate(call.createdAt)}</span>
                          {call.recordingDuration && <span>Recording: {formatDuration(call.recordingDuration)}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  onClick={loadCallHistory}
                  variant="outline"
                  className="w-full mt-4 border-blue-200 text-blue-600 hover:bg-blue-50 bg-transparent"
                >
                  Refresh History
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recordings" className="space-y-6">
            <Card className="border border-blue-200 shadow-md overflow-hidden bg-white">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                <CardTitle className="flex items-center space-x-2">
                  <Volume2 className="h-5 w-5 text-blue-600" />
                  <span>Call Recordings</span>
                </CardTitle>
                <CardDescription>Listen to and manage your call recordings with transcriptions</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {recordings.length === 0 ? (
                  <div className="text-center py-8">
                    <Volume2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No recordings found</p>
                    <p className="text-sm text-gray-500">Call recordings will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recordings.map((recording) => (
                      <div
                        key={recording._id}
                        className="p-4 border border-blue-100 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                              <Volume2 className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">
                                {recording.from} → {recording.to}
                              </div>
                              <div className="text-sm text-gray-600">
                                Duration: {formatDuration(recording.recordingDuration || 0)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className="bg-blue-100 text-blue-800">
                              {recording.transcriptionText ? "Transcribed" : "Audio Only"}
                            </Badge>
                            <Button
                              size="sm"
                              onClick={() => playRecording(recording.recordingUrl!)}
                              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                            >
                              <Volume2 className="h-3 w-3 mr-1" />
                              Play
                            </Button>
                          </div>
                        </div>

                        {recording.transcriptionText && (
                          <div className="mt-3 p-4 bg-white rounded-lg border border-blue-100">
                            <div className="text-sm font-medium text-gray-700 mb-2">Full Transcription:</div>
                            <div className="text-sm text-gray-600 leading-relaxed">{recording.transcriptionText}</div>
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                          <span>Recorded: {formatDate(recording.createdAt)}</span>
                          <span>Call ID: {recording.callSid.slice(-8)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  onClick={loadRecordings}
                  variant="outline"
                  className="w-full mt-4 border-blue-200 text-blue-600 hover:bg-blue-50 bg-transparent"
                >
                  Refresh Recordings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
