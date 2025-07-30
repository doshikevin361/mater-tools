import { useState, useEffect, useCallback } from "react"
import { toast } from "@/hooks/use-toast"

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

export interface SMMCategory {
  id: string
  name: string
  icon: string
  count: number
}

export interface SMMOrder {
  id: string
  service: SMMService
  quantity: number
  targetUrl: string
  totalCost: number
  status: "pending" | "processing" | "completed" | "failed"
  orderId?: number
  createdAt: string
}

export interface UseSMMServiceProps {
  platform: "instagram" | "facebook" | "twitter" | "youtube"
}

export const useSMMService = ({ platform }: UseSMMServiceProps) => {
  const [services, setServices] = useState<SMMService[]>([])
  const [categories, setCategories] = useState<SMMCategory[]>([])
  const [filteredServices, setFilteredServices] = useState<SMMService[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Platform-specific category mapping
  const categoryMapping = {
    instagram: [
      { id: "followers", name: "Followers", icon: "👥", keywords: ["followers", "follow"] },
      { id: "likes", name: "Likes", icon: "❤️", keywords: ["likes", "like", "heart"] },
      { id: "comments", name: "Comments", icon: "💬", keywords: ["comments", "comment"] },
      { id: "views", name: "Views", icon: "👁️", keywords: ["views", "view"] },
      { id: "story_views", name: "Story Views", icon: "📖", keywords: ["story", "stories"] },
      { id: "reel_views", name: "Reel Views", icon: "🎬", keywords: ["reel", "reels"] },
    ],
    facebook: [
      { id: "followers", name: "Followers", icon: "👥", keywords: ["followers", "follow", "page like"] },
      { id: "likes", name: "Likes", icon: "❤️", keywords: ["likes", "like", "heart", "post like"] },
      { id: "comments", name: "Comments", icon: "💬", keywords: ["comments", "comment"] },
      { id: "shares", name: "Shares", icon: "🔄", keywords: ["shares", "share"] },
      { id: "views", name: "Views", icon: "👁️", keywords: ["views", "view", "video view"] },
    ],
    twitter: [
      { id: "followers", name: "Followers", icon: "👥", keywords: ["followers", "follow"] },
      { id: "likes", name: "Likes", icon: "❤️", keywords: ["likes", "like", "heart"] },
      { id: "retweets", name: "Retweets", icon: "🔄", keywords: ["retweets", "retweet", "share"] },
      { id: "comments", name: "Comments", icon: "💬", keywords: ["comments", "comment", "reply"] },
      { id: "views", name: "Views", icon: "👁️", keywords: ["views", "view"] },
    ],
    youtube: [
      { id: "subscribers", name: "Subscribers", icon: "👥", keywords: ["subscribers", "subscribe"] },
      { id: "likes", name: "Likes", icon: "❤️", keywords: ["likes", "like"] },
      { id: "comments", name: "Comments", icon: "💬", keywords: ["comments", "comment"] },
      { id: "views", name: "Views", icon: "👁️", keywords: ["views", "view"] },
      { id: "shares", name: "Shares", icon: "🔄", keywords: ["shares", "share"] },
      { id: "watch_time", name: "Watch Time", icon: "⏱️", keywords: ["watch", "time"] },
    ],
  }

  // Fetch all services for the platform
  const fetchServices = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/smm/services?platform=${platform}`)
      const data = await response.json()

      if (data.success) {
        setServices(data.services)
        generateCategories(data.services)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch services",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching services:", error)
      toast({
        title: "Error",
        description: "Failed to connect to SMM services",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [platform])

  // Generate categories based on available services
  const generateCategories = (serviceList: SMMService[]) => {
    const platformCategories = categoryMapping[platform] || []
    const availableCategories: SMMCategory[] = []

    platformCategories.forEach((category) => {
      const matchingServices = serviceList.filter((service) => {
        const serviceName = service.name.toLowerCase()
        const serviceCategory = service.category.toLowerCase()
        
        return category.keywords.some((keyword) => 
          serviceName.includes(keyword) || serviceCategory.includes(keyword)
        )
      })

      if (matchingServices.length > 0) {
        availableCategories.push({
          ...category,
          count: matchingServices.length,
        })
      }
    })

    setCategories(availableCategories)
  }

  // Filter services by selected category
  const filterServicesByCategory = useCallback((categoryId: string) => {
    setSelectedCategory(categoryId)
    
    const category = categoryMapping[platform]?.find(cat => cat.id === categoryId)
    if (!category) {
      setFilteredServices([])
      return
    }

    const filtered = services.filter((service) => {
      const serviceName = service.name.toLowerCase()
      const serviceCategory = service.category.toLowerCase()
      
      return category.keywords.some((keyword) => 
        serviceName.includes(keyword) || serviceCategory.includes(keyword)
      )
    })

    setFilteredServices(filtered)
  }, [services, platform])

  // Calculate service cost
  const calculateCost = (service: SMMService, quantity: number): number => {
    const rate = parseFloat(service.rate)
    const cost = (rate * quantity) / 1000 // Rate is usually per 1000
    return Math.max(cost, 0.01) // Minimum cost
  }

  // Get estimated delivery time
  const getEstimatedDelivery = (service: SMMService, quantity: number): string => {
    const baseTime = {
      followers: 24, // hours
      likes: 2,
      comments: 6,
      views: 1,
      shares: 4,
      subscribers: 48,
      retweets: 3,
    }

    const serviceType = service.name.toLowerCase()
    let hours = 12 // default

    Object.entries(baseTime).forEach(([type, time]) => {
      if (serviceType.includes(type)) {
        hours = time
      }
    })

    const multiplier = Math.ceil(quantity / 1000)
    const totalHours = hours * multiplier

    if (totalHours < 24) {
      return `${totalHours} hours`
    } else {
      const days = Math.ceil(totalHours / 24)
      return `${days} days`
    }
  }

  // Create order
  const createOrder = async (orderData: {
    service: SMMService
    quantity: number
    targetUrl: string
  }): Promise<{ success: boolean; orderId?: number; message?: string }> => {
    try {
      const response = await fetch("/api/smm/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          service: orderData.service.service,
          link: orderData.targetUrl,
          quantity: orderData.quantity,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Order Placed Successfully",
          description: `Order #${result.order} has been created`,
        })
        return { success: true, orderId: result.order }
      } else {
        toast({
          title: "Order Failed",
          description: result.message || "Failed to place order",
          variant: "destructive",
        })
        return { success: false, message: result.message }
      }
    } catch (error) {
      console.error("Error creating order:", error)
      toast({
        title: "Error",
        description: "Failed to place order",
        variant: "destructive",
      })
      return { success: false, message: "Network error" }
    }
  }

  // Refresh services
  const refreshServices = async () => {
    setRefreshing(true)
    await fetchServices()
    setRefreshing(false)
  }

  // Reset category selection
  const resetSelection = () => {
    setSelectedCategory(null)
    setFilteredServices([])
  }

  // Initialize
  useEffect(() => {
    fetchServices()
  }, [fetchServices])

  return {
    // Data
    services,
    categories,
    filteredServices,
    selectedCategory,
    
    // Loading states
    loading,
    refreshing,
    
    // Actions
    filterServicesByCategory,
    calculateCost,
    getEstimatedDelivery,
    createOrder,
    refreshServices,
    resetSelection,
    
    // Platform info
    platform,
  }
}