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
  Download,
  Clock,
  DollarSign,
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
  const callTimerRef = useRef<NodeJS.Timeout>()

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

  const fetchCallHistory = async () => {
    try {
      const response = await fetch("/api/calling/history")
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

    if (balance < 1) {
      toast.error("Insufficient balance to make a call")
      return
    }

    try {
      const response = await fetch("/api/calling/make-call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: phoneNumber,
          record: autoRecord,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setIsCallActive(true)
        setCallDuration(0)
        setCallCost(0)
        if (autoRecord) {
          setIsRecording(true)
        }
        toast.success("Call initiated successfully")
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to make call")
      }
    } catch (error) {
      console.error("Error making call:", error)
      toast.error("Failed to make call")
    }
  }

  const endCall = () => {
    setIsCallActive(false)
    setIsRecording(false)
    setCallDuration(0)

    // Deduct cost from balance
    setBalance((prev) => Math.max(0, prev - callCost))

    toast.success(`Call ended. Cost: $${callCost.toFixed(2)}`)

    // Refresh call history
    fetchCallHistory()
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

  const formatPhoneNumber = (number: string) => {
    const cleaned = number.replace(/\D/g, "")
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
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

  const downloadRecording = async (recordingUrl: string, callId: string) => {
    try {
      const response = await fetch(recordingUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `call-recording-${callId}.mp3`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success("Recording downloaded")
    } catch (error) {
      toast.error("Failed to download recording")
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
            <p className="text-2xl font-bold text-green-600">${balance.toFixed(2)}</p>
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
            {/* Dialer Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Phone className="h-5 w-5" />
                  <span>Phone Dialer</span>
                </CardTitle>
                <CardDescription>Enter a phone number to make a call</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={formatPhoneNumber(phoneNumber)}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                    disabled={isCallActive}
                    className="text-lg text-center"
                  />
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
                    onClick={phoneNumber.slice(0, -1) ? () => setPhoneNumber(phoneNumber.slice(0, -1)) : undefined}
                    variant="outline"
                    disabled={isCallActive || !phoneNumber}
                    className="flex-1"
                  >
                    ⌫
                  </Button>
                </div>

                <div className="flex space-x-2">
                  {!isCallActive ? (
                    <Button onClick={makeCall} className="flex-1" size="lg">
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

            {/* Call Controls Card */}
            <Card>
              <CardHeader>
                <CardTitle>Call Controls</CardTitle>
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
                    <p className="text-sm">Enter a number and press call to start</p>
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
              <CardDescription>View your recent calls and recordings</CardDescription>
            </CardHeader>
            <CardContent>
              {callHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <PhoneCall className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No call history yet</p>
                  <p className="text-sm">Your calls will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {callHistory.map((call) => (
                    <div key={call.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <Phone className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{formatPhoneNumber(call.phoneNumber)}</p>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span>{formatDuration(call.duration)}</span>
                            <span>${call.cost.toFixed(2)}</span>
                            <span>{new Date(call.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
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
                        {call.recordingUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadRecording(call.recordingUrl!, call.id)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
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
                <p className="text-sm text-muted-foreground">$0.05 per minute</p>
              </div>

              <div className="space-y-2">
                <Label>Current Balance</Label>
                <p className="text-2xl font-bold text-green-600">${balance.toFixed(2)}</p>
                <Button variant="outline" size="sm">
                  Add Funds
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
