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
  private identity = ""

  async initialize() {
    if (this.isInitialized) return

    try {
      console.log("Initializing Twilio Voice SDK...")

      // Load Twilio Voice SDK
      if (!window.Twilio) {
        await this.loadTwilioSDK()
      }

      // Get access token from server
      const response = await fetch("/api/calling/token")
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to get access token")
      }

      this.token = data.token
      this.identity = data.identity

      console.log("Access token received, initializing device...")

      // Initialize Twilio Device
      this.device = new window.Twilio.Device(this.token, {
        logLevel: 1,
        answerOnBridge: true,
        fakeLocalDTMF: true,
        enableRingingState: true,
        allowIncomingWhileBusy: true,
      })

      // Set up device event listeners
      this.setupDeviceListeners()

      // Wait for device to be ready
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Device initialization timeout"))
        }, 10000) // 10 second timeout

        this.device.on("ready", () => {
          clearTimeout(timeout)
          resolve(true)
        })

        this.device.on("error", (error: any) => {
          clearTimeout(timeout)
          reject(error)
        })
      })

      this.isInitialized = true
      console.log("Twilio Voice SDK initialized successfully")
    } catch (error) {
      console.error("Failed to initialize Twilio Voice SDK:", error)
      this.isInitialized = false
      throw error
    }
  }

  private async loadTwilioSDK(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if script already exists
      const existingScript = document.querySelector('script[src*="twilio"]')
      if (existingScript) {
        if (window.Twilio) {
          resolve()
          return
        }
      }

      const script = document.createElement("script")
      script.src = "https://cdn.jsdelivr.net/npm/@twilio/voice-sdk@2.11.0/dist/twilio.min.js"
      script.crossOrigin = "anonymous"
      script.async = true

      script.onload = () => {
        console.log("Twilio SDK loaded successfully")
        // Wait a bit for the SDK to be fully available
        setTimeout(() => {
          if (window.Twilio) {
            resolve()
          } else {
            reject(new Error("Twilio SDK not available after loading"))
          }
        }, 100)
      }

      script.onerror = (error) => {
        console.error("Failed to load Twilio SDK:", error)
        reject(new Error("Failed to load Twilio SDK"))
      }

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
      console.log("Call connected successfully")
      this.activeCall = call
    })

    this.device.on("disconnect", (call: any) => {
      console.log("Call disconnected")
      this.activeCall = null
    })

    this.device.on("incoming", (call: any) => {
      console.log("Incoming call from:", call.parameters.From)
      this.activeCall = call
    })

    this.device.on("cancel", (call: any) => {
      console.log("Call cancelled")
      this.activeCall = null
    })
  }

  async makeCall(phoneNumber: string): Promise<any> {
    if (!this.isInitialized) {
      throw new Error("Device not initialized. Please refresh the page.")
    }

    if (!this.device) {
      throw new Error("Twilio device not available")
    }

    try {
      // Format Indian phone number
      const formattedNumber = this.formatIndianNumber(phoneNumber)

      console.log("Making call to:", formattedNumber)

      // Check if device is ready
      if (this.device.state !== "ready") {
        throw new Error("Device not ready. Please wait and try again.")
      }

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
    if (this.activeCall) {
      this.activeCall.disconnect()
      this.activeCall = null
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

  getIdentity() {
    return this.identity
  }

  isDeviceReady(): boolean {
    return this.device && this.device.state === "ready"
  }
}

export const twilioVoiceBrowser = new TwilioVoiceBrowser()
