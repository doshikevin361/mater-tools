"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Phone, PhoneOff, Mic, MicOff, Play, Pause, RefreshCw } from "lucide-react"
import { toast } from "sonner"

interface CallRecord {
  _id: string
  phoneNumber: string
  status: string
  duration: number
  startTime: string
  endTime?: string
  recordingUrl?: string
  transcription?: string
  direction: "inbound" | "outbound"
}

export default function Voice2WayPage() {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isDialing, setIsDialing] = useState(false)
  const [currentCall, setCurrentCall] = useState<any>(null)
  const [callHistory, setCallHistory] = useState<CallRecord[]>([])
  const [isMuted, setIsMuted] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [playingRecording, setPlayingRecording] = useState<string | null>(null)

  // Timer for call duration
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (currentCall && currentCall.status === "in-progress") {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [currentCall])

  // Load call history on component mount
  useEffect(() => {
    fetchCallHistory()
  }, [])

  const fetchCallHistory = async () => {
    try {
      const response = await fetch("/api/voice/recordings")
      if (response.ok) {
        const data = await response.json()
        setCallHistory(data.recordings || [])
      }
    } catch (error) {
      console.error("Error fetching call history:", error)
    }
  }

  const initiateCall = async () => {
    if (!phoneNumber.trim()) {
      toast.error("Please enter a phone number")
      return
    }

    setIsDialing(true)
    setCallDuration(0)

    try {
      const response = await fetch("/api/voice/two-way-call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: phoneNumber,
          record: true,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setCurrentCall({
          sid: data.callSid,
          phoneNumber,
          status: "ringing",
          startTime: new Date().toISOString(),
        })
        toast.success("Call initiated successfully")

        // Poll for call status updates
        pollCallStatus(data.callSid)
      } else {
        throw new Error(data.error || "Failed to initiate call")
      }
    } catch (error) {
      console.error("Error initiating call:", error)
      toast.error("Failed to initiate call")
    } finally {
      setIsDialing(false)
    }
  }

  const pollCallStatus = async (callSid: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/voice/call-status?callSid=${callSid}`)
        const data = await response.json()

        if (response.ok) {
          setCurrentCall((prev: any) => ({
            ...prev,
            status: data.status,
          }))

          // Stop polling if call is completed
          if (["completed", "failed", "canceled", "busy", "no-answer"].includes(data.status)) {
            clearInterval(pollInterval)
            setCurrentCall(null)
            setCallDuration(0)
            fetchCallHistory() // Refresh history
          }
        }
      } catch (error) {
        console.error("Error polling call status:", error)
        clearInterval(pollInterval)
      }
    }, 2000)

    // Clear interval after 5 minutes to prevent infinite polling
    setTimeout(() => clearInterval(pollInterval), 300000)
  }

  const endCall = async () => {
    if (!currentCall) return

    try {
      const response = await fetch("/api/voice/end-call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          callSid: currentCall.sid,
        }),
      })

      if (response.ok) {
        setCurrentCall(null)
        setCallDuration(0)
        toast.success("Call ended")
        fetchCallHistory()
      } else {
        throw new Error("Failed to end call")
      }
    } catch (error) {
      console.error("Error ending call:", error)
      toast.error("Failed to end call")
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    // In a real implementation, you would send mute/unmute commands to Twilio
    toast.info(isMuted ? "Unmuted" : "Muted")
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const playRecording = async (recordingUrl: string, recordingId: string) => {
    if (playingRecording === recordingId) {
      setPlayingRecording(null)
      // Stop audio playback
      const audio = document.getElementById(`audio-${recordingId}`) as HTMLAudioElement
      if (audio) {
        audio.pause()
        audio.currentTime = 0
      }
    } else {
      setPlayingRecording(recordingId)
      // Start audio playback
      const audio = document.getElementById(`audio-${recordingId}`) as HTMLAudioElement
      if (audio) {
        audio.play()
      }
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Voice 2-Way Calls</h2>
        <Button variant="outline" size="sm" onClick={fetchCallHistory} disabled={isLoading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Dialer Card */}
        <Card className="col-span-full lg:col-span-1">
          <CardHeader>
            <CardTitle>Make a Call</CardTitle>
            <CardDescription>Enter a phone number to start a two-way conversation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="+1234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={isDialing || currentCall}
              />
            </div>

            {!currentCall ? (
              <Button onClick={initiateCall} disabled={isDialing || !phoneNumber.trim()} className="w-full">
                <Phone className="h-4 w-4 mr-2" />
                {isDialing ? "Dialing..." : "Call"}
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="text-center">
                  <Badge variant={currentCall.status === "in-progress" ? "default" : "secondary"}>
                    {currentCall.status}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-1">{currentCall.phoneNumber}</p>
                  {currentCall.status === "in-progress" && (
                    <p className="text-lg font-mono mt-2">{formatDuration(callDuration)}</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={toggleMute} className="flex-1 bg-transparent">
                    {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                  <Button variant="destructive" size="sm" onClick={endCall} className="flex-1">
                    <PhoneOff className="h-4 w-4 mr-2" />
                    End Call
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Call History Card */}
        <Card className="col-span-full lg:col-span-2">
          <CardHeader>
            <CardTitle>Call History</CardTitle>
            <CardDescription>Recent two-way calls with recordings and transcriptions</CardDescription>
          </CardHeader>
          <CardContent>
            {callHistory.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No call history available</p>
            ) : (
              <div className="space-y-4">
                {callHistory.map((call) => (
                  <div key={call._id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={call.direction === "outbound" ? "default" : "secondary"}>
                          {call.direction}
                        </Badge>
                        <span className="font-medium">{call.phoneNumber}</span>
                      </div>
                      <Badge variant={call.status === "completed" ? "default" : "destructive"}>{call.status}</Badge>
                    </div>

                    <div className="text-sm text-muted-foreground mb-3">
                      <p>Started: {formatDate(call.startTime)}</p>
                      {call.endTime && <p>Ended: {formatDate(call.endTime)}</p>}
                      <p>Duration: {formatDuration(call.duration)}</p>
                    </div>

                    {call.recordingUrl && (
                      <div className="space-y-2">
                        <Separator />
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => playRecording(call.recordingUrl!, call._id)}
                          >
                            {playingRecording === call._id ? (
                              <Pause className="h-4 w-4 mr-2" />
                            ) : (
                              <Play className="h-4 w-4 mr-2" />
                            )}
                            {playingRecording === call._id ? "Pause" : "Play"} Recording
                          </Button>
                          <audio
                            id={`audio-${call._id}`}
                            src={call.recordingUrl}
                            onEnded={() => setPlayingRecording(null)}
                            className="hidden"
                          />
                        </div>

                        {call.transcription && (
                          <div className="mt-2 p-3 bg-muted rounded-md">
                            <p className="text-sm font-medium mb-1">Transcription:</p>
                            <p className="text-sm">{call.transcription}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
