"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Slider } from "@/components/ui/slider"
import { Phone, PhoneCall, PhoneOff, Mic, MicOff, Volume2, Clock, DollarSign, TrendingUp } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { TwilioVoiceBrowser } from "@/lib/twilio-voice-browser"

interface CallHistoryItem {
  id: string
  phoneNumber: string
  status: string
  duration: number
  cost: number
  createdAt: string
  direction: string
}

export default function CallingPage() {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isCallActive, setIsCallActive] = useState(false)
  const [callStatus, setCallStatus] = useState<string>("idle")
  const [callDuration, setCallDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState([50])
  const [isInitializing, setIsInitializing] = useState(false)
  const [callHistory, setCallHistory] = useState<CallHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const twilioVoice = useRef<TwilioVoiceBrowser | null>(null)
  const callTimer = useRef<NodeJS.Timeout | null>(null)
  const currentConnection = useRef<any>(null)

  useEffect(() => {
    initializeTwilio()
    fetchCallHistory()
    return () => {
      if (callTimer.current) {
        clearInterval(callTimer.current)
      }
    }
  }, [])

  const initializeTwilio = async () => {
    try {
      setIsInitializing(true)
      twilioVoice.current = new TwilioVoiceBrowser()
      await twilioVoice.current.initialize()

      twilioVoice.current.onConnectionStateChange((state: string) => {
        setCallStatus(state)
        if (state === "connected") {
          setIsCallActive(true)
          startCallTimer()
        } else if (state === "disconnected") {
          setIsCallActive(false)
          stopCallTimer()
          fetchCallHistory()
        }
      })

      setIsInitializing(false)
    } catch (error) {
      setIsInitializing(false)
      toast({
        title: "Initialization Failed",
        description: "Failed to initialize voice calling. Please check your internet connection and refresh the page.",
        variant: "destructive",
      })
    }
  }

  const fetchCallHistory = async () => {
    try {
      const response = await fetch("/api/calling/history?userId=demo-user-123")
      if (response.ok) {
        const data = await response.json()
        setCallHistory(data.calls || [])
      }
    } catch (error) {
      // Silent fail for history
    }
  }

  const startCallTimer = () => {
    setCallDuration(0)
    callTimer.current = setInterval(() => {
      setCallDuration((prev) => prev + 1)
    }, 1000)
  }

  const stopCallTimer = () => {
    if (callTimer.current) {
      clearInterval(callTimer.current)
      callTimer.current = null
    }
  }

  const formatPhoneNumber = (number: string) => {
    const cleaned = number.replace(/\D/g, "")
    if (cleaned.length === 10) {
      return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`
    }
    return number
  }

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "")
    if (value.length <= 10) {
      setPhoneNumber(value)
    }
  }

  const makeCall = async () => {
    if (!phoneNumber || phoneNumber.length !== 10) {
      toast({
        title: "Invalid Number",
        description: "Please enter a valid 10-digit phone number",
        variant: "destructive",
      })
      return
    }

    if (!twilioVoice.current) {
      toast({
        title: "Not Ready",
        description: "Voice calling is not initialized. Please refresh the page.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      setCallStatus("connecting")
      currentConnection.current = await twilioVoice.current.makeCall(phoneNumber)
      toast({
        title: "Calling...",
        description: `Connecting to ${formatPhoneNumber(phoneNumber)}`,
      })
    } catch (error) {
      setCallStatus("idle")
      setIsLoading(false)
      toast({
        title: "Call Failed",
        description: "Unable to make the call. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const hangUp = () => {
    if (twilioVoice.current) {
      twilioVoice.current.hangUp()
    }
    setIsCallActive(false)
    setCallStatus("idle")
    stopCallTimer()
  }

  const toggleMute = () => {
    if (twilioVoice.current) {
      if (isMuted) {
        twilioVoice.current.unmute()
      } else {
        twilioVoice.current.mute()
      }
      setIsMuted(!isMuted)
    }
  }

  const handleVolumeChange = (value: number[]) => {
    setVolume(value)
    if (twilioVoice.current) {
      twilioVoice.current.setVolume(value[0] / 100)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`
  }

  const getStatusBadge = (status: string) => {
    const statusColors = {
      completed: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      busy: "bg-yellow-100 text-yellow-800",
      "no-answer": "bg-gray-100 text-gray-800",
      initiated: "bg-blue-100 text-blue-800",
    }
    return statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"
  }

  const totalCalls = callHistory.length
  const totalDuration = callHistory.reduce((sum, call) => sum + call.duration, 0)
  const totalCost = callHistory.reduce((sum, call) => sum + call.cost, 0)
  const successfulCalls = callHistory.filter((call) => call.status === "completed").length

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Voice Calling</h1>
          <p className="text-muted-foreground">Make calls directly from your browser</p>
        </div>
        <Badge variant={isInitializing ? "secondary" : "default"}>{isInitializing ? "Initializing..." : "Ready"}</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCalls}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(totalDuration)}</div>
            <p className="text-xs text-muted-foreground">Minutes talked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCost)}</div>
            <p className="text-xs text-muted-foreground">Spent on calls</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalCalls > 0 ? Math.round((successfulCalls / totalCalls) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Successful calls</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Make a Call</CardTitle>
            <CardDescription>Enter a phone number to start calling</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <div className="flex-1">
                <Input
                  type="tel"
                  placeholder="Enter 10-digit number"
                  value={phoneNumber}
                  onChange={handlePhoneNumberChange}
                  disabled={isCallActive || isInitializing}
                  className="text-lg"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  {phoneNumber && `Will call: ${formatPhoneNumber(phoneNumber)}`}
                </p>
              </div>
              <Button
                onClick={makeCall}
                disabled={!phoneNumber || phoneNumber.length !== 10 || isCallActive || isInitializing || isLoading}
                size="lg"
                className="px-8"
              >
                <PhoneCall className="h-4 w-4 mr-2" />
                Call
              </Button>
            </div>

            {(isCallActive || callStatus !== "idle") && (
              <Card className="border-2 border-primary">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-medium">{formatPhoneNumber(phoneNumber)}</p>
                      <p className="text-sm text-muted-foreground capitalize">{callStatus}</p>
                    </div>
                    <Badge variant={isCallActive ? "default" : "secondary"}>
                      {isCallActive ? "Connected" : callStatus}
                    </Badge>
                  </div>

                  {isCallActive && (
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-2xl font-mono font-bold">{formatDuration(callDuration)}</div>
                        <div className="text-sm text-muted-foreground">
                          Cost: {formatCurrency(Math.ceil(callDuration / 60) * 0.05)}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Volume2 className="h-4 w-4" />
                        <Slider
                          value={volume}
                          onValueChange={handleVolumeChange}
                          max={100}
                          step={1}
                          className="flex-1"
                        />
                        <span className="text-sm w-12">{volume[0]}%</span>
                      </div>

                      <div className="flex space-x-2">
                        <Button variant="outline" onClick={toggleMute} className="flex-1 bg-transparent">
                          {isMuted ? <MicOff className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
                          {isMuted ? "Unmute" : "Mute"}
                        </Button>
                        <Button variant="destructive" onClick={hangUp} className="flex-1">
                          <PhoneOff className="h-4 w-4 mr-2" />
                          Hang Up
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Call History</CardTitle>
            <CardDescription>Recent calls and their status</CardDescription>
          </CardHeader>
          <CardContent>
            {callHistory.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Number</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {callHistory.slice(0, 10).map((call) => (
                      <TableRow key={call.id}>
                        <TableCell className="font-medium">{formatPhoneNumber(call.phoneNumber)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(call.status)}>{call.status}</Badge>
                        </TableCell>
                        <TableCell>{formatDuration(call.duration)}</TableCell>
                        <TableCell>{formatCurrency(call.cost)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No calls made yet</p>
                <p className="text-sm">Your call history will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
