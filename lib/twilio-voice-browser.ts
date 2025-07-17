"use client"

import { Device, type Connection } from "@twilio/voice-sdk"

export interface VoiceDeviceConfig {
  token: string
  debug?: boolean
  edge?: string[]
}

export interface CallOptions {
  To: string
  [key: string]: string
}

export class TwilioVoiceManager {
  private device: Device | null = null
  private currentCall: Connection | null = null
  private isInitialized = false

  constructor() {
    this.device = null
    this.currentCall = null
    this.isInitialized = false
  }

  async initialize(config: VoiceDeviceConfig): Promise<boolean> {
    try {
      console.log("Initializing Twilio Voice Device...")

      // Create device with access token
      if (this.device) {
        // If a device already exists, shut it down cleanly
        this.device.destroy()
        this.device = null
      }

      this.device = new Device(config.token, {
        codecPreferences: ["opus", "pcmu"],
        fakeLocalDTMF: true,
        enableRingingState: true,
      })

      // Set up event listeners
      this.setupEventListeners()

      // Register the device
      await new Promise<void>((resolve, reject) => {
        if (!this.device) return reject(new Error("Device not initialised"))

        this.device.on("ready", () => resolve())
        this.device.on("error", (e) => reject(e))
      })

      this.isInitialized = true
      console.log("Twilio Voice Device initialized successfully")

      return true
    } catch (error) {
      console.error("Error initializing Twilio Voice Device:", error)
      this.isInitialized = false
      return false
    }
  }

  private setupEventListeners(): void {
    if (!this.device) return

    this.device.on("ready", () => {
      console.log("Device registered successfully")
    })

    this.device.on("error", (error) => {
      console.error("Device error:", error)
    })

    this.device.on("incoming", (call) => {
      console.log("Incoming call received:", call)
      this.currentCall = call

      // Set up call event listeners
      this.setupCallEventListeners(call)
    })

    this.device.on("tokenWillExpire", async () => {
      console.log("Token will expire, refreshing...")
      await this.refreshToken()
    })
  }

  private setupCallEventListeners(call: Connection): void {
    call.on("accept", () => {
      console.log("Call accepted")
    })

    call.on("disconnect", () => {
      console.log("Call disconnected")
      this.currentCall = null
    })

    call.on("cancel", () => {
      console.log("Call cancelled")
      this.currentCall = null
    })

    call.on("reject", () => {
      console.log("Call rejected")
      this.currentCall = null
    })

    call.on("error", (error: any) => {
      console.error("Call error:", error)
      this.currentCall = null
    })
  }

  async makeCall(phoneNumber: string): Promise<boolean> {
    try {
      if (!this.device || !this.isInitialized) {
        throw new Error("Device not initialized")
      }

      if (this.currentCall) {
        throw new Error("Another call is already in progress")
      }

      console.log("Making call to:", phoneNumber)

      // Format phone number
      let formattedNumber = phoneNumber
      if (phoneNumber.startsWith("91") && !phoneNumber.startsWith("+91")) {
        formattedNumber = `+${phoneNumber}`
      } else if (phoneNumber.length === 10 && !phoneNumber.startsWith("+")) {
        formattedNumber = `+91${phoneNumber}`
      }

      const callOptions: CallOptions = {
        To: formattedNumber,
      }

      this.currentCall = this.device.connect(callOptions)
      this.setupCallEventListeners(this.currentCall)

      console.log("Call initiated successfully")
      return true
    } catch (error) {
      console.error("Error making call:", error)
      return false
    }
  }

  async hangupCall(): Promise<void> {
    try {
      if (this.currentCall) {
        this.currentCall.disconnect()
        this.currentCall = null
        console.log("Call hung up")
      }
    } catch (error) {
      console.error("Error hanging up call:", error)
    }
  }

  async acceptCall(): Promise<void> {
    try {
      if (this.currentCall) {
        this.currentCall.accept()
        console.log("Call accepted")
      }
    } catch (error) {
      console.error("Error accepting call:", error)
    }
  }

  async rejectCall(): Promise<void> {
    try {
      if (this.currentCall) {
        this.currentCall.reject()
        this.currentCall = null
        console.log("Call rejected")
      }
    } catch (error) {
      console.error("Error rejecting call:", error)
    }
  }

  async muteCall(muted: boolean): Promise<void> {
    try {
      if (this.currentCall) {
        this.currentCall.mute(muted)
        console.log(`Call ${muted ? "muted" : "unmuted"}`)
      }
    } catch (error) {
      console.error("Error muting/unmuting call:", error)
    }
  }

  async refreshToken(): Promise<void> {
    try {
      const response = await fetch("/api/calling/token", {
        method: "GET",
      })

      const data = await response.json()

      if (data.success && this.device) {
        this.device.updateToken(data.token)
        console.log("Token refreshed successfully")
      }
    } catch (error) {
      console.error("Error refreshing token:", error)
    }
  }

  getCallStatus(): string {
    if (!this.currentCall) return "idle"
    return this.currentCall.status()
  }

  isCallActive(): boolean {
    return this.currentCall !== null
  }

  getDevice(): Device | null {
    return this.device
  }

  async destroy(): Promise<void> {
    try {
      if (this.currentCall) {
        this.currentCall.disconnect()
        this.currentCall = null
      }

      if (this.device) {
        this.device.destroy()
        this.device = null
      }

      this.isInitialized = false
      console.log("Twilio Voice Device destroyed")
    } catch (error) {
      console.error("Error destroying device:", error)
    }
  }
}

/**
 * Singleton – import { twilioVoiceBrowser } from "@/lib/twilio-voice-browser"
 */
export const twilioVoiceBrowser = new TwilioVoiceManager()
export const voiceManager = twilioVoiceBrowser
