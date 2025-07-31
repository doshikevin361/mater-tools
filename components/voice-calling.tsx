"use client"

import React, { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX } from "lucide-react"
import { toast } from "sonner"

interface VoiceCallingProps {
  className?: string
}

export function VoiceCalling({ className }: VoiceCallingProps) {
  const [isCallActive, setIsCallActive] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [callStatus, setCallStatus] = useState("idle")
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeakerOn, setIsSpeakerOn] = useState(true)
  const [callDuration, setCallDuration] = useState(0)
  const [device, setDevice] = useState<any>(null)
  const [call, setCall] = useState<any>(null)

  const durationRef = useRef<NodeJS.Timeout | null>(null)
  const twilioRef = useRef<any>(null)

  useEffect(() => {
    loadTwilioSDK()
    return () => {
      if (durationRef.current) {
        clearInterval(durationRef.current)
      }
      if (call) {
        call.disconnect()
      }
    }
  }, [])

  const loadTwilioSDK = async () => {
    try {
      if (typeof window !== "undefined" && !window.Twilio) {
        const script = document.createElement("script")
        script.src = "https://sdk.twilio.com/js/client/releases/2.9.0/twilio.min.js"
        script.onload = () => {
          initializeTwilio()
        }
        document.head.appendChild(script)
      } else {
        initializeTwilio()
      }
    } catch (error) {
      toast.error("Failed to load voice calling SDK")
    }
  }

  const initializeTwilio = async () => {
    try {
      const response = await fetch("/api/calling/token")
      const data = await response.json()

      if (!data.success) {
        toast.error("Failed to initialize voice calling")
        return
      }

      if (typeof window !== "undefined" && window.Twilio) {
        const twilio = window.Twilio
        const device = new twilio.Device(data.token, {
          closeProtection: true,
          codecPreferences: ["opus", "pcmu"],
          fakeLocalDTMF: true,
          enableRingingState: true,
        })

        device.on("ready", () => {
          setDevice(device)
          setCallStatus("ready")
          toast.success("Voice calling ready")
        })

        device.on("error", (error: any) => {
          setCallStatus("error")
          toast.error(`Call error: ${error.message}`)
        })

        device.on("connect", (call: any) => {
          setCall(call)
          setIsCallActive(true)
          setCallStatus("connected")
          startCallTimer()
          toast.success("Call connected")
        })

        device.on("disconnect", () => {
          setIsCallActive(false)
          setCallStatus("disconnected")
          stopCallTimer()
          setCall(null)
          toast.info("Call ended")
        })

        twilioRef.current = twilio
        setDevice(device)
      }
    } catch (error) {
      toast.error("Failed to initialize voice calling")
    }
  }

  const startCallTimer = () => {
    setCallDuration(0)
    durationRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1)
    }, 1000)
  }

  const stopCallTimer = () => {
    if (durationRef.current) {
      clearInterval(durationRef.current)
      durationRef.current = null
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const makeCall = async () => {
    if (!phoneNumber.trim()) {
      toast.error("Please enter a phone number")
      return
    }

    if (!device) {
      toast.error("Voice calling not initialized")
      return
    }

    try {
      setCallStatus("calling")
      const call = await device.connect({
        params: {
          To: phoneNumber,
        },
      })
      setCall(call)
    } catch (error) {
      setCallStatus("error")
      toast.error("Failed to make call")
    }
  }

  const endCall = () => {
    if (call) {
      call.disconnect()
    }
    if (device) {
      device.disconnectAll()
    }
    setIsCallActive(false)
    setCallStatus("idle")
    stopCallTimer()
    setCall(null)
    
    window.location.reload()
  }

  const toggleMute = () => {
    if (call) {
      if (isMuted) {
        call.mute(false)
        setIsMuted(false)
        toast.success("Microphone unmuted")
      } else {
        call.mute(true)
        setIsMuted(true)
        toast.success("Microphone muted")
      }
    }
  }

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn)
    toast.success(isSpeakerOn ? "Speaker off" : "Speaker on")
  }

  return (
    <Card className={`border border-blue-200 shadow-md overflow-hidden bg-white ${className}`}>
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
        <CardTitle className="flex items-center space-x-2">
          <Phone className="h-5 w-5 text-blue-600" />
          <span>Voice Calling</span>
          <Badge 
            variant={callStatus === "connected" ? "default" : callStatus === "calling" ? "secondary" : "outline"}
            className="ml-2"
          >
            {callStatus}
          </Badge>
        </CardTitle>
        <CardDescription>
          Make voice calls directly from your browser
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        {!isCallActive ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="Enter phone number (e.g., +1234567890)"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="border-blue-200 focus:border-blue-400"
                disabled={callStatus === "calling"}
              />
            </div>
            
            <Button
              onClick={makeCall}
              disabled={!phoneNumber.trim() || callStatus === "calling" || callStatus === "error"}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            >
              <Phone className="h-4 w-4 mr-2" />
              <span>Call Now</span>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-gray-800">{phoneNumber}</div>
              <div className="text-lg text-gray-600">{formatTime(callDuration)}</div>
              <Badge variant="default" className="bg-green-500">
                Call Active
              </Badge>
            </div>

            <div className="flex items-center justify-center space-x-4">
              <Button
                onClick={toggleMute}
                variant={isMuted ? "destructive" : "outline"}
                size="lg"
                className="rounded-full w-16 h-16"
              >
                {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
              </Button>

              <Button
                onClick={toggleSpeaker}
                variant={isSpeakerOn ? "default" : "outline"}
                size="lg"
                className="rounded-full w-16 h-16"
              >
                {isSpeakerOn ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
              </Button>

              <Button
                onClick={endCall}
                variant="destructive"
                size="lg"
                className="rounded-full w-16 h-16 bg-red-500 hover:bg-red-600"
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                {isMuted ? "Microphone muted" : "Microphone active"} • 
                {isSpeakerOn ? " Speaker on" : " Speaker off"}
              </p>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1 mt-4 pt-4 border-t border-blue-100">
          <p>• Enter the phone number you want to call</p>
          <p>• Click "Call Now" to start the call</p>
          <p>• Use the controls to mute/unmute and toggle speaker</p>
          <p>• Click "End Call" to hang up and refresh the page</p>
        </div>
      </CardContent>
    </Card>
  )
}