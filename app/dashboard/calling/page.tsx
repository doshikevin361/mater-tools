"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Phone, PhoneCall, Clock, User, Calendar, Square, Mic, MicOff } from "lucide-react"

interface CallHistory {
  id: string
  to: string
  from: string
  status: string
  duration: number
  timestamp: string
  recordingUrl?: string
  cost: number
}

export default function CallingPage() {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [isCalling, setIsCalling] = useState(false)
  const [currentCall, setCurrentCall] = useState<any>(null)
  const [callHistory, setCallHistory] = useState<CallHistory[]>([])
  const [loading, setLoading] = useState(false)

  // Format phone number as user types
  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, "")

    // Limit to 10 digits for Indian numbers
    const limitedDigits = digits.slice(0, 10)

    // Format as XXXXX XXXXX
    if (limitedDigits.length > 5) {
      return `${limitedDigits.slice(0, 5)} ${limitedDigits.slice(5)}`
    }
    return limitedDigits
  }

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setPhoneNumber(formatted)
  }

  const makeCall = async () => {
    if (!phoneNumber || phoneNumber.replace(/\s/g, "").length !== 10) {
      toast.error("कृपया 10 अंकों का वैध भारतीय मोबाइल नंबर दर्ज करें")
      return
    }

    setIsCalling(true)
    setLoading(true)

    try {
      // Convert formatted number to +91 format
      const cleanNumber = phoneNumber.replace(/\s/g, "")
      const fullNumber = `+91${cleanNumber}`

      const response = await fetch("/api/calling/make-call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: fullNumber,
          record: isRecording,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setCurrentCall(data)
        toast.success(`कॉल शुरू की गई: ${fullNumber}`)

        // Add to call history
        const newCall: CallHistory = {
          id: data.callSid,
          to: fullNumber,
          from: "+19252617266",
          status: data.status,
          duration: 0,
          timestamp: new Date().toISOString(),
          cost: 0.5, // ₹0.50 per minute for Indian calls
        }
        setCallHistory((prev) => [newCall, ...prev])
      } else {
        toast.error(data.message || "कॉल करने में त्रुटि")
      }
    } catch (error) {
      console.error("Call error:", error)
      toast.error("कॉल करने में त्रुटि हुई")
    } finally {
      setIsCalling(false)
      setLoading(false)
    }
  }

  const endCall = () => {
    setCurrentCall(null)
    setIsCalling(false)
    toast.info("कॉल समाप्त की गई")
  }

  const loadCallHistory = async () => {
    try {
      const response = await fetch("/api/calling/history")
      const data = await response.json()
      if (data.success) {
        setCallHistory(data.calls)
      }
    } catch (error) {
      console.error("Failed to load call history:", error)
    }
  }

  useEffect(() => {
    loadCallHistory()
  }, [])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "default"
      case "busy":
        return "destructive"
      case "no-answer":
        return "secondary"
      case "failed":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "पूर्ण"
      case "busy":
        return "व्यस्त"
      case "no-answer":
        return "कोई उत्तर नहीं"
      case "failed":
        return "असफल"
      case "ringing":
        return "रिंग हो रहा है"
      case "in-progress":
        return "चल रहा है"
      default:
        return status
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">कॉलिंग / Calling</h2>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">Live</Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Dialer Card */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Phone className="h-5 w-5" />
              <span>भारतीय फोन डायलर / Indian Phone Dialer</span>
            </CardTitle>
            <CardDescription>भारतीय मोबाइल नंबर पर कॉल करें (+91) / Make calls to Indian mobile numbers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">फोन नंबर / Phone Number</Label>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1 px-3 py-2 border rounded-md bg-gray-50">
                  <span className="text-sm font-medium">+91</span>
                </div>
                <Input
                  id="phone"
                  placeholder="98765 43210"
                  value={phoneNumber}
                  onChange={handlePhoneNumberChange}
                  maxLength={11} // 5 + 1 space + 5
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                10 अंकों का भारतीय मोबाइल नंबर दर्ज करें / Enter 10-digit Indian mobile number
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch id="recording" checked={isRecording} onCheckedChange={setIsRecording} />
              <Label htmlFor="recording" className="flex items-center space-x-2">
                {isRecording ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                <span>रिकॉर्डिंग / Recording</span>
              </Label>
            </div>

            <div className="flex space-x-2">
              {!isCalling ? (
                <Button
                  onClick={makeCall}
                  disabled={loading || !phoneNumber || phoneNumber.replace(/\s/g, "").length !== 10}
                  className="flex-1"
                >
                  <PhoneCall className="mr-2 h-4 w-4" />
                  {loading ? "कॉल कर रहे हैं..." : "कॉल करें / Call"}
                </Button>
              ) : (
                <Button onClick={endCall} variant="destructive" className="flex-1">
                  <Square className="mr-2 h-4 w-4" />
                  कॉल समाप्त करें / End Call
                </Button>
              )}
            </div>

            {currentCall && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">कॉल चल रहा है / Call in Progress</p>
                    <p className="text-sm text-muted-foreground">
                      To: {currentCall.to} | From: {currentCall.from}
                    </p>
                  </div>
                  <Badge variant="default">{getStatusText(currentCall.status)}</Badge>
                </div>
              </div>
            )}

            <div className="text-xs text-muted-foreground space-y-1">
              <p>• भारतीय कॉल दर: ₹0.50 प्रति मिनट / Indian call rate: ₹0.50 per minute</p>
              <p>• Twilio Account: AC86b70...74cd</p>
              <p>• From Number: +1 (925) 261-7266</p>
            </div>
          </CardContent>
        </Card>

        {/* Call History */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>कॉल हिस्ट्री / Call History</span>
            </CardTitle>
            <CardDescription>हाल की कॉल्स / Recent calls</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {callHistory.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">कोई कॉल हिस्ट्री नहीं / No call history</p>
              ) : (
                callHistory.slice(0, 10).map((call) => (
                  <div key={call.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{call.to}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(call.timestamp).toLocaleString("hi-IN")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={getStatusColor(call.status)} className="mb-1">
                        {getStatusText(call.status)}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {call.duration > 0 ? formatDuration(call.duration) : "0:00"}
                      </p>
                      <p className="text-xs text-muted-foreground">₹{call.cost.toFixed(2)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">कुल कॉल्स / Total Calls</CardTitle>
            <PhoneCall className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{callHistory.length}</div>
            <p className="text-xs text-muted-foreground">आज तक / Till date</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">सफल कॉल्स / Successful</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{callHistory.filter((call) => call.status === "completed").length}</div>
            <p className="text-xs text-muted-foreground">पूर्ण कॉल्स / Completed calls</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">कुल समय / Total Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(callHistory.reduce((total, call) => total + call.duration, 0))}
            </div>
            <p className="text-xs text-muted-foreground">मिनट:सेकंड / Minutes:Seconds</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">कुल लागत / Total Cost</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{callHistory.reduce((total, call) => total + call.cost, 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">भारतीय रुपये / Indian Rupees</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
