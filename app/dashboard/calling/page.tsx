"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Phone, PhoneCall, Mic, MicOff, Volume2, VolumeX } from "lucide-react"
import { toast } from "sonner"

export default function CallingPage() {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isCallActive, setIsCallActive] = useState(false)
  const [isMicEnabled, setIsMicEnabled] = useState(false)
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(true)
  const [micLevel, setMicLevel] = useState(0)
  const [callDuration, setCallDuration] = useState(0)
  const [hasPermission, setHasPermission] = useState(false)

  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const callStartTimeRef = useRef<number>(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      stopCall()
    }
  }, [])

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      setHasPermission(true)
      setIsMicEnabled(true)
      mediaStreamRef.current = stream

      // Setup audio analysis
      const audioContext = new AudioContext()
      const analyser = audioContext.createAnalyser()
      const source = audioContext.createMediaStreamSource(stream)

      source.connect(analyser)
      analyser.fftSize = 256

      audioContextRef.current = audioContext
      analyserRef.current = analyser

      // Start monitoring mic level
      monitorMicLevel()

      toast.success("Microphone permission granted!")
      return true
    } catch (error) {
      toast.error("Microphone permission denied")
      setHasPermission(false)
      return false
    }
  }

  const monitorMicLevel = () => {
    if (!analyserRef.current) return

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)

    const updateLevel = () => {
      if (!analyserRef.current || !isCallActive) return

      analyserRef.current.getByteFrequencyData(dataArray)
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length
      setMicLevel(Math.round((average / 255) * 100))

      requestAnimationFrame(updateLevel)
    }

    updateLevel()
  }

  const startCall = async () => {
    if (!phoneNumber.trim()) {
      toast.error("Please enter a phone number")
      return
    }

    if (!hasPermission) {
      const granted = await requestMicrophonePermission()
      if (!granted) return
    }

    setIsCallActive(true)
    callStartTimeRef.current = Date.now()

    // Start call duration timer
    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - callStartTimeRef.current) / 1000)
      setCallDuration(elapsed)
    }, 1000)

    monitorMicLevel()
    toast.success(`Calling ${phoneNumber}...`)
  }

  const stopCall = async () => {
    setIsCallActive(false)

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    // Log the call
    if (callDuration > 0) {
      try {
        await fetch("/api/calling/browser-call", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phoneNumber,
            duration: callDuration,
            userId: "demo-user",
          }),
        })
      } catch (error) {
        console.error("Failed to log call:", error)
      }
    }

    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop())
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close()
    }

    setCallDuration(0)
    setMicLevel(0)
    toast.success("Call ended")
  }

  const toggleMic = () => {
    if (mediaStreamRef.current) {
      const audioTracks = mediaStreamRef.current.getAudioTracks()
      audioTracks.forEach((track) => {
        track.enabled = !isMicEnabled
      })
      setIsMicEnabled(!isMicEnabled)
      toast.success(isMicEnabled ? "Microphone muted" : "Microphone unmuted")
    }
  }

  const toggleSpeaker = () => {
    setIsSpeakerEnabled(!isSpeakerEnabled)
    toast.success(isSpeakerEnabled ? "Speaker off" : "Speaker on")
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const dialPadNumbers = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["*", "0", "#"],
  ]

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Browser Calling</h1>
        <p className="text-muted-foreground">Direct voice calls through your browser - no phone required!</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Call Interface */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Direct Browser Call
            </CardTitle>
            <CardDescription>Click call, grant microphone permission, and talk directly</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Phone Number Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone Number</label>
              <Input
                type="tel"
                placeholder="Enter phone number (e.g., 9876543210)"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={isCallActive}
              />
            </div>

            {/* Dial Pad */}
            <div className="grid grid-cols-3 gap-2">
              {dialPadNumbers.flat().map((num) => (
                <Button
                  key={num}
                  variant="outline"
                  className="h-12 text-lg bg-transparent"
                  onClick={() => setPhoneNumber((prev) => prev + num)}
                  disabled={isCallActive}
                >
                  {num}
                </Button>
              ))}
            </div>

            {/* Call Controls */}
            <div className="flex gap-2">
              {!isCallActive ? (
                <Button onClick={startCall} className="flex-1 bg-green-600 hover:bg-green-700" size="lg">
                  <PhoneCall className="h-4 w-4 mr-2" />
                  Call Now
                </Button>
              ) : (
                <Button onClick={stopCall} className="flex-1 bg-red-600 hover:bg-red-700" size="lg">
                  <Phone className="h-4 w-4 mr-2" />
                  End Call
                </Button>
              )}
            </div>

            {/* Permission Status */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm">Microphone Permission:</span>
              <Badge variant={hasPermission ? "default" : "destructive"}>
                {hasPermission ? "Granted" : "Required"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Call Status & Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Call Status</CardTitle>
            <CardDescription>Real-time call information and controls</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Call Duration */}
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-mono font-bold">{formatDuration(callDuration)}</div>
              <div className="text-sm text-muted-foreground">{isCallActive ? "Call Active" : "No Active Call"}</div>
            </div>

            {/* Audio Controls */}
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant={isMicEnabled ? "default" : "destructive"}
                onClick={toggleMic}
                disabled={!isCallActive}
                className="h-16"
              >
                {isMicEnabled ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
                <div className="ml-2 text-left">
                  <div className="text-sm font-medium">Microphone</div>
                  <div className="text-xs">{isMicEnabled ? "On" : "Off"}</div>
                </div>
              </Button>

              <Button
                variant={isSpeakerEnabled ? "default" : "outline"}
                onClick={toggleSpeaker}
                disabled={!isCallActive}
                className="h-16"
              >
                {isSpeakerEnabled ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
                <div className="ml-2 text-left">
                  <div className="text-sm font-medium">Speaker</div>
                  <div className="text-xs">{isSpeakerEnabled ? "On" : "Off"}</div>
                </div>
              </Button>
            </div>

            {/* Microphone Level */}
            {isCallActive && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Microphone Level</span>
                  <span>{micLevel}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-100"
                    style={{ width: `${micLevel}%` }}
                  />
                </div>
              </div>
            )}

            <Separator />

            {/* Call Info */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Call Type:</span>
                <Badge variant="outline">Browser Call</Badge>
              </div>
              <div className="flex justify-between">
                <span>Cost per minute:</span>
                <span className="text-green-600">$0.02</span>
              </div>
              {callDuration > 0 && (
                <div className="flex justify-between">
                  <span>Estimated cost:</span>
                  <span className="text-green-600">${((callDuration / 60) * 0.02).toFixed(4)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>How Browser Calling Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4 text-center">
            <div className="space-y-2">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h3 className="font-medium">Enter Number</h3>
              <p className="text-sm text-muted-foreground">Type or use dial pad</p>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-green-600 font-bold">2</span>
              </div>
              <h3 className="font-medium">Click Call</h3>
              <p className="text-sm text-muted-foreground">Grant microphone permission</p>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-purple-600 font-bold">3</span>
              </div>
              <h3 className="font-medium">Direct Connection</h3>
              <p className="text-sm text-muted-foreground">They talk, you hear</p>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-orange-600 font-bold">4</span>
              </div>
              <h3 className="font-medium">Speaker Output</h3>
              <p className="text-sm text-muted-foreground">Audio through browser</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
