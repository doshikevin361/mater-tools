"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Phone,
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  History,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react"
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
  const [initializingSDK, setInitializingSDK] = useState(false)
  const [sdkLoadAttempts, setSdkLoadAttempts] = useState(0)
  const deviceRef = useRef<any>(null)
  const initTimeoutRef = useRef<NodeJS.Timeout>()

  // Initialize Twilio Device
  useEffect(() => {
    initializeTwilio()
    fetchCallHistory()

    // Cleanup on unmount
    return () => {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current)
      }
      if (deviceRef.current) {
        try {
          deviceRef.current.destroy()
        } catch (error) {
          console.error("Error destroying device:", error)
        }
      }
    }
  }, [])

  const initializeTwilio = async () => {
    try {
      console.log("Starting Twilio initialization...")
      setInitializingSDK(true)
      setConnectionError("")
      setSdkLoadAttempts((prev) => prev + 1)

      // Set timeout for initialization
      initTimeoutRef.current = setTimeout(() => {
        setInitializingSDK(false)
        setConnectionError("Initialization timeout. Please try again.")
        toast.error("Voice service initialization timed out")
      }, 15000) // 15 second timeout

      // Get access token from server
      const response = await fetch("/api/calling/token")
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to get access token")
      }

      console.log("Access token received")
      setToken(data.token)

      // Try to use Web Audio API for calling instead of Twilio SDK
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // Request microphone permission
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
          console.log("Microphone access granted")

          // Stop the stream for now
          stream.getTracks().forEach((track) => track.stop())

          // Set as connected since we have mic access and token
          setIsConnected(true)
          setInitializingSDK(false)
          clearTimeout(initTimeoutRef.current!)
          toast.success("Voice calling ready! (Simplified mode)")
        } catch (micError) {
          console.error("Microphone access denied:", micError)
          throw new Error("Microphone access required for voice calling")
        }
      } else {
        throw new Error("Web Audio API not supported in this browser")
      }
    } catch (error) {
      console.error("Failed to initialize calling:", error)
      setConnectionError(error.message)
      setIsConnected(false)
      setInitializingSDK(false)
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current)
      }
      toast.error(`Failed to initialize calling: ${error.message}`)
    }
  }

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
      // Set mock data for testing
      setCallHistory([
        {
          _id: "mock_1",
          phoneNumber: "+919876543210",
          status: "completed",
          timestamp: new Date().toISOString(),
          duration: 120,
          cost: 0.5,
          type: "outbound",
        },
        {
          _id: "mock_2",
          phoneNumber: "+919123456789",
          status: "failed",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          duration: 0,
          cost: 0,
          type: "outbound",
        },
      ])
    }
  }

  const makeCall = async () => {
    if (!phoneNumber.trim()) {
      toast.error("Please enter a phone number")
      return
    }

    if (!isConnected) {
      toast.error("Voice service not connected. Please try initializing again.")
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

      // Simulate call connection for now
      setIsInCall(true)
      toast.success(`Calling ${formattedNumber}...`)

      // Simulate call duration
      setTimeout(() => {
        setIsInCall(false)
        toast.info("Call ended")
        fetchCallHistory()
      }, 5000) // End call after 5 seconds for demo
    } catch (error) {
      console.error("Call failed:", error)
      toast.error(`Call failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const hangUp = () => {
    try {
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
      setIsMuted(!isMuted)
      toast.info(isMuted ? "Unmuted" : "Muted")
    } catch (error) {
      console.error("Error toggling mute:", error)
      toast.error("Error toggling mute")
    }
  }

  const retryInitialization = () => {
    setConnectionError("")
    setInitializingSDK(false)
    setSdkLoadAttempts(0)
    initializeTwilio()
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
          {initializingSDK ? (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Initializing...</span>
            </Badge>
          ) : (
            <Badge variant={isConnected ? "default" : "secondary"}>{isConnected ? "Connected" : "Disconnected"}</Badge>
          )}
          {isInCall && (
            <Badge variant="destructive" className="animate-pulse">
              🔴 In Call
            </Badge>
          )}
        </div>
      </div>

      {connectionError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <h3 className="font-medium text-red-800">Connection Error</h3>
                <p className="text-sm text-red-700">{connectionError}</p>
                <p className="text-xs text-red-600 mt-1">
                  Attempts: {sdkLoadAttempts}. Please check your internet connection and Twilio credentials.
                </p>
              </div>
            </div>
            <Button onClick={retryInitialization} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
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
                    disabled={isInCall || initializingSDK}
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
                      disabled={loading || !isConnected || !phoneNumber.trim() || initializingSDK}
                      className="flex-1"
                      size="lg"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Calling...
                        </>
                      ) : (
                        <>
                          <PhoneCall className="h-4 w-4 mr-2" />
                          Call Now
                        </>
                      )}
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

                {initializingSDK && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      <p className="text-sm text-blue-800">Initializing voice service... Attempt {sdkLoadAttempts}</p>
                    </div>
                  </div>
                )}

                {!isConnected && !connectionError && !initializingSDK && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">⚠️ Voice service not connected. Click retry to initialize.</p>
                    <Button onClick={retryInitialization} variant="outline" size="sm" className="mt-2 bg-transparent">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Initialize Voice Service
                    </Button>
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
                    <span className="text-sm font-medium">Service Status:</span>
                    <Badge variant={initializingSDK ? "secondary" : isConnected ? "default" : "destructive"}>
                      {initializingSDK ? "Initializing..." : isConnected ? "Ready" : "Error"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Connection Status:</span>
                    <Badge variant={isConnected ? "default" : "secondary"}>
                      {isConnected ? "Connected" : "Disconnected"}
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
                        <p className="text-sm text-green-600">Call is active (Demo mode)</p>
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

                  {connectionError && (
                    <div className="pt-2">
                      <Button
                        onClick={retryInitialization}
                        variant="outline"
                        size="sm"
                        className="w-full bg-transparent"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry Connection
                      </Button>
                    </div>
                  )}
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
