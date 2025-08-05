import React, { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Download, X, CheckCircle, XCircle, Clock, Users } from "lucide-react"
import { toast } from "sonner"

interface Contact {
  _id: string
  name: string
  email?: string
  phone?: string
  mobile?: string
}

interface MessageLog {
  _id: string
  campaignId: string
  contactId: string
  contactName: string
  contactEmail?: string
  contactPhone?: string
  status: "sent" | "delivered" | "failed" | "pending"
  timestamp: string
  errorMessage?: string
}

interface CampaignDetails {
  _id: string
  name: string
  type: string
  status: string
  sent: number
  failed: number
  recipientCount: number
  cost: number
  createdAt: string
  deliveryStats: {
    sent: number
    delivered: number
    failed: number
    pending: number
  }
}

interface CampaignDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  campaignId: string
  platform: "sms" | "whatsapp" | "email"
}

export function CampaignDetailsModal({
  isOpen,
  onClose,
  campaignId,
  platform,
}: CampaignDetailsModalProps) {
  const [campaign, setCampaign] = useState<CampaignDetails | null>(null)
  const [messageLogs, setMessageLogs] = useState<MessageLog[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen && campaignId) {
      loadCampaignDetails()
    }
  }, [isOpen, campaignId])

  const loadCampaignDetails = async () => {
    setIsLoading(true)
    try {
      const userId = localStorage.getItem("userId") || "demo-user-123"
      const response = await fetch(`/api/campaigns/${campaignId}?userId=${userId}`)
      const result = await response.json()

      if (result.success) {
        setCampaign(result.campaign)
        setMessageLogs(result.messageLogs || [])
      } else {
        toast.error("Failed to load campaign details")
      }
    } catch (error) {
      console.error("Error loading campaign details:", error)
      toast.error("Failed to load campaign details")
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
      case "delivered":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
      case "delivered":
        return "bg-green-100 text-green-800 border-green-200"
      case "failed":
        return "bg-red-100 text-red-800 border-red-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const exportCampaignData = () => {
    if (!campaign || messageLogs.length === 0) {
      toast.error("No data to export")
      return
    }

    const csvData = [
      ["Name", "Email", "Phone", "Status", "Timestamp", "Error Message"],
      ...messageLogs.map((log) => [
        log.contactName,
        log.contactEmail || "",
        log.contactPhone || "",
        log.status,
        new Date(log.timestamp).toLocaleString(),
        log.errorMessage || "",
      ]),
    ]

    const csvContent = csvData.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${campaign.name}-${platform}-details.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)

    toast.success("Campaign data exported successfully")
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (!campaign) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Campaign Details</span>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
                <span>Loading campaign details...</span>
              </div>
            ) : (
              <span className="text-gray-500">Campaign not found</span>
            )}
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const successRate = campaign.recipientCount > 0 ? (campaign.sent / campaign.recipientCount) * 100 : 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>{campaign.name} - Details</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportCampaignData}
                disabled={messageLogs.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Campaign Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Campaign Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{campaign.recipientCount}</div>
                  <div className="text-sm text-gray-600">Total Recipients</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{campaign.deliveryStats.delivered}</div>
                  <div className="text-sm text-green-600">Delivered</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{campaign.deliveryStats.failed}</div>
                  <div className="text-sm text-red-600">Failed</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{campaign.deliveryStats.pending}</div>
                  <div className="text-sm text-yellow-600">Pending</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Success Rate</span>
                  <span className="font-medium">{successRate.toFixed(1)}%</span>
                </div>
                <Progress value={successRate} className="h-2" />
              </div>
              <div className="mt-4 text-sm text-gray-600">
                Created: {formatDate(campaign.createdAt)} | Cost: ₹{campaign.cost.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          {/* Contact Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Details</CardTitle>
            </CardHeader>
            <CardContent>
              {messageLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No contact details available for this campaign
                </div>
              ) : (
                <div className="space-y-3">
                  {messageLogs.map((log) => (
                    <div
                      key={log._id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(log.status)}
                        <div>
                          <div className="font-medium text-gray-900">{log.contactName}</div>
                          <div className="text-sm text-gray-600">
                            {log.contactEmail && `${log.contactEmail} `}
                            {log.contactPhone && `| ${log.contactPhone}`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(log.status)}>{log.status}</Badge>
                        <div className="text-xs text-gray-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
} 