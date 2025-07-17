"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { toast } from "sonner"
import { twilioVoiceBrowser } from "@/lib/twilio-voice-browser"
import { Phone, PhoneCall, PhoneOff, Mic, MicOff, Volume2, VolumeX, Wifi, WifiOff, Users, Clock } from "lucide-react"

export default function LiveCallingPage() {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isCallActive, setIsCallActive] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState([80])
  const [isConnected, setIsConnected] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [callStatus, setCallStatus] = useState("idle")
  const callTimerRef = useRef<NodeJS.Timeout>()

  // Initialize Twilio Voice SDK for live calling
  useEffect(() => {
    initializeLiveCalling()
  }, [])

  // Call timer effect
  useEffect(() => {
    if (isCallActive) {
      callTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1)
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

  const initializeLiveCalling = async () => {
    try {
      setIsInitializing(true)
      await twilioVoiceBrowser.initialize()
      setIsConnected(true)
      toast.success("Live calling ready! You can now make real calls and talk directly.")

      // Set up call event listeners
      const device = twilioVoiceBrowser.getDevice()
      if (device) {
        device.on("connect", (call: any) => {
          setIsCallActive(true)
          setCallStatus("connected")
          setCallDuration(0)
          toast.success("Call connected! You can now talk to the other person.")
        })

        device.on("disconnect", (call: any) => {
          setIsCallActive(false)
          setCallStatus("idle")
          setIsMuted(false)
          toast.info("Call ended")
        })

        device.on("error", (error: any) => {
          console.error("Call error:", error)
          setIsCallActive(false)
          setCallStatus("idle")
          toast.error(`Call error: ${error.message}`)
        })

        device.on("incoming", (call: any) => {
          toast.info(`Incoming call from ${call.parameters.From}`)
          setCallStatus("incoming")
        })
      }
    } catch (error) {
      console.error("Failed to initialize live calling:", error)
      setIsConnected(false)
      toast.error("Failed to initialize live calling. Please check your microphone permissions.")
    } finally {
      setIsInitializing(false)
    }
  }

  const makeLiveCall = async () => {
    if (!phoneNumber.trim()) {
      toast.error("Please enter a phone number")
      return
    }

    if (!isConnected) {
      toast.error("Live calling not initialized. Please refresh the page.")
      return
    }

    try {
      setCallStatus("connecting")
      toast.info("Connecting live call...")

      // Make the live call
      await twilioVoiceBrowser.makeLiveCall(phoneNumber)

      // The actual connection will be handled by the device event listeners
    } catch (error) {
      console.error("Error making live call:", error)
      setCallStatus("idle")
      toast.error("Failed to make live call. Please check your microphone permissions and try again.")
    }
  }

  const endCall = async () => {
    try {
      await twilioVoiceBrowser.hangupCall()
      // The disconnect will be handled by the device event listeners
    } catch (error) {
      console.error("Error ending call:", error)
      toast.error("Failed to end call")
    }
  }

  const toggleMute = async () => {
    try {
      const newMutedState = !isMuted
      await twilioVoiceBrowser.muteCall(newMutedState)
      setIsMuted(newMutedState)
      toast.info(newMutedState ? "Microphone muted" : "Microphone unmuted")
    } catch (error) {
      console.error("Error toggling mute:", error)
      toast.error("Failed to toggle mute")
    }
  }

  const handleVolumeChange = async (newVolume: number[]) => {
    try {
      setVolume(newVolume)
      await twilioVoiceBrowser.setVolume(newVolume[0])
    } catch (error) {
      console.error("Error setting volume:", error)
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
          <h1 className="text-3xl font-bold">Live Voice Calling</h1>
          <p className="text-muted-foreground">Make real live calls and talk directly with other people</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {isConnected ? <Wifi className="h-4 w-4 text-green-600" /> : <WifiOff className="h-4 w-4 text-red-600" />}
            <span className={`text-sm ${isConnected ? "text-green-600" : "text-red-600"}`}>
              {isInitializing ? "Initializing..." : isConnected ? "Ready for Live Calls" : "Disconnected"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Dialer Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Live Call Dialer</span>
            </CardTitle>
            <CardDescription>Make real live calls and talk directly with people</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
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
                  onClick={makeLiveCall}
                  className="flex-1"
                  size="lg"
                  disabled={!isConnected || isInitializing || callStatus === "connecting"}
                >
                  <PhoneCall className="mr-2 h-4 w-4" />
                  {callStatus === "connecting" ? "Connecting..." : "Start Live Call"}
                </Button>
              ) : (
                <Button onClick={endCall} variant="destructive" className="flex-1" size="lg">
                  <PhoneOff className="mr-2 h-4 w-4" />
                  End Call
                </Button>
              )}
            </div>

            {!isConnected && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Live calling requires microphone access. Please allow microphone permission
                  when prompted.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Live Call Controls Card */}
        <Card>
          <CardHeader>
            <CardTitle>Live Call Controls</CardTitle>
            <CardDescription>
              {isCallActive ? `Live call active - ${formatDuration(callDuration)}` : "No active call"}
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
                  </div>
                  <Badge variant="default" className="bg-green-600">
                    🔴 LIVE - You can talk now!
                  </Badge>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <Button onClick={toggleMute} variant={isMuted ? "destructive" : "outline"} size="lg">
                    {isMuted ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
                    {isMuted ? "Unmute Microphone" : "Mute Microphone"}
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center space-x-2">
                    {volume[0] > 0 ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                    <span>Call Volume: {volume[0]}%</span>
                  </Label>
                  <Slider value={volume} onValueChange={handleVolumeChange} max={100} step={1} className="w-full" />
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800">
                    <strong>Live Call Active:</strong> You can now speak directly with the other person. Use your
                    microphone to talk and speakers/headphones to listen.
                  </p>
                </div>
              </>
            )}

            {!isCallActive && (
              <div className="text-center text-muted-foreground py-8">
                <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No active call</p>
                <p className="text-sm">Enter a number and press "Start Live Call"</p>
                <p className="text-xs mt-2 text-blue-600">🎤 Real live calls - talk directly with your microphone</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Live Calling Instructions</CardTitle>
          <CardDescription>How to use the live calling feature</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Before Making a Call:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Allow microphone access when prompted</li>
                <li>• Use headphones to prevent echo</li>
                <li>• Ensure stable internet connection</li>
                <li>• Test your microphone and speakers</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">During the Call:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Speak normally into your microphone</li>
                <li>• Use mute button when not speaking</li>
                <li>• Adjust volume as needed</li>
                <li>• Click "End Call" to hang up</li>
              </ul>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Live Calling:</strong> This is real-time voice communication. Both you and the other person can
              talk and listen to each other just like a regular phone call, but through your browser.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
