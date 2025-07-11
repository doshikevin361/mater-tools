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
  private initializationPromise: Promise<void> | null = null

  async initialize() {
    // Prevent multiple initialization attempts
    if (this.initializationPromise) {
      return this.initializationPromise
    }

    if (this.isInitialized) return

    this.initializationPromise = this.doInitialize()
    return this.initializationPromise
  }

  private async doInitialize() {
    try {
      console.log("Starting Twilio Voice SDK initialization...")

      // Load Twilio Voice SDK
      if (!window.Twilio) {
        console.log("Loading Twilio SDK...")
        await this.loadTwilioSDK()
      }

      console.log("Twilio SDK loaded, getting access token...")

      // Get access token from server
      const response = await fetch("/api/calling/token", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to get access token")
      }

      this.token = data.token
      this.identity = data.identity

      console.log("Access token received, initializing Twilio device...")

      // Initialize Twilio Device
      this.device = new window.Twilio.Device(this.token, {
        logLevel: 1,
        answerOnBridge: true,
        fakeLocalDTMF: true,
        enableRingingState: true,
        allowIncomingWhileBusy: true,
        codecPreferences: ["opus", "pcmu"],
        enableImprovedSignalingErrorPrecision: true,
      })

      // Set up device event listeners
      this.setupDeviceListeners()

      // Wait for device to be ready
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Device initialization timeout after 15 seconds"))
        }, 15000) // 15 second timeout

        this.device.on("ready", () => {
          console.log("Twilio device is ready!")
          clearTimeout(timeout)
          resolve(true)
        })

        this.device.on("error", (error: any) => {
          console.error("Device initialization error:", error)
          clearTimeout(timeout)
          reject(error)
        })

        // Start the device registration process
        this.device.register()
      })

      this.isInitialized = true
      console.log("Twilio Voice SDK initialized successfully")
    } catch (error) {
      console.error("Failed to initialize Twilio Voice SDK:", error)
      this.isInitialized = false
      this.initializationPromise = null
      throw error
    }
  }

  private async loadTwilioSDK(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if script already exists
      const existingScript = document.querySelector('script[src*="twilio"]')
      if (existingScript && window.Twilio) {
        console.log("Twilio SDK already loaded")
        resolve()
        return
      }

      const script = document.createElement("script")
      script.src = "https://cdn.jsdelivr.net/npm/@twilio/voice-sdk@2.11.0/dist/twilio.min.js"
      script.crossOrigin = "anonymous"
      script.async = true

      script.onload = () => {
        console.log("Twilio SDK script loaded")
        // Wait a bit for the SDK to be fully available
        setTimeout(() => {
          if (window.Twilio) {
            console.log("Twilio SDK is available")
            resolve()
          } else {
            reject(new Error("Twilio SDK not available after loading"))
          }
        }, 500)
      }

      script.onerror = (error) => {
        console.error("Failed to load Twilio SDK script:", error)
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
      console.error("Twilio Device error:", error.message || error)
    })

    this.device.on("connect", (call: any) => {
      console.log("Call connected successfully")
      this.activeCall = call

      // Set up call event listeners
      call.on("disconnect", () => {
        console.log("Call disconnected")
        this.activeCall = null
      })
    })

    this.device.on("disconnect", (call: any) => {
      console.log("Call disconnected from device")
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

    this.device.on("offline", () => {
      console.log("Device went offline")
    })

    this.device.on("registered", () => {
      console.log("Device registered successfully")
    })

    this.device.on("unregistered", () => {
      console.log("Device unregistered")
    })
  }

  async makeCall(phoneNumber: string): Promise<any> {
    if (!this.isInitialized) {
      throw new Error("Device not initialized. Please refresh the page and try again.")
    }

    if (!this.device) {
      throw new Error("Twilio device not available")
    }

    try {
      // Format Indian phone number
      const formattedNumber = this.formatIndianNumber(phoneNumber)

      console.log("Making call to:", formattedNumber)

      // Check if device is ready
      if (!this.isDeviceReady()) {
        throw new Error("Device not ready. Please wait a moment and try again.")
      }

      // Request microphone permission explicitly
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true })
        console.log("Microphone permission granted")
      } catch (permError) {
        throw new Error("Microphone permission required. Please allow microphone access and try again.")
      }

      const call = await this.device.connect({
        params: {
          To: formattedNumber,
        },
      })

      this.activeCall = call
      console.log("Call initiated successfully")
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
    return this.device && (this.device.state === "ready" || this.device.status() === "ready")
  }

  getDeviceState(): string {
    if (!this.device) return "not_initialized"
    return this.device.state || this.device.status() || "unknown"
  }
}

export const twilioVoiceBrowser = new TwilioVoiceBrowser()
