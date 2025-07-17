"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Phone, PhoneCall, PhoneOff, Mic, MicOff, Volume2, History, AlertCircle } from "lucide-react"
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
  const [connectionError, setConnectionError] = useState<string>("")
  const [activeConnection, setActiveConnection] = useState<any>(null)
  const deviceRef = useRef<any>(null)

  // Initialize Twilio Device
  useEffect(() => {
    const initializeTwilio = async () => {
      try {
        console.log("Initializing Twilio Voice SDK...")

        // Get access token from server
        const response = await fetch("/api/calling/token")
        const data = await response.json()

        if (!data.success) {
          throw new Error(data.error || "Failed to get access token")
        }

        console.log("Access token received, initializing device...")
        setToken(data.token)

        // Load Twilio Voice SDK from CDN
        if (!window.Twilio) {
          await loadTwilioSDK()
        }

        // Create device instance
        const newDevice = new window.Twilio.Device(data.token, {
          logLevel: 1,
          answerOnBridge: true,
          fakeLocalDTMF: true,
          enableRingingState: true,
        })

        // Set up event listeners
        newDevice.on("ready", () => {
          console.log("Twilio Device Ready")
          setIsConnected(true)
          setConnectionError("")
          toast.success("Voice calling ready! You can now make calls.")
        })

        newDevice.on("error", (error: any) => {
          console.error("Twilio Device Error:", error)
          setConnectionError(error.message)
          setIsConnected(false)
          toast.error(`Device Error: ${error.message}`)
        })

        newDevice.on("incoming", (conn: any) => {
          console.log("Incoming call from:", conn.parameters.From)
          toast.info(`Incoming call from ${conn.parameters.From}`)
        })

        newDevice.on("connect", (conn: any) => {
          console.log("Call connected:", conn)
          setIsInCall(true)
          setActiveConnection(conn)
          toast.success("Call connected!")
        })

        newDevice.on("disconnect", (conn: any) => {
          console.log("Call disconnected:", conn)
          setIsInCall(false)
          setIsMuted(false)
          setActiveConnection(null)
          toast.info("Call ended")
          fetchCallHistory()
        })

        newDevice.on("cancel", (conn: any) => {
          console.log("Call cancelled:", conn)
          setIsInCall(false)
          setActiveConnection(null)
          toast.info("Call cancelled")
        })

        // Register device
        console.log("Registering device...")
        setDevice(newDevice)
        deviceRef.current = newDevice
      } catch (error) {
        console.error("Failed to initialize Twilio:", error)
        setConnectionError(error.message)
        setIsConnected(false)
        toast.error(`Failed to initialize calling: ${error.message}`)
      }
    }

    const loadTwilioSDK = (): Promise<void> => {
      return new Promise((resolve, reject) => {
        const script = document.createElement("script")
        script.src = "https://sdk.twilio.com/js/voice/releases/2.11.0/twilio.min.js"
        script.crossOrigin = "anonymous"
        script.onload = () => {
          console.log("Twilio SDK loaded successfully")
          resolve()
        }
        script.onerror = () => {
          console.error("Failed to load Twilio SDK")
          reject(new Error("Failed to load Twilio SDK"))
        }
        document.head.appendChild(script)
      })
    }

    initializeTwilio()
    fetchCallHistory()

    // Cleanup on unmount
    return () => {
      if (deviceRef.current) {
        try {
          deviceRef.current.destroy()
        } catch (error) {
          console.error("Error destroying device:", error)
        }
      }
    }
  }, [])

  const fetchCallHistory = async () => {
    try {
      const response = await fetch("/api/calling/history")
      const data = await response.json()

      if (data.success) {
        setCallHistory(data.calls)
      } else {
        console.error("Failed to fetch call history:", data.error)
      }
    } catch (error) {
      console.error("Failed to fetch call history:", error)
    }
  }

  const makeCall = async () => {
    if (!device) {
      toast.error("Voice service not initialized. Please refresh the page.")
      return
    }

    if (!phoneNumber.trim()) {
      toast.error("Please enter a phone number")
      return
    }

    if (!isConnected) {
      toast.error("Voice service not connected. Please check your internet connection.")
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
        if (number.startsWith("+")) {
          return number
        }
        return `+91${cleaned}`
      }

      const formattedNumber = formatPhoneNumber(phoneNumber)
      console.log(`Making call to: ${formattedNumber}`)

      // Store call record first
      const callResponse = await fetch("/api/calling/make-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: formattedNumber,
          message: "Browser call initiated",
        }),
      })

      const callData = await callResponse.json()
      if (!callData.success) {
        throw new Error(callData.error)
      }

      // Make call through Twilio Device
      console.log("Connecting call through Twilio Device...")
      const connection = await device.connect({
        params: {
          To: formattedNumber,
        },
      })

      console.log("Call connection initiated:", connection)
      toast.success(`Calling ${formattedNumber}...`)
    } catch (error) {
      console.error("Call failed:", error)
      toast.error(`Call failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const hangUp = () => {
    try {
      if (activeConnection) {
        console.log("Hanging up active connection...")
        activeConnection.disconnect()
      } else if (device) {
        console.log("Disconnecting all calls...")
        device.disconnectAll()
      }

      setIsInCall(false)
      setIsMuted(false)
      setActiveConnection(null)
      toast.info("Call ended")
    } catch (error) {
      console.error("Error hanging up:", error)
      toast.error("Error ending call")
    }
  }

  const toggleMute = () => {
    try {
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
      } else {
        toast.error("No active call to mute/unmute")
      }
    } catch (error) {
      console.error("Error toggling mute:", error)
      toast.error("Error toggling mute")
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

  const formatPhoneDisplay = (number: string) => {
    if (number.startsWith("+91")) {
      const digits = number.slice(3)
      return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`
    }
    return number
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Voice Calling</h1>
          <p className="text-muted-foreground">Make and manage voice calls directly from your browser</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={isConnected ? "default" : "secondary"}>{isConnected ? "Connected" : "Disconnected"}</Badge>
          {isInCall && (
            <Badge variant="destructive" className="animate-pulse">
              🔴 In Call
            </Badge>
          )}
        </div>
      </div>

      {connectionError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <h3 className="font-medium text-red-800">Connection Error</h3>
              <p className="text-sm text-red-700">{connectionError}</p>
              <p className="text-xs text-red-600 mt-1">Please check your Twilio credentials and refresh the page.</p>
            </div>
          </div>
        </div>
      )}

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
                    placeholder="9876543210 or +919876543210"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={isInCall}
                    className="text-lg"
                  />
                  <p className="text-xs text-muted-foreground">
                    {phoneNumber
                      ? `Will call: ${formatPhoneDisplay(phoneNumber.startsWith("+") ? phoneNumber : `+91${phoneNumber.replace(/\D/g, "")}`)}`
                      : "Enter Indian mobile number (10 digits) or international format"}
                  </p>
                </div>

                <div className="flex space-x-2">
                  {!isInCall ? (
                    <Button
                      onClick={makeCall}
                      disabled={loading || !isConnected || !phoneNumber.trim()}
                      className="flex-1"
                      size="lg"
                    >
                      <PhoneCall className="h-4 w-4 mr-2" />
                      {loading ? "Calling..." : "Call Now"}
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={toggleMute}
                        variant={isMuted ? "destructive" : "outline"}
                        size="lg"
                        className="flex-1"
                      >
                        {isMuted ? <MicOff className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
                        {isMuted ? "Unmute" : "Mute"}
                      </Button>
                      <Button onClick={hangUp} variant="destructive" className="flex-1" size="lg">
                        <PhoneOff className="h-4 w-4 mr-2" />
                        Hang Up
                      </Button>
                    </>
                  )}
                </div>

                {!isConnected && !connectionError && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">⚠️ Voice service is connecting... Please wait.</p>
                  </div>
                )}

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    💡 <strong>Requirements:</strong> Microphone access, HTTPS connection, modern browser
                  </p>
                </div>
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
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Audio Status:</span>
                        <Badge variant={isMuted ? "destructive" : "default"}>{isMuted ? "Muted" : "Unmuted"}</Badge>
                      </div>

                      <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-lg font-semibold text-green-800">
                          📞 Calling: {formatPhoneDisplay(phoneNumber)}
                        </p>
                        <p className="text-sm text-green-600">Call is active</p>
                      </div>
                    </>
                  )}

                  <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                      💡 <strong>Tip:</strong> Make sure your microphone is enabled and working properly. The call will
                      connect through your browser speakers.
                    </p>
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>
                      <strong>Supported formats:</strong>
                    </p>
                    <p>• 10 digits: 9876543210</p>
                    <p>• With country code: +919876543210</p>
                    <p>• International: +1234567890</p>
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
                    <div
                      key={call._id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(call.status)}`} />
                        <div>
                          <p className="font-medium">{formatPhoneDisplay(call.phoneNumber)}</p>
                          <p className="text-sm text-muted-foreground">{new Date(call.timestamp).toLocaleString()}</p>
                          {call.type && (
                            <Badge variant="outline" className="text-xs mt-1">
                              {call.type}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="mb-1">
                          {call.status}
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          {call.duration > 0 ? formatDuration(call.duration) : "0:00"}
                        </p>
                        {call.cost > 0 && <p className="text-xs text-muted-foreground">${call.cost.toFixed(2)}</p>}
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
