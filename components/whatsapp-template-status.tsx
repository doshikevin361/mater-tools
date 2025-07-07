"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, XCircle, Clock, RefreshCw } from "lucide-react"
import { toast } from "sonner"

interface TemplateStatusProps {
  campaignId: string
  userId: string
  onStatusChange?: (status: string) => void
}

export function WhatsAppTemplateStatus({ campaignId, userId, onStatusChange }: TemplateStatusProps) {
  const [campaign, setCampaign] = useState<any>(null)
  const [template, setTemplate] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchStatus = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true)

      const response = await fetch(`/api/whatsapp/template-status?campaignId=${campaignId}&userId=${userId}`)
      const data = await response.json()

      if (data.success) {
        setCampaign(data.campaign)
        setTemplate(data.template)
        onStatusChange?.(data.campaign.status)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.error("Error fetching status:", error)
      toast.error("Failed to fetch status")
    } finally {
      setLoading(false)
      if (showRefreshing) setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchStatus()

    // Auto-refresh every 30 seconds if template is pending
    const interval = setInterval(() => {
      if (template?.status === "PENDING" || campaign?.status?.includes("Template")) {
        fetchStatus()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [campaignId, userId, template?.status, campaign?.status])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
      case "Completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "REJECTED":
      case "Failed":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "PENDING":
        return <Clock className="h-5 w-5 text-yellow-500" />
      default:
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
      case "Completed":
        return "bg-green-100 text-green-800"
      case "REJECTED":
      case "Failed":
        return "bg-red-100 text-red-800"
      case "PENDING":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-blue-100 text-blue-800"
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading campaign status...
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Campaign Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(campaign?.status)}
                Campaign Status
              </CardTitle>
              <CardDescription>{campaign?.name}</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => fetchStatus(true)} disabled={refreshing}>
              {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status:</span>
              <Badge className={getStatusColor(campaign?.status)}>{campaign?.status}</Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Recipients:</span>
              <span className="text-sm">{campaign?.recipientCount}</span>
            </div>

            {campaign?.sent > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Sent:</span>
                <span className="text-sm text-green-600">{campaign.sent}</span>
              </div>
            )}

            {campaign?.failed > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Failed:</span>
                <span className="text-sm text-red-600">{campaign.failed}</span>
              </div>
            )}

            <div className="pt-2 border-t">
              <div className="text-xs text-gray-500">Created: {new Date(campaign?.createdAt).toLocaleString()}</div>
              {campaign?.completedAt && (
                <div className="text-xs text-gray-500">
                  Completed: {new Date(campaign.completedAt).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Template Status */}
      {template && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(template.status)}
              Template Status
            </CardTitle>
            <CardDescription>WhatsApp Business Template</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Template Name:</span>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">{template.templateName}</code>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status:</span>
                <Badge className={getStatusColor(template.status)}>{template.status}</Badge>
              </div>

              {template.checkCount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status Checks:</span>
                  <span className="text-sm">{template.checkCount}</span>
                </div>
              )}

              <div className="pt-2 border-t">
                <div className="text-xs text-gray-500">Submitted: {new Date(template.createdAt).toLocaleString()}</div>
                {template.lastChecked && (
                  <div className="text-xs text-gray-500">
                    Last Checked: {new Date(template.lastChecked).toLocaleString()}
                  </div>
                )}
              </div>

              {template.status === "PENDING" && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="text-sm text-yellow-800">
                    <strong>Template Pending Approval</strong>
                    <p className="mt-1 text-xs">
                      WhatsApp is reviewing your template. This usually takes 1-24 hours. Messages will be sent
                      automatically once approved.
                    </p>
                  </div>
                </div>
              )}

              {template.status === "APPROVED" && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-sm text-green-800">
                    <strong>Template Approved!</strong>
                    <p className="mt-1 text-xs">Your template has been approved and messages are being sent.</p>
                  </div>
                </div>
              )}

              {template.status === "REJECTED" && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-sm text-red-800">
                    <strong>Template Rejected</strong>
                    <p className="mt-1 text-xs">
                      WhatsApp rejected your template. Please modify your message and try again.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
