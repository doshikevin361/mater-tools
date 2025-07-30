"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  MessageCircle, 
  Phone, 
  MessageSquare, 
  RefreshCw, 
  ShoppingCart,
  Clock,
  IndianRupee,
  Users,
  Heart,
  Eye,
  Share2,
  Zap,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react"
import { SMMService, SMMCategory } from "@/hooks/use-smm-service"

interface SMMMessageUIProps {
  platform: "instagram" | "facebook" | "twitter" | "youtube"
  categories: SMMCategory[]
  filteredServices: SMMService[]
  selectedCategory: string | null
  loading: boolean
  refreshing: boolean
  onCategorySelect: (categoryId: string) => void
  onServiceSelect: (service: SMMService) => void
  onCreateOrder: (orderData: { service: SMMService; quantity: number; targetUrl: string }) => Promise<{ success: boolean; orderId?: number; message?: string }>
  calculateCost: (service: SMMService, quantity: number) => number
  getEstimatedDelivery: (service: SMMService, quantity: number) => string
  onRefresh: () => void
}

interface OrderData {
  service: SMMService | null
  quantity: number
  targetUrl: string
  totalCost: number
}

const platformIcons = {
  instagram: "📷",
  facebook: "📘", 
  twitter: "🐦",
  youtube: "📺"
}

const platformColors = {
  instagram: "from-purple-500 to-pink-500",
  facebook: "from-blue-600 to-blue-400",
  twitter: "from-sky-500 to-blue-500",
  youtube: "from-red-500 to-red-400"
}

