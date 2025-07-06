"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Mail, Phone, Smartphone, User, BarChart3, Play, ArrowRight, CheckCircle } from "lucide-react"

export default function DemoPage() {
  const features = [
    {
      title: "User Authentication",
      description: "Login and signup functionality",
      icon: User,
      pages: [
        { name: "Login Page", path: "/login", status: "ready" },
        { name: "Signup Page", path: "/signup", status: "ready" },
      ],
    },
    {
      title: "Dashboard Overview",
      description: "Main dashboard with analytics",
      icon: BarChart3,
      pages: [{ name: "Dashboard Home", path: "/dashboard", status: "ready" }],
    },
    {
      title: "WhatsApp Campaigns",
      description: "Bulk WhatsApp messaging",
      icon: MessageSquare,
      pages: [{ name: "WhatsApp Composer", path: "/dashboard/whatsapp", status: "ready" }],
    },
    {
      title: "Email Campaigns",
      description: "Professional email marketing",
      icon: Mail,
      pages: [{ name: "Email Composer", path: "/dashboard/email", status: "ready" }],
    },
    {
      title: "Voice Campaigns",
      description: "Text-to-speech and voice messages",
      icon: Phone,
      pages: [{ name: "Voice Composer", path: "/dashboard/voice", status: "ready" }],
    },
    {
      title: "SMS Campaigns",
      description: "Global SMS messaging",
      icon: Smartphone,
      pages: [{ name: "SMS Composer", path: "/dashboard/sms", status: "ready" }],
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">BrandBuzz Demo</span>
          </div>
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Demo Instructions */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">UI Demo & Test Pages</h1>
          <div className="bg-white rounded-lg p-6 border">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Play className="w-5 h-5 mr-2 text-green-600" />
              How to Test the UI
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">🔐 Test Credentials</h3>
                <div className="bg-gray-50 p-3 rounded text-sm">
                  <p>
                    <strong>Email:</strong> demo@brandbuzzventures.com
                  </p>
                  <p>
                    <strong>Password:</strong> demo123
                  </p>
                </div>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">✨ Features Available</h3>
                <ul className="text-sm space-y-1">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    Direct message sending (no templates needed)
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    All messaging platforms ready
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    Real-time previews
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    Cost calculations
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {feature.pages.map((page, pageIndex) => (
                    <div key={pageIndex} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm font-medium">{page.name}</span>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">
                          {page.status}
                        </Badge>
                        <Link href={page.path}>
                          <Button size="sm" variant="ghost">
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Start */}
        <div className="mt-8 bg-white rounded-lg p-6 border">
          <h2 className="text-xl font-semibold mb-4">🚀 Quick Start Guide</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-3">For Testing UI:</h3>
              <ol className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">
                    1
                  </span>
                  <span>Click on any page link above</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">
                    2
                  </span>
                  <span>Use test credentials for login</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">
                    3
                  </span>
                  <span>Test all messaging features</span>
                </li>
              </ol>
            </div>
            <div>
              <h3 className="font-medium mb-3">For API Integration:</h3>
              <ol className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="bg-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">
                    1
                  </span>
                  <span>Replace console.log with your API calls</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">
                    2
                  </span>
                  <span>Update authentication endpoints</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">
                    3
                  </span>
                  <span>Connect messaging APIs</span>
                </li>
              </ol>
            </div>
          </div>
        </div>

        {/* Direct Access Buttons */}
        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <Link href="/login">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              <User className="w-4 h-4 mr-2" />
              Test Login
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button size="lg" variant="outline">
              <BarChart3 className="w-4 h-4 mr-2" />
              View Dashboard
            </Button>
          </Link>
          <Link href="/dashboard/whatsapp">
            <Button size="lg" variant="outline">
              <MessageSquare className="w-4 h-4 mr-2" />
              WhatsApp Demo
            </Button>
          </Link>
          <Link href="/dashboard/email">
            <Button size="lg" variant="outline">
              <Mail className="w-4 h-4 mr-2" />
              Email Demo
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
