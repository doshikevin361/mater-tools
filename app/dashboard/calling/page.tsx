"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Phone, PhoneCall, PhoneOff, Mic, MicOff, Volume2, History } from "lucide-react"
import { toast } from "sonner"

interface CallHistory {
  _id: string
  phoneNumber: string
  status: string
  timestamp: string
  duration: number
  cost: number
  type: string
  callSid?: string
}

export default function CallingPage() {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [isInCall, setIsInCall] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [callHistory, setCallHistory] = useState<CallHistory[]>([])
  const [loading, setLoading] = useState(false)
  const [device, setDevice] = useState<any>(null)
  const [token, setToken] = useState<string>("")
  const deviceRef = useRef<any>(null)

  // Initialize Twilio Device
  useEffect(() => {
    const initializeTwilio = async () => {
      try {
        // Get access token from server
        const response = await fetch("/api/calling/token")
        const data = await response.json()

        if (data.success) {
          setToken(data.token)

          // Import Twilio Device SDK
          const { Device } = await import("@twilio/voice-sdk")

          // Create device instance
          const newDevice = new Device(data.token, {
            logLevel: 1,
            answerOnBridge: true,
          })

          // Set up event listeners
          newDevice.on("ready", () => {
            console.log("Twilio Device Ready")
            setIsConnected(true)
            toast.success("Voice calling ready!")
          })

          newDevice.on("error", (error: any) => {
            console.error("Twilio Device Error:", error)
            toast.error(`Device Error: ${error.message}`)
          })

          newDevice.on("incoming", (conn: any) => {
            console.log("Incoming call from:", conn.parameters.From)
            toast.info(`Incoming call from ${conn.parameters.From}`)
          })

          newDevice.on("connect", (conn: any) => {
            console.log("Call connected")
            setIsInCall(true)
            toast.success("Call connected!")
          })

          newDevice.on("disconnect", (conn: any) => {
            console.log("Call disconnected")
            setIsInCall(false)
            setIsMuted(false)
            toast.info("Call ended")
            fetchCallHistory()
          })

          // Register device
          await newDevice.register()
          setDevice(newDevice)
          deviceRef.current = newDevice
        }
      } catch (error) {
        console.error("Failed to initialize Twilio:", error)
        toast.error("Failed to initialize calling service")
      }
    }

    initializeTwilio()
    fetchCallHistory()

    // Cleanup on unmount
    return () => {
      if (deviceRef.current) {
        deviceRef.current.destroy()
      }
    }
  }, [])

  const fetchCallHistory = async () => {
    try {
      const response = await fetch("/api/calling/history")
      const data = await response.json()

      if (data.success) {
        setCallHistory(data.calls)
      }
    } catch (error) {
      console.error("Failed to fetch call history:", error)
    }
  }

  const makeCall = async () => {
    if (!device || !phoneNumber.trim()) {
      toast.error("Please enter a phone number")
      return
    }

    setLoading(true)

    try {
      // Format phone number for Indian numbers
      const formatPhoneNumber = (number: string) => {
        const cleaned = number.replace(/\D/g, "")
        if (cleaned.length === 10) {
          return `+91${cleaned}`
        }
        if (cleaned.startsWith("91") && cleaned.length === 12) {
          return `+${cleaned}`
        }
        return `+91${cleaned}`
      }

      const formattedNumber = formatPhoneNumber(phoneNumber)

      // Make call through Twilio Device
      const connection = await device.connect({
        params: {
          To: formattedNumber,
        },
      })

      console.log("Call initiated:", connection)
      toast.success(`Calling ${formattedNumber}...`)

      // Store call record
      await fetch("/api/calling/make-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: formattedNumber,
          message: "Browser call initiated",
        }),
      })
    } catch (error) {
      console.error("Call failed:", error)
      toast.error(`Call failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const hangUp = () => {
    if (device && isInCall) {
      device.disconnectAll()
      setIsInCall(false)
      setIsMuted(false)
      toast.info("Call ended")
    }
  }

  const toggleMute = () => {
    if (device && isInCall) {
      const activeConnection = device.activeConnection
      if (activeConnection) {
        if (isMuted) {
          activeConnection.mute(false)
          setIsMuted(false)
          toast.info("Unmuted")
        } else {
          activeConnection.mute(true)
          setIsMuted(true)
          toast.info("Muted")
        }
      }
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500"
      case "busy":
        return "bg-yellow-500"
      case "failed":
        return "bg-red-500"
      case "no-answer":
        return "bg-gray-500"
      default:
        return "bg-blue-500"
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Voice Calling</h1>
          <p className="text-muted-foreground">Make and manage voice calls</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={isConnected ? "default" : "secondary"}>{isConnected ? "Connected" : "Disconnected"}</Badge>
          {isInCall && (
            <Badge variant="destructive" className="animate-pulse">
              In Call
            </Badge>
          )}
        </div>
      </div>

      <Tabs defaultValue="dialer" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dialer" className="flex items-center space-x-2">
            <Phone className="h-4 w-4" />
            <span>Dialer</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center space-x-2">
            <History className="h-4 w-4" />
            <span>Call History</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dialer">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Dialer Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PhoneCall className="h-5 w-5" />
                  <span>Make a Call</span>
                </CardTitle>
                <CardDescription>Enter a phone number to start a voice call</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone Number</label>
                  <Input
                    type="tel"
                    placeholder="+91 9876543210"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={isInCall}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter Indian mobile number (10 digits) or international format
                  </p>
                </div>

                <div className="flex space-x-2">
                  {!isInCall ? (
                    <Button
                      onClick={makeCall}
                      disabled={loading || !isConnected || !phoneNumber.trim()}
                      className="flex-1"
                    >
                      <PhoneCall className="h-4 w-4 mr-2" />
                      {loading ? "Calling..." : "Call"}
                    </Button>
                  ) : (
                    <>
                      <Button onClick={toggleMute} variant={isMuted ? "destructive" : "outline"} size="sm">
                        {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      </Button>
                      <Button onClick={hangUp} variant="destructive" className="flex-1">
                        <PhoneOff className="h-4 w-4 mr-2" />
                        Hang Up
                      </Button>
                    </>
                  )}
                </div>

                {!isConnected && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">⚠️ Voice service is connecting... Please wait.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Call Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Volume2 className="h-5 w-5" />
                  <span>Call Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Connection Status:</span>
                    <Badge variant={isConnected ? "default" : "secondary"}>
                      {isConnected ? "Ready" : "Connecting..."}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Call Status:</span>
                    <Badge variant={isInCall ? "destructive" : "outline"}>
                      {isInCall ? "Active Call" : "No Active Call"}
                    </Badge>
                  </div>

                  {isInCall && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Audio Status:</span>
                      <Badge variant={isMuted ? "destructive" : "default"}>{isMuted ? "Muted" : "Unmuted"}</Badge>
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                      💡 Tip: Make sure your microphone is enabled and working properly
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <History className="h-5 w-5" />
                <span>Call History</span>
              </CardTitle>
              <CardDescription>Recent voice calls and their status</CardDescription>
            </CardHeader>
            <CardContent>
              {callHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Phone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No call history yet</p>
                  <p className="text-sm text-muted-foreground">Make your first call to see history here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {callHistory.map((call) => (
                    <div key={call._id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(call.status)}`} />
                        <div>
                          <p className="font-medium">{call.phoneNumber}</p>
                          <p className="text-sm text-muted-foreground">{new Date(call.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="mb-1">
                          {call.status}
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          {call.duration > 0 ? formatDuration(call.duration) : "0:00"}
                        </p>
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