export function SMMMessageUI({
  platform,
  categories,
  filteredServices,
  selectedCategory,
  loading,
  refreshing,
  onCategorySelect,
  onServiceSelect,
  onCreateOrder,
  calculateCost,
  getEstimatedDelivery,
  onRefresh
}: SMMMessageUIProps) {
  const [orderData, setOrderData] = useState<OrderData>({
    service: null,
    quantity: 1000,
    targetUrl: "",
    totalCost: 0
  })
  const [activeTab, setActiveTab] = useState("chat")
  const [isOrdering, setIsOrdering] = useState(false)

  const platformName = platform.charAt(0).toUpperCase() + platform.slice(1)
  const platformIcon = platformIcons[platform]
  const platformGradient = platformColors[platform]

  const handleServiceSelect = (service: SMMService) => {
    const cost = calculateCost(service, orderData.quantity)
    setOrderData(prev => ({
      ...prev,
      service,
      totalCost: cost
    }))
    onServiceSelect(service)
  }

  const handleQuantityChange = (quantity: number) => {
    const cost = orderData.service ? calculateCost(orderData.service, quantity) : 0
    setOrderData(prev => ({
      ...prev,
      quantity,
      totalCost: cost
    }))
  }

  const handleCreateOrder = async () => {
    if (!orderData.service || !orderData.targetUrl || orderData.quantity < parseInt(orderData.service.min)) {
      return
    }

    setIsOrdering(true)
    try {
      await onCreateOrder({
        service: orderData.service,
        quantity: orderData.quantity,
        targetUrl: orderData.targetUrl
      })
      
      // Reset form after successful order
      setOrderData({
        service: null,
        quantity: 1000,
        targetUrl: "",
        totalCost: 0
      })
    } catch (error) {
      console.error("Order creation failed:", error)
    } finally {
      setIsOrdering(false)
    }
  }

  return (
    <div className="max-w-md mx-auto bg-background border rounded-lg shadow-lg overflow-hidden">
      {/* Header - Call-like announcement banner */}
      <div className={`bg-gradient-to-r ${platformGradient} text-white p-4`}>
        <div className="flex items-center gap-3">
          <div className="text-2xl">{platformIcon}</div>
          <div className="flex-1">
            <h1 className="font-semibold text-lg">{platformName} SMM Panel</h1>
            <p className="text-sm opacity-90">🔥 New Indian Services Available Now</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={refreshing}
            className="text-white hover:bg-white/20"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 rounded-none border-b">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="sms" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Order
          </TabsTrigger>
          <TabsTrigger value="call" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Status
          </TabsTrigger>
        </TabsList>

        {/* Chat View - Category and Service Selection */}
        <TabsContent value="chat" className="p-0">
          <ScrollArea className="h-96">
            <div className="p-4 space-y-4">
              {/* Categories Selection */}
              {!selectedCategory && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">AI</AvatarFallback>
                    </Avatar>
                    <span>Select a category to get started:</span>
                  </div>
                  
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {categories.map((category) => (
                        <Button
                          key={category.id}
                          variant="outline"
                          className="h-auto p-3 flex flex-col items-center gap-2"
                          onClick={() => onCategorySelect(category.id)}
                        >
                          <span className="text-lg">{category.icon}</span>
                          <span className="text-sm font-medium">{category.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {category.count} services
                          </Badge>
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Services Selection */}
              {selectedCategory && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">AI</AvatarFallback>
                    </Avatar>
                    <span>Choose a service:</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setOrderData(prev => ({ ...prev, service: null }))
                        onCategorySelect("")
                      }}
                      className="ml-auto text-xs"
                    >
                      ← Back
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {filteredServices.map((service) => (
                      <Card 
                        key={service.service}
                        className={`cursor-pointer transition-colors hover:bg-accent ${
                          orderData.service?.service === service.service ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => handleServiceSelect(service)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{service.name}</h4>
                              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <IndianRupee className="h-3 w-3" />
                                  {service.rate}/1k
                                </span>
                                <span>Min: {service.min}</span>
                                <span>Max: {service.max}</span>
                              </div>
                            </div>
                            {orderData.service?.service === service.service && (
                              <CheckCircle className="h-4 w-4 text-primary" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Order Input */}
              {orderData.service && (
                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">You</AvatarFallback>
                    </Avatar>
                    <span>Enter order details:</span>
                  </div>

                  <div className="space-y-3 ml-8">
                    <div>
                      <label className="text-xs text-muted-foreground">Target URL</label>
                      <Input
                        placeholder={`Enter ${platform} URL`}
                        value={orderData.targetUrl}
                        onChange={(e) => setOrderData(prev => ({ ...prev, targetUrl: e.target.value }))}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground">Quantity</label>
                      <Input
                        type="number"
                        min={orderData.service.min}
                        max={orderData.service.max}
                        value={orderData.quantity}
                        onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 0)}
                        className="mt-1"
                      />
                    </div>

                    <div className="bg-accent p-3 rounded-lg">
                      <div className="flex justify-between items-center text-sm">
                        <span>Total Cost:</span>
                        <span className="font-semibold flex items-center gap-1">
                          <IndianRupee className="h-3 w-3" />
                          {orderData.totalCost.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-muted-foreground mt-1">
                        <span>Estimated Delivery:</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {getEstimatedDelivery(orderData.service, orderData.quantity)}
                        </span>
                      </div>
                    </div>

                    <Button 
                      onClick={handleCreateOrder}
                      disabled={!orderData.targetUrl || orderData.quantity < parseInt(orderData.service.min) || isOrdering}
                      className="w-full"
                    >
                      {isOrdering ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Placing Order...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Place Order
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* SMS View - Order Summary */}
        <TabsContent value="sms" className="p-4">
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="font-semibold">Order Summary</h3>
              <p className="text-sm text-muted-foreground">Review your order details</p>
            </div>

            {orderData.service ? (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Service:</span>
                    <span className="text-sm font-medium">{orderData.service.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Quantity:</span>
                    <span className="text-sm font-medium">{orderData.quantity.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Rate:</span>
                    <span className="text-sm font-medium">₹{orderData.service.rate}/1k</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium">Total:</span>
                    <span className="font-semibold">₹{orderData.totalCost.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No service selected</p>
                <p className="text-sm">Go to Chat tab to select a service</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Call View - Status and Delivery Info */}
        <TabsContent value="call" className="p-4">
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="font-semibold">Service Status</h3>
              <p className="text-sm text-muted-foreground">Delivery speed and status information</p>
            </div>

            {orderData.service ? (
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-full">
                      <Zap className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Fast Delivery</p>
                      <p className="text-xs text-muted-foreground">
                        {getEstimatedDelivery(orderData.service, orderData.quantity)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="space-y-1">
                      <div className="text-lg font-semibold text-green-600">98%</div>
                      <div className="text-xs text-muted-foreground">Success Rate</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-lg font-semibold text-blue-600">24/7</div>
                      <div className="text-xs text-muted-foreground">Support</div>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>High Quality Services</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>Real & Active Users</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>Instant Start</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No service selected</p>
                <p className="text-sm">Select a service to see delivery info</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}