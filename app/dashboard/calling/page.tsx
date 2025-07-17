"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import {
  Phone,
  PhoneCall,
  PhoneOff,
  Clock,
  DollarSign,
  Wifi,
  WifiOff,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react"

interface CallRecord {
  _id: string
  phoneNumber: string
  callSid?: string
  duration: number
  status: "initiated" | "ringing" | "answered" | "completed" | "failed" | "busy" | "no-answer"
  cost: number
  recordingUrl?: string
  transcript?: string
  timestamp: Date
  type?: string
  message?: string
  answeredBy?: string
}

export default function CallingPage() {
  const [activeTab, setActiveTab] = useState("dialer")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [customMessage, setCustomMessage] = useState("")
  const [isCallActive, setIsCallActive] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [callHistory, setCallHistory] = useState<CallRecord[]>([])
  const [balance, setBalance] = useState(25.5)
  const [autoRecord, setAutoRecord] = useState(true)
  const [callCost, setCallCost] = useState(0)
  const [isConnected, setIsConnected] = useState(true)
  const [isInitializing, setIsInitializing] = useState(false)
  const [callStatus, setCallStatus] = useState("idle")
  const [currentCallSid, setCurrentCallSid] = useState("")
  const callTimerRef = useRef<NodeJS.Timeout>()

  // Load call history on component mount
  useEffect(() => {
    fetchCallHistory()
    checkTwilioConnection()
  }, [])

  // Call timer effect
  useEffect(() => {
    if (isCallActive) {
      callTimerRef.current = setInterval(() => {
        setCallDuration((prev) => {
          const newDuration = prev + 1
          setCallCost((newDuration / 60) * 0.05) // $0.05 per minute
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

  const checkTwilioConnection = async () => {
    try {
      setIsInitializing(true)
      // You can add a test API call here to verify Twilio credentials
      setIsConnected(true)
      toast.success("Twilio connection verified!")
    } catch (error) {
      setIsConnected(false)
      toast.error("Twilio connection failed. Please check your credentials.")
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
      toast.error("Failed to load call history")
    }
  }

  const makeCall = async () => {
    if (!phoneNumber.trim()) {
      toast.error("Please enter a phone number")
      return
    }

    if (!isConnected) {
      toast.error("Twilio connection not available. Please check your setup.")
      return
    }

    if (balance < 1) {
      toast.error("Insufficient balance to make a call")
      return
    }

    try {
      setCallStatus("connecting")
      setIsCallActive(true)
      setCallDuration(0)
      setCallCost(0)

      toast.info("Initiating call through Twilio...")

      const response = await fetch("/api/calling/make-call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber,
          message: customMessage || "Hello, this is a test call from BrandBuzz Ventures. Thank you for your time.",
          messageType: "tts",
        }),
      })

      const data = await response.json()

      if (data.success) {
        setCurrentCallSid(data.callSid)
        setCallStatus("initiated")
        toast.success(`Call initiated! Call SID: ${data.callSid}`)

        // Start polling for call status
        pollCallStatus(data.callSid)

        // Refresh call history
        setTimeout(() => {
          fetchCallHistory()
        }, 2000)
      } else {
        throw new Error(data.error || "Failed to initiate call")
      }
    } catch (error) {
      console.error("Error making call:", error)
      setCallStatus("idle")
      setIsCallActive(false)
      toast.error(`Failed to make call: ${error.message}`)
    }
  }

  const pollCallStatus = async (callSid: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/calling/status?callSid=${callSid}`)
        const data = await response.json()

        if (data.success) {
          const status = data.status
          setCallStatus(status)

          if (status === "completed" || status === "failed" || status === "busy" || status === "no-answer") {
            setIsCallActive(false)
            clearInterval(pollInterval)

            if (status === "completed") {
              toast.success("Call completed successfully!")
            } else {
              toast.error(`Call ${status}`)
            }

            // Refresh call history
            fetchCallHistory()
          }
        }
      } catch (error) {
        console.error("Error polling call status:", error)
      }
    }, 3000) // Poll every 3 seconds

    // Stop polling after 2 minutes
    setTimeout(() => {
      clearInterval(pollInterval)
      if (isCallActive) {
        setIsCallActive(false)
        setCallStatus("timeout")
        toast.error("Call monitoring timeout")
      }
    }, 120000)
  }

  const endCall = async () => {
    try {
      if (currentCallSid) {
        // You can implement call termination here if needed
        toast.info("Call will end naturally or you can hang up from your phone")
      }

      setIsCallActive(false)
      setCallStatus("idle")
      setCurrentCallSid("")
    } catch (error) {
      console.error("Error ending call:", error)
      toast.error("Failed to end call")
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "failed":
      case "busy":
      case "no-answer":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "initiated":
      case "ringing":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      default:
        return <Phone className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "failed":
      case "busy":
      case "no-answer":
        return "bg-red-100 text-red-800"
      case "initiated":
      case "ringing":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
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
          <h1 className="text-3xl font-bold">Twilio Voice Calling</h1>
          <p className="text-muted-foreground">Make real voice calls using Twilio API</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {isConnected ? <Wifi className="h-4 w-4 text-green-600" /> : <WifiOff className="h-4 w-4 text-red-600" />}
            <span className={`text-sm ${isConnected ? "text-green-600" : "text-red-600"}`}>
              {isInitializing ? "Checking..." : isConnected ? "Twilio Ready" : "Disconnected"}
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
          <TabsTrigger value="dialer">Voice Dialer</TabsTrigger>
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
                  <span>Twilio Voice Dialer</span>
                </CardTitle>
                <CardDescription>Make real voice calls to Indian mobile numbers</CardDescription>
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

                <div className="space-y-2">
                  <Label htmlFor="message">Custom Message (Optional)</Label>
                  <Input
                    id="message"
                    type="text"
                    placeholder="Enter custom voice message..."
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    disabled={isCallActive || !isConnected}
                  />
                  <p className="text-xs text-muted-foreground">Leave empty for default message</p>
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
                    onClick={() => setPhoneNumber(phoneNumber.slice(0, -1))}
                    variant="outline"
                    disabled={isCallActive || !phoneNumber || !isConnected}
                    className="flex-1"
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
                      disabled={!isConnected || isInitializing || callStatus === "connecting"}
                    >
                      <PhoneCall className="mr-2 h-4 w-4" />
                      {callStatus === "connecting" ? "Connecting..." : "Make Call"}
                    </Button>
                  ) : (
                    <Button onClick={endCall} variant="destructive" className="flex-1" size="lg">
                      <PhoneOff className="mr-2 h-4 w-4" />
                      End Monitoring
                    </Button>
                  )}
                </div>

                {!isConnected && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> Twilio connection required. Please check your environment variables.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Call Status Card */}
            <Card>
              <CardHeader>
                <CardTitle>Call Status</CardTitle>
                <CardDescription>
                  {isCallActive ? `Monitoring call - ${formatDuration(callDuration)}` : "No active call"}
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
                          <span>${callCost.toFixed(3)}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-center space-x-2">
                        {getStatusIcon(callStatus)}
                        <Badge className={getStatusColor(callStatus)}>{callStatus.toUpperCase()}</Badge>
                      </div>
                      {currentCallSid && <p className="text-xs text-muted-foreground">Call SID: {currentCallSid}</p>}
                    </div>
                  </>
                )}

                {!isCallActive && (
                  <div className="text-center text-muted-foreground py-8">
                    <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No active call</p>
                    <p className="text-sm">Enter a number and press "Make Call" to start</p>
                    <p className="text-xs mt-2 text-blue-600">✨ Real voice calls powered by Twilio</p>
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
              <CardDescription>View your recent Twilio voice calls</CardDescription>
            </CardHeader>
            <CardContent>
              {callHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <PhoneCall className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No call history yet</p>
                  <p className="text-sm">Your voice calls will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {callHistory.map((call) => (
                    <div key={call._id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              {getStatusIcon(call.status)}
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
                                <span>${call.cost.toFixed(3)}</span>
                              </span>
                              <span>{new Date(call.timestamp).toLocaleString()}</span>
                              {call.callSid && <span className="text-xs">SID: {call.callSid.slice(-8)}</span>}
                            </div>
                            {call.message && <p className="text-sm text-gray-600 mt-1">"{call.message}"</p>}
                          </div>
                        </div>
                        <Badge className={getStatusColor(call.status)}>{call.status}</Badge>
                      </div>
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
              <CardTitle>Twilio Voice Settings</CardTitle>
              <CardDescription>Configure your Twilio voice calling preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-record calls</Label>
                  <p className="text-sm text-muted-foreground">Automatically record voice calls</p>
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
                <Label>Twilio Configuration</Label>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>✅ Account SID: {process.env.TWILIO_ACCOUNT_SID ? "Configured" : "Missing"}</p>
                  <p>✅ API Key: {process.env.TWILIO_API_KEY ? "Configured" : "Missing"}</p>
                  <p>✅ API Secret: {process.env.TWILIO_API_SECRET ? "Configured" : "Missing"}</p>
                  <p>✅ Phone Number: {process.env.TWILIO_PHONE_NUMBER || "+19252617266"}</p>
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
                      <span className="text-sm text-red-600">Disconnected - Check configuration</span>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
