// API client utility functions
const API_BASE_URL = "/api"

export class ApiClient {
  private static async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "API request failed")
      }

      return data
    } catch (error) {
      console.error("API Error:", error)
      throw error
    }
  }

  // Auth APIs
  static async login(email: string, password: string) {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
  }

  static async signup(userData: any) {
    return this.request("/auth/signup", {
      method: "POST",
      body: JSON.stringify(userData),
    })
  }

  // WhatsApp APIs
  static async sendWhatsApp(campaignData: any) {
    return this.request("/whatsapp/send", {
      method: "POST",
      body: JSON.stringify(campaignData),
    })
  }

  static async getWhatsAppCampaigns() {
    return this.request("/whatsapp/campaigns")
  }

  // Email APIs
  static async sendEmail(campaignData: any) {
    return this.request("/email/send", {
      method: "POST",
      body: JSON.stringify(campaignData),
    })
  }

  // Voice APIs
  static async sendVoice(campaignData: any) {
    return this.request("/voice/send", {
      method: "POST",
      body: JSON.stringify(campaignData),
    })
  }

  // SMS APIs
  static async sendSMS(campaignData: any) {
    return this.request("/sms/send", {
      method: "POST",
      body: JSON.stringify(campaignData),
    })
  }

  // Contacts APIs
  static async getContacts(params?: any) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : ""
    return this.request(`/contacts${queryString}`)
  }

  static async createContact(contactData: any) {
    return this.request("/contacts", {
      method: "POST",
      body: JSON.stringify(contactData),
    })
  }

  // Analytics APIs
  static async getDashboardAnalytics(period = "30d") {
    return this.request(`/analytics/dashboard?period=${period}`)
  }

  // User APIs
  static async getUserProfile() {
    return this.request("/user/profile")
  }

  static async updateUserProfile(userData: any) {
    return this.request("/user/profile", {
      method: "PUT",
      body: JSON.stringify(userData),
    })
  }

  // Billing APIs
  static async getBillingData() {
    return this.request("/billing")
  }

  static async addFunds(amount: number, paymentMethod: string) {
    return this.request("/billing", {
      method: "POST",
      body: JSON.stringify({ amount, paymentMethod }),
    })
  }

  // Templates APIs
  static async getTemplates(platform?: string, category?: string) {
    const params = new URLSearchParams()
    if (platform) params.append("platform", platform)
    if (category) params.append("category", category)
    return this.request(`/templates?${params.toString()}`)
  }

  static async createTemplate(templateData: any) {
    return this.request("/templates", {
      method: "POST",
      body: JSON.stringify(templateData),
    })
  }
}
