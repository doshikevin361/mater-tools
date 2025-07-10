"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Phone, PhoneOff, Mic, MicOff, RefreshCw, Play, Pause } from "lucide-react"
import { toast } from "sonner"

interface CallRecord {
  id: string
  phoneNumber: string
  direction: "inbound" | "outbound"
  status: string
  duration: number
  startTime: string
  endTime?: string
  recordingUrl?: string
  transcription?: string
}

export default function Voice2WayPage() {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isDialing, setIsDialing] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [currentCallId, setCurrentCallId] = useState<string | null>(null)
  const [callHistory, setCallHistory] = useState<CallRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [playingRecording, setPlayingRecording] = useState<string | null>(null)

  // Timer for call duration
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isConnected) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isConnected])

  // Load call history on component mount
  useEffect(() => {
    loadCallHistory()
  }, [])

  const loadCallHistory = async () => {
    try {
      const response = await fetch("/api/voice/recordings")
      if (response.ok) {
        const data = await response.json()
        setCallHistory(data.recordings || [])
      }
    } catch (error) {
      console.error("Failed to load call history:", error)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleDial = async () => {
    if (!phoneNumber.trim()) {
      toast.error("Please enter a phone number")
      return
    }

    setIsDialing(true)
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
        setCurrentCallId(data.callSid)
        setIsConnected(true)
        setCallDuration(0)
        toast.success("Call initiated successfully")
      } else {
        toast.error(data.error || "Failed to initiate call")
      }
    } catch (error) {
      toast.error("Failed to initiate call")
      console.error("Dial error:", error)
    } finally {
      setIsDialing(false)
    }
  }

  const handleEndCall = async () => {
    if (!currentCallId) return

    try {
      const response = await fetch("/api/voice/end-call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          callSid: currentCallId,
        }),
      })

      if (response.ok) {
        setIsConnected(false)
        setCurrentCallId(null)
        setCallDuration(0)
        setIsMuted(false)
        toast.success("Call ended")
        loadCallHistory() // Refresh history
      } else {
        toast.error("Failed to end call")
      }
    } catch (error) {
      toast.error("Failed to end call")
      console.error("End call error:", error)
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    toast.info(isMuted ? "Unmuted" : "Muted")
  }

  const playRecording = async (recordingUrl: string, recordingId: string) => {
    if (playingRecording === recordingId) {
      setPlayingRecording(null)
      return
    }

    try {
      const audio = new Audio(recordingUrl)
      setPlayingRecording(recordingId)

      audio.onended = () => {
        setPlayingRecording(null)
      }

      audio.onerror = () => {
        setPlayingRecording(null)
        toast.error("Failed to play recording")
      }

      await audio.play()
    } catch (error) {
      setPlayingRecording(null)
      toast.error("Failed to play recording")
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Voice 2-Way Calls</h2>
        <Button variant="outline" size="sm" onClick={loadCallHistory} disabled={isLoading}>
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
                disabled={isConnected}
              />
            </div>

            {!isConnected ? (
              <Button onClick={handleDial} disabled={isDialing || !phoneNumber.trim()} className="w-full">
                <Phone className="h-4 w-4 mr-2" />
                {isDialing ? "Dialing..." : "Call"}
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="text-center">
                  <Badge variant="secondary" className="mb-2">
                    Connected: {formatDuration(callDuration)}
                  </Badge>
                  <p className="text-sm text-muted-foreground">Calling: {phoneNumber}</p>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={toggleMute} className="flex-1 bg-transparent">
                    {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleEndCall} className="flex-1">
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
                  <div key={call.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={call.direction === "outbound" ? "default" : "secondary"}>
                          {call.direction === "outbound" ? "Outbound" : "Inbound"}
                        </Badge>
                        <span className="font-medium">{call.phoneNumber}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{formatDuration(call.duration)}</Badge>
                        <Badge variant={call.status === "completed" ? "default" : "destructive"}>{call.status}</Badge>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3">{new Date(call.startTime).toLocaleString()}</p>

                    {call.recordingUrl && (
                      <div className="space-y-2">
                        <Separator />
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Recording</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => playRecording(call.recordingUrl!, call.id)}
                          >
                            {playingRecording === call.id ? (
                              <Pause className="h-4 w-4 mr-2" />
                            ) : (
                              <Play className="h-4 w-4 mr-2" />
                            )}
                            {playingRecording === call.id ? "Stop" : "Play"}
                          </Button>
                        </div>

                        {call.transcription && (
                          <div className="mt-2 p-3 bg-muted rounded-md">
                            <p className="text-sm font-medium mb-1">Transcription:</p>
                            <p className="text-sm text-muted-foreground">{call.transcription}</p>
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
