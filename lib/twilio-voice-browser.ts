declare global {
  interface Window {
    Twilio: any
  }
}

export class TwilioVoiceBrowser {
  private device: any = null
  private activeCall: any = null
  private isInitialized = false
  private token = ""

  async initialize() {
    if (this.isInitialized) return

    try {
      // Load Twilio Voice SDK
      if (!window.Twilio) {
        await this.loadTwilioSDK()
      }

      // Get access token from server
      const response = await fetch("/api/calling/token")
      const data = await response.json()

      if (!data.success) {
        throw new Error("Failed to get access token")
      }

      this.token = data.token

      // Initialize Twilio Device
      this.device = new window.Twilio.Device(this.token, {
        logLevel: 1,
        answerOnBridge: true,
        fakeLocalDTMF: true,
        enableRingingState: true,
      })

      // Set up device event listeners
      this.setupDeviceListeners()

      this.isInitialized = true
      console.log("Twilio Voice SDK initialized successfully")
    } catch (error) {
      console.error("Failed to initialize Twilio Voice SDK:", error)
      throw error
    }
  }

  private async loadTwilioSDK(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script")
      script.src = "https://cdn.jsdelivr.net/npm/@twilio/voice-sdk@2.11.0/dist/twilio.min.js"
      script.crossOrigin = "anonymous"
      script.onload = () => resolve()
      script.onerror = () => reject(new Error("Failed to load Twilio SDK"))
      document.head.appendChild(script)
    })
  }

  private setupDeviceListeners() {
    this.device.on("ready", () => {
      console.log("Twilio Device is ready for connections")
    })

    this.device.on("error", (error: any) => {
      console.error("Twilio Device error:", error)
    })

    this.device.on("connect", (call: any) => {
      console.log("Call connected")
      this.activeCall = call
    })

    this.device.on("disconnect", (call: any) => {
      console.log("Call disconnected")
      this.activeCall = null
    })

    this.device.on("incoming", (call: any) => {
      console.log("Incoming call from:", call.parameters.From)
      // Handle incoming call
      this.activeCall = call
    })
  }

  async makeCall(phoneNumber: string): Promise<any> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    try {
      // Format Indian phone number
      const formattedNumber = this.formatIndianNumber(phoneNumber)

      console.log("Making call to:", formattedNumber)

      const call = await this.device.connect({
        params: {
          To: formattedNumber,
        },
      })

      this.activeCall = call
      return call
    } catch (error) {
      console.error("Error making call:", error)
      throw error
    }
  }

  async answerCall(): Promise<void> {
    if (this.activeCall) {
      this.activeCall.accept()
    }
  }

  async hangupCall(): Promise<void> {
    console.log("Hanging up call, activeCall exists:", !!this.activeCall)
    
    if (this.activeCall) {
      try {
        // Try to disconnect the call
        this.activeCall.disconnect()
        console.log("Call disconnect initiated")
      } catch (error) {
        console.error("Error during call disconnect:", error)
      } finally {
        // Always clear the active call reference
        this.activeCall = null
        console.log("Active call reference cleared")
      }
    } else {
      console.log("No active call to hang up")
    }
  }

  async muteCall(muted: boolean): Promise<void> {
    if (this.activeCall) {
      this.activeCall.mute(muted)
    }
  }

  async setVolume(volume: number): Promise<void> {
    if (this.activeCall) {
      // Volume is between 0.0 and 1.0
      this.activeCall.volume(volume / 100)
    }
  }

  private formatIndianNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, "")

    // If it's already 12 digits starting with 91, use as is
    if (cleaned.startsWith("91") && cleaned.length === 12) {
      return `+${cleaned}`
    }

    // If it's 10 digits, add +91 prefix
    if (cleaned.length === 10) {
      return `+91${cleaned}`
    }

    // If it starts with 91 but not 12 digits, assume it's missing country code
    if (cleaned.startsWith("91")) {
      return `+${cleaned}`
    }

    // Default: add +91 to any number
    return `+91${cleaned}`
  }

  getCallStatus(): string {
    if (!this.activeCall) return "idle"
    return this.activeCall.status()
  }

  isCallActive(): boolean {
    return this.activeCall !== null && this.activeCall.status() === "open"
  }

  getDevice() {
    return this.device
  }

  getActiveCall() {
    return this.activeCall
  }
}

export const twilioVoiceBrowser = new TwilioVoiceBrowser()
