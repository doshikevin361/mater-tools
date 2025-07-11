declare global {
  interface Window {
    Twilio: any
  }
}

export class TwilioVoiceBrowser {
  private device: any = null
  private isInitialized = false

  async initialize(): Promise<boolean> {
    try {
      if (this.isInitialized && this.device) {
        return true
      }

      await this.loadTwilioSDK()

      const tokenResponse = await fetch("/api/calling/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identity: `user_${Date.now()}` }),
      })

      if (!tokenResponse.ok) {
        throw new Error("Failed to get access token")
      }

      const { token } = await tokenResponse.json()

      this.device = new window.Twilio.Device(token, {
        logLevel: 1,
        answerOnBridge: true,
      })

      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Device setup timeout")), 10000)

        this.device.on("ready", () => {
          clearTimeout(timeout)
          this.isInitialized = true
          resolve(true)
        })

        this.device.on("error", (error: any) => {
          clearTimeout(timeout)
          reject(error)
        })
      })

      return true
    } catch (error) {
      throw error
    }
  }

  private async loadTwilioSDK(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.Twilio) {
        resolve()
        return
      }

      const existingScript = document.querySelector('script[src*="twilio.min.js"]')
      if (existingScript) {
        existingScript.addEventListener("load", () => resolve())
        existingScript.addEventListener("error", reject)
        return
      }

      const script = document.createElement("script")
      script.src = "https://cdn.jsdelivr.net/npm/@twilio/voice-sdk@2.11.0/dist/twilio.min.js"
      script.crossOrigin = "anonymous"
      script.onload = () => resolve()
      script.onerror = reject
      document.head.appendChild(script)
    })
  }

  async makeCall(phoneNumber: string): Promise<any> {
    if (!this.device || !this.isInitialized) {
      throw new Error("Device not initialized")
    }

    let formattedNumber = phoneNumber.replace(/\D/g, "")

    if (formattedNumber.length === 10) {
      formattedNumber = "+91" + formattedNumber
    } else if (formattedNumber.length === 12 && formattedNumber.startsWith("91")) {
      formattedNumber = "+" + formattedNumber
    } else if (!formattedNumber.startsWith("+91")) {
      formattedNumber = "+91" + formattedNumber.slice(-10)
    }

    const connection = this.device.connect({ To: formattedNumber })

    await fetch("/api/calling/make-call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber: formattedNumber }),
    })

    return connection
  }

  onConnectionStateChange(callback: (state: string) => void) {
    if (this.device) {
      this.device.on("connect", () => callback("connected"))
      this.device.on("disconnect", () => callback("disconnected"))
      this.device.on("error", () => callback("error"))
    }
  }

  hangUp() {
    if (this.device) {
      this.device.disconnectAll()
    }
  }

  mute() {
    if (this.device && this.device.activeConnection) {
      this.device.activeConnection.mute(true)
    }
  }

  unmute() {
    if (this.device && this.device.activeConnection) {
      this.device.activeConnection.mute(false)
    }
  }

  setVolume(volume: number) {
    if (this.device && this.device.activeConnection) {
      this.device.activeConnection.volume(volume)
    }
  }

  isConnected(): boolean {
    return this.device && this.device.activeConnection && this.device.activeConnection.status() === "open"
  }
}
