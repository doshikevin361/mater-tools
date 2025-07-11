"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, Settings } from "lucide-react"

interface TwilioStatus {
  configured: boolean
  valid: boolean
  accountSid?: string
  phoneNumber?: string
  error?: string
}

export function TwilioStatus() {
  const [status, setStatus] = useState<TwilioStatus | null>(null)
  const [loading, setLoading] = useState(true)

  const checkTwilioStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/calling/status")
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      setStatus({
        configured: false,
        valid: false,
        error: "Failed to check Twilio status",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkTwilioStatus()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
            <span>Checking Twilio status...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="h-5 w-5" />
          <span>Twilio Configuration</span>
        </CardTitle>
        <CardDescription>Dynamic Twilio credentials status</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span>Configuration Status:</span>
          <Badge variant={status?.configured ? "default" : "destructive"}>
            {status?.configured ? "Configured" : "Not Configured"}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <span>Credentials Valid:</span>
          <Badge variant={status?.valid ? "default" : "destructive"}>{status?.valid ? "Valid" : "Invalid"}</Badge>
        </div>

        {status?.accountSid && (
          <div className="flex items-center justify-between">
            <span>Account SID:</span>
            <code className="text-sm bg-gray-100 px-2 py-1 rounded">{status.accountSid.substring(0, 10)}...</code>
          </div>
        )}

        {status?.phoneNumber && (
          <div className="flex items-center justify-between">
            <span>Phone Number:</span>
            <code className="text-sm bg-gray-100 px-2 py-1 rounded">{status.phoneNumber}</code>
          </div>
        )}

        {status?.error && (
          <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
            <div className="text-sm text-red-700">
              <p className="font-medium">Error:</p>
              <p>{status.error}</p>
            </div>
          </div>
        )}

        {!status?.configured && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">Setup Required</h4>
            <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
              <li>
                Visit{" "}
                <a href="https://console.twilio.com" target="_blank" className="underline" rel="noreferrer">
                  Twilio Console
                </a>
              </li>
              <li>Get your Account SID and Auth Token</li>
              <li>Purchase a phone number</li>
              <li>Update your .env file with real credentials</li>
            </ol>
          </div>
        )}

        <Button onClick={checkTwilioStatus} variant="outline" size="sm">
          Refresh Status
        </Button>
      </CardContent>
    </Card>
  )
}
