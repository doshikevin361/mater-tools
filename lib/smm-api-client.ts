// Indian SMM Services API Client
export interface SMMService {
  service: number
  name: string
  type: string
  category: string
  rate: string
  min: string
  max: string
  dripfeed: boolean
  refill: boolean
  cancel: boolean
  description?: string
}

export interface SMMOrder {
  order: number
  charge: string
  start_count: string
  status: string
  remains: string
  currency: string
}

export interface SMMOrderStatus {
  charge: string
  start_count: string
  status: string
  remains: string
  currency: string
}

export interface SMMBalance {
  balance: string
  currency: string
}

export class SMMApiClient {
  private apiUrl = "https://indiansmmservices.com/api/v2"
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  private async makeRequest(data: Record<string, any>): Promise<any> {
    const formData = new URLSearchParams()
    formData.append("key", this.apiKey)

    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, String(value))
    })

    try {
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error("SMM API Error:", error)
      throw error
    }
  }

  // Get all available services
  async getServices(): Promise<SMMService[]> {
    return this.makeRequest({ action: "services" })
  }

  // Get services filtered by category/platform
  async getServicesByCategory(category: string): Promise<SMMService[]> {
    const services = await this.getServices()
    return services.filter(
      (service) =>
        service.category.toLowerCase().includes(category.toLowerCase()) ||
        service.name.toLowerCase().includes(category.toLowerCase()),
    )
  }

  // Place an order
  async createOrder(orderData: {
    service: number
    link: string
    quantity: number
    runs?: number
    interval?: number
    comments?: string
    usernames?: string
    hashtags?: string
    hashtag?: string
    username?: string
    media?: string
    min?: number
    max?: number
    posts?: number
    delay?: number
    expiry?: string
    old_posts?: number
    answer_number?: string
  }): Promise<SMMOrder> {
    return this.makeRequest({
      action: "add",
      ...orderData,
    })
  }

  // Get order status
  async getOrderStatus(orderId: number): Promise<SMMOrderStatus> {
    return this.makeRequest({
      action: "status",
      order: orderId,
    })
  }

  // Get multiple order statuses
  async getMultipleOrderStatus(orderIds: number[]): Promise<SMMOrderStatus[]> {
    return this.makeRequest({
      action: "status",
      orders: orderIds.join(","),
    })
  }

  // Get account balance
  async getBalance(): Promise<SMMBalance> {
    return this.makeRequest({ action: "balance" })
  }

  // Refill order
  async refillOrder(orderId: number): Promise<any> {
    return this.makeRequest({
      action: "refill",
      order: orderId,
    })
  }

  // Cancel orders
  async cancelOrders(orderIds: number[]): Promise<any> {
    return this.makeRequest({
      action: "cancel",
      orders: orderIds.join(","),
    })
  }

  // Helper method to find service by name/type
  async findService(platform: string, type: string): Promise<SMMService | null> {
    const services = await this.getServices()

    const platformKeywords = {
      instagram: ["instagram", "ig"],
      facebook: ["facebook", "fb"],
      twitter: ["twitter", "x.com"],
      youtube: ["youtube", "yt"],
    }

    const typeKeywords = {
      followers: ["followers", "follow"],
      likes: ["likes", "like", "heart"],
      comments: ["comments", "comment"],
      views: ["views", "view"],
      shares: ["shares", "share", "retweet"],
      subscribers: ["subscribers", "subscribe"],
    }

    const platformKeys = platformKeywords[platform.toLowerCase()] || [platform.toLowerCase()]
    const typeKeys = typeKeywords[type.toLowerCase()] || [type.toLowerCase()]

    return (
      services.find((service) => {
        const serviceName = service.name.toLowerCase()
        const serviceCategory = service.category.toLowerCase()

        const hasPlatform = platformKeys.some((key) => serviceName.includes(key) || serviceCategory.includes(key))
        const hasType = typeKeys.some((key) => serviceName.includes(key) || serviceCategory.includes(key))

        return hasPlatform && hasType
      }) || null
    )
  }
}

// Singleton instance
let smmClient: SMMApiClient | null = null

export function getSMMClient(): SMMApiClient {
  if (!smmClient) {
    const apiKey = process.env.SMM_API_KEY || "c07d09cde72e0e7d0d9ca77097db8fb3"
    smmClient = new SMMApiClient(apiKey)
  }
  return smmClient
}

// Helper function to calculate estimated delivery time
export function getEstimatedDeliveryTime(quantity: number, serviceType: string): string {
  const baseTime = {
    followers: 24, // hours
    likes: 2,
    comments: 6,
    views: 1,
    shares: 4,
  }

  const multiplier = Math.ceil(quantity / 1000)
  const hours = (baseTime[serviceType] || 12) * multiplier

  if (hours < 24) {
    return `${hours} hours`
  } else {
    const days = Math.ceil(hours / 24)
    return `${days} days`
  }
}

// Helper function to get service pricing
export function calculateServiceCost(service: SMMService, quantity: number): number {
  const rate = Number.parseFloat(service.rate)
  const cost = (rate * quantity) / 1000 // Rate is usually per 1000
  return Math.max(cost, 0.01) // Minimum cost
}
