import fetch from "node-fetch"

class MSG91Service {
  private authKey: string
  private baseUrl: string

  constructor() {
    this.authKey = process.env.MSG91_AUTH_KEY || "demo-key"
    this.baseUrl = "https://control.msg91.com/api/v5"
  }

  // WhatsApp API
  async sendWhatsAppMessage(
    mobile: string,
    message: string,
    mediaUrl?: string,
    mediaType?: "image" | "video" | "document",
  ) {
    try {
      const payload: any = {
        integrated_number: process.env.MSG91_WHATSAPP_NUMBER || "your-whatsapp-number",
        content_type: mediaUrl ? "media" : "text",
        payload: {
          to: mobile,
          type: mediaUrl ? mediaType || "image" : "text",
          ...(mediaUrl
            ? {
                [mediaType || "image"]: {
                  url: mediaUrl,
                  caption: message,
                },
              }
            : { text: message }),
        },
      }

      const response = await fetch(`${this.baseUrl}/whatsapp/whatsapp-outbound-message/bulk/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authkey: this.authKey,
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (response.ok) {
        return {
          success: true,
          messageId: result.data?.id,
          response: result,
        }
      } else {
        throw new Error(result.message || "WhatsApp send failed")
      }
    } catch (error) {
      console.error("WhatsApp send error:", error)
      throw error
    }
  }

  async sendBulkWhatsApp(
    contacts: Array<{ mobile: string; name?: string }>,
    message: string,
    mediaUrl?: string,
    mediaType?: "image" | "video" | "document",
  ) {
    // Simulate API call for demo
    console.log("MSG91 WhatsApp API called with:", { contacts: contacts.length, message })

    return [
      {
        batch: 1,
        successful: contacts.length,
        failed: 0,
        results: contacts.map(() => ({
          status: "fulfilled",
          value: { messageId: `wa_${Date.now()}_${Math.random()}` },
        })),
      },
    ]
  }

  // SMS API
  async sendSMS(mobile: string, message: string, senderId?: string) {
    try {
      const payload = {
        sender: senderId || process.env.MSG91_SENDER_ID || "BRDBUZ",
        route: "4", // Transactional route
        country: "91", // India country code
        sms: [
          {
            message,
            to: [mobile],
          },
        ],
      }

      const response = await fetch(`${this.baseUrl}/sms/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authkey: this.authKey,
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (response.ok) {
        return {
          success: true,
          messageId: result.data?.id,
          response: result,
        }
      } else {
        throw new Error(result.message || "SMS send failed")
      }
    } catch (error) {
      console.error("SMS send error:", error)
      throw error
    }
  }

  async sendBulkSMS(contacts: Array<{ mobile: string; name?: string }>, message: string, senderId?: string) {
    // Simulate API call for demo
    console.log("MSG91 SMS API called with:", { contacts: contacts.length, message, senderId })

    return {
      success: true,
      totalSent: contacts.length,
      messageId: `sms_${Date.now()}_${Math.random()}`,
    }
  }

  // Voice API
  async makeVoiceCall(mobile: string, message: string, voiceType: "tts" | "audio", audioUrl?: string) {
    try {
      const payload = {
        recipients: [mobile],
        ...(voiceType === "tts"
          ? {
              message,
              voice: "female", // or 'male'
              language: "en",
            }
          : { audio_url: audioUrl }),
      }

      const response = await fetch(`${this.baseUrl}/voice/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authkey: this.authKey,
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (response.ok) {
        return {
          success: true,
          callId: result.data?.id,
          response: result,
        }
      } else {
        throw new Error(result.message || "Voice call failed")
      }
    } catch (error) {
      console.error("Voice call error:", error)
      throw error
    }
  }

  async sendBulkVoice(
    contacts: Array<{ mobile: string; name?: string }>,
    message: string,
    voiceType: "tts" | "audio",
    audioUrl?: string,
  ) {
    // Simulate API call for demo
    console.log("MSG91 Voice API called with:", { contacts: contacts.length, message, voiceType })

    return [
      {
        batch: 1,
        successful: contacts.length,
        failed: 0,
        results: contacts.map(() => ({
          status: "fulfilled",
          value: { callId: `voice_${Date.now()}_${Math.random()}` },
        })),
      },
    ]
  }

  // Get delivery reports
  async getDeliveryReport(messageId: string, type: "sms" | "whatsapp" | "voice") {
    try {
      const response = await fetch(`${this.baseUrl}/${type}/report/${messageId}`, {
        method: "GET",
        headers: {
          Authkey: this.authKey,
        },
      })

      const result = await response.json()
      return result
    } catch (error) {
      console.error("Delivery report error:", error)
      throw error
    }
  }
}

export const msg91Service = new MSG91Service()
