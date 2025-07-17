"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Phone, PhoneCall, Clock, CheckCircle, XCircle, AlertCircle, Loader2, Building2 } from "lucide-react"
import { toast } from "sonner"

interface CallRecord {
  _id: string
  phoneNumber: string
  callSid: string
  status: string
  message: string
  duration: number
  timestamp: string
  price?: number
  priceUnit?: string
}

export default function CallingPage() {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [customMessage, setCustomMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [callHistory, setCallHistory] = useState<CallRecord[]>([])
  const [currentCall, setCurrentCall] = useState<{
    callSid: string
    status: string
    phoneNumber: string
  } | null>(null)

  // Real business message - NO testing language
  const realBusinessMessage = `Hello, this is BrandBuzz Ventures reaching out to you today. We are a premier digital marketing agency that helps businesses like yours grow their online presence and increase revenue through proven marketing strategies. We specialize in social media automation, targeted email campaigns, SMS marketing, and comprehensive digital solutions that deliver real results. Our team has helped hundreds of businesses expand their reach, engage more customers, and significantly boost their sales. We would love the opportunity to discuss how we can help your business achieve similar success. Please feel free to call us back or visit our website to learn more about our services. We look forward to the possibility of working together. Thank you for your time and have a wonderful day!`

  const fetchCallHistory = async () => {
    try {
      const response = await fetch("/api/calling/history")
      if (response.ok) {
        const data = await response.json()
        setCallHistory(data.calls || [])
      }
    } catch (error) {
      console.error("Error fetching call history:", error)
    }
  }

  const checkCallStatus = async (callSid: string) => {
    try {
      const response = await fetch(`/api/calling/status?callSid=${callSid}`)
      if (response.ok) {
        const data = await response.json()
        return data
      }
    } catch (error) {
      console.error("Error checking call status:", error)
    }
    return null
  }

  const makeCall = async () => {
    if (!phoneNumber.trim()) {
      toast.error("Please enter a phone number")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/calling/make-call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber.trim(),
          message: customMessage.trim() || realBusinessMessage,
          messageType: "tts",
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Business call initiated successfully!")

        setCurrentCall({
          callSid: data.callSid,
          status: data.status,
          phoneNumber: data.phoneNumber,
        })

        // Start polling call status
        const pollInterval = setInterval(async () => {
          const statusData = await checkCallStatus(data.callSid)
          if (statusData) {
            setCurrentCall((prev) => (prev ? { ...prev, status: statusData.status } : null))

            if (
              statusData.status === "completed" ||
              statusData.status === "failed" ||
              statusData.status === "busy" ||
              statusData.status === "no-answer"
            ) {
              clearInterval(pollInterval)
              setCurrentCall(null)
              fetchCallHistory() // Refresh history

              if (statusData.status === "completed") {
                toast.success(`Call completed successfully! Duration: ${statusData.duration || 0} seconds`)
              } else {
                toast.error(`Call ${statusData.status}`)
              }
            }
          }
        }, 3000)

        // Clear form
        setPhoneNumber("")
        setCustomMessage("")

        // Refresh call history
        fetchCallHistory()
      } else {
        toast.error(data.error || "Failed to make call")
      }
    } catch (error) {
      console.error("Error making call:", error)
      toast.error("Failed to make call")
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
      case "busy":
      case "no-answer":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "in-progress":
      case "ringing":
        return <Phone className="h-4 w-4 text-blue-500 animate-pulse" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
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
      case "in-progress":
      case "ringing":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-yellow-100 text-yellow-800"
    }
  }

  useEffect(() => {
    fetchCallHistory()
  }, [])

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center gap-3">
        <Building2 className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Business Voice Outreach</h1>
          <p className="text-muted-foreground">Real business calls for lead generation and customer outreach</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Make Call Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Make Business Call
            </CardTitle>
            <CardDescription>Initiate real business outreach calls to prospects and customers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Phone Number</label>
              <Input
                type="tel"
                placeholder="Enter phone number (e.g., 8733832957)"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Custom Message (Optional)</label>
              <Textarea
                placeholder="Enter your custom business message or leave blank for default outreach message..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={4}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave blank to use our proven business outreach message
              </p>
            </div>

            <Button onClick={makeCall} disabled={isLoading || !phoneNumber.trim()} className="w-full" size="lg">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Initiating Call...
                </>
              ) : (
                <>
                  <PhoneCall className="mr-2 h-4 w-4" />
                  Make Business Call
                </>
              )}
            </Button>

            {/* Current Call Status */}
            {currentCall && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Active Business Call</p>
                    <p className="text-sm text-muted-foreground">{currentCall.phoneNumber}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(currentCall.status)}
                    <Badge className={getStatusColor(currentCall.status)}>{currentCall.status}</Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Call SID: {currentCall.callSid}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Default Message Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Default Business Message
            </CardTitle>
            <CardDescription>
              This proven outreach message will be used if no custom message is provided
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg border">
              <p className="text-sm leading-relaxed">{realBusinessMessage}</p>
            </div>
            <div className="mt-4 text-xs text-muted-foreground">
              <p>• Professional company introduction</p>
              <p>• Clear value proposition and services</p>
              <p>• Proven track record and results</p>
              <p>• Clear call-to-action for prospects</p>
              <p>• Professional closing and contact info</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Call History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Business Call History
          </CardTitle>
          <CardDescription>Recent business outreach calls and their results</CardDescription>
        </CardHeader>
        <CardContent>
          {callHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <PhoneCall className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No business calls made yet</p>
              <p className="text-sm">Your outreach call history will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {callHistory.map((call) => (
                <div key={call._id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(call.status)}
                        <span className="font-medium">{call.phoneNumber}</span>
                      </div>
                      <Badge className={getStatusColor(call.status)}>{call.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{new Date(call.timestamp).toLocaleString()}</p>
                    {call.duration > 0 && (
                      <p className="text-sm text-muted-foreground">Duration: {call.duration} seconds</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Call SID</p>
                    <p className="text-xs font-mono">{call.callSid}</p>
                    {call.price && (
                      <p className="text-xs text-muted-foreground">
                        Cost: {call.price} {call.priceUnit}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
