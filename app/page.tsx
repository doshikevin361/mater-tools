"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  MessageSquare,
  Mail,
  Phone,
  BarChart3,
  Globe,
  CheckCircle,
  ArrowRight,
  Play,
  Smartphone,
  HeadphonesIcon,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Users,
  TrendingUp,
  Award,
  Sparkles,
} from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Reset form
    setEmail("")
    setIsSubmitting(false)

    // You could show a success message here
    alert("Thank you for subscribing!")
  }

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Reset form
    setMessage("")
    setIsSubmitting(false)

    // You could show a success message here
    alert("Message sent successfully!")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-500/30 to-cyan-500/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse delay-500"></div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 bg-black/20 backdrop-blur-xl border-b border-white/10 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
                <div className="relative w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-purple-400" />
                </div>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                BrandBuzz Ventures
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-slate-300 hover:text-white transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-slate-300 hover:text-white transition-colors">
                Pricing
              </a>
              <a href="#contact" className="text-slate-300 hover:text-white transition-colors">
                Contact
              </a>
              <Link href="/login">
                <Button
                  variant="outline"
                  className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20 bg-transparent backdrop-blur-sm"
                >
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto">
            <Badge className="mb-6 bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-200 border-purple-500/30 backdrop-blur-sm">
              🚀 Next-Gen Marketing Platform
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
              <span className="bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
                Transform Your Brand with
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-gradient-x">
                BrandBuzz Ventures
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 mb-12 leading-relaxed max-w-3xl mx-auto">
              Revolutionize your marketing with AI-powered campaigns across WhatsApp, SMS, Email, Voice calls, and
              social media. One unified platform for unlimited growth.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 via-purple-600 to-pink-600 hover:from-purple-700 hover:via-purple-700 hover:to-pink-700 text-white px-8 py-4 text-lg shadow-2xl hover:shadow-purple-500/25 transform hover:scale-105 transition-all duration-300"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20 px-8 py-4 text-lg bg-transparent backdrop-blur-sm"
              >
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-slate-400">
              <div className="flex items-center space-x-2 bg-white/5 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10">
                <Users className="h-4 w-4 text-green-400" />
                <span>50,000+ Active Users</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/5 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10">
                <TrendingUp className="h-4 w-4 text-blue-400" />
                <span>99.9% Uptime</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/5 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10">
                <Award className="h-4 w-4 text-purple-400" />
                <span>24/7 Support</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-24 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <Badge className="mb-4 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-200 border-blue-500/30 backdrop-blur-sm">
              ✨ Powerful Features
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Everything You Need to
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {" "}
                Succeed
              </span>
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Comprehensive marketing tools designed to help you reach, engage, and convert your audience across
              multiple channels with AI-powered intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* WhatsApp Marketing */}
            <Card className="group hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 border-white/10 bg-white/5 backdrop-blur-sm hover:scale-105 hover:bg-white/10">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-white">WhatsApp Marketing</CardTitle>
                <CardDescription className="text-slate-300">
                  Send bulk WhatsApp messages with rich media support and intelligent template management.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span>Bulk messaging with AI optimization</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span>Rich media attachments</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span>Smart template management</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Email Marketing */}
            <Card className="group hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-500 border-white/10 bg-white/5 backdrop-blur-sm hover:scale-105 hover:bg-white/10">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Mail className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-white">Email Campaigns</CardTitle>
                <CardDescription className="text-slate-300">
                  Create stunning email campaigns with AI-powered content and advanced automation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span>AI-powered content creation</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span>Advanced automation flows</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span>Smart A/B testing</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* SMS Marketing */}
            <Card className="group hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 border-white/10 bg-white/5 backdrop-blur-sm hover:scale-105 hover:bg-white/10">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Smartphone className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-white">SMS Marketing</CardTitle>
                <CardDescription className="text-slate-300">
                  Reach customers instantly with personalized SMS campaigns and real-time notifications.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span>Lightning-fast delivery</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span>Smart personalization</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span>Real-time analytics</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Voice Campaigns */}
            <Card className="group hover:shadow-2xl hover:shadow-orange-500/20 transition-all duration-500 border-white/10 bg-white/5 backdrop-blur-sm hover:scale-105 hover:bg-white/10">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <HeadphonesIcon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-white">Voice Campaigns</CardTitle>
                <CardDescription className="text-slate-300">
                  Create powerful voice campaigns with AI-generated speech and interactive responses.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span>AI voice generation</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span>Interactive voice responses</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span>Advanced call analytics</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Social Media */}
            <Card className="group hover:shadow-2xl hover:shadow-pink-500/20 transition-all duration-500 border-white/10 bg-white/5 backdrop-blur-sm hover:scale-105 hover:bg-white/10">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Globe className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-white">Social Media</CardTitle>
                <CardDescription className="text-slate-300">
                  Manage all social platforms with AI-powered content creation and scheduling.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span>Multi-platform management</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span>AI content generation</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span>Smart scheduling</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Analytics */}
            <Card className="group hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-500 border-white/10 bg-white/5 backdrop-blur-sm hover:scale-105 hover:bg-white/10">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-white">AI Analytics</CardTitle>
                <CardDescription className="text-slate-300">
                  Get deep insights with AI-powered analytics and predictive performance metrics.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span>Predictive analytics</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span>AI-powered insights</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span>ROI optimization</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform">
                10M+
              </div>
              <div className="text-slate-300">Messages Delivered</div>
            </div>
            <div className="text-center group">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform">
                50K+
              </div>
              <div className="text-slate-300">Happy Customers</div>
            </div>
            <div className="text-center group">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform">
                99.9%
              </div>
              <div className="text-slate-300">Uptime Guarantee</div>
            </div>
            <div className="text-center group">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform">
                24/7
              </div>
              <div className="text-slate-300">Expert Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 py-24 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <Badge className="mb-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-200 border-green-500/30 backdrop-blur-sm">
              💰 Transparent Pricing
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Choose Your
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {" "}
                Growth Plan
              </span>
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Flexible pricing designed to scale with your business. Start free and upgrade as you grow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter Plan */}
            <Card className="border-white/20 hover:border-purple-500/50 transition-all duration-300 bg-white/5 backdrop-blur-sm hover:scale-105 hover:bg-white/10">
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl font-bold text-white">Starter</CardTitle>
                <div className="text-4xl font-bold text-white mt-4">₹999</div>
                <div className="text-slate-400">/month</div>
                <CardDescription className="mt-4 text-slate-300">
                  Perfect for small businesses getting started
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span className="text-slate-300">1,000 WhatsApp messages</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span className="text-slate-300">5,000 SMS messages</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span className="text-slate-300">10,000 emails</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span className="text-slate-300">Basic analytics</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span className="text-slate-300">Email support</span>
                </div>
                <Button className="w-full mt-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                  Get Started
                </Button>
              </CardContent>
            </Card>

            {/* Professional Plan */}
            <Card className="border-purple-500/50 hover:border-purple-400/70 transition-all duration-300 bg-white/10 backdrop-blur-sm relative hover:scale-105 hover:bg-white/15">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1">
                  Most Popular
                </Badge>
              </div>
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl font-bold text-white">Professional</CardTitle>
                <div className="text-4xl font-bold text-white mt-4">₹2,999</div>
                <div className="text-slate-400">/month</div>
                <CardDescription className="mt-4 text-slate-300">Ideal for growing businesses</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span className="text-slate-300">10,000 WhatsApp messages</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span className="text-slate-300">25,000 SMS messages</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span className="text-slate-300">50,000 emails</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span className="text-slate-300">Voice campaigns</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span className="text-slate-300">AI-powered analytics</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span className="text-slate-300">Priority support</span>
                </div>
                <Button className="w-full mt-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                  Get Started
                </Button>
              </CardContent>
            </Card>

            {/* Enterprise Plan */}
            <Card className="border-white/20 hover:border-purple-500/50 transition-all duration-300 bg-white/5 backdrop-blur-sm hover:scale-105 hover:bg-white/10">
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl font-bold text-white">Enterprise</CardTitle>
                <div className="text-4xl font-bold text-white mt-4">Custom</div>
                <div className="text-slate-400">pricing</div>
                <CardDescription className="mt-4 text-slate-300">
                  For large organizations with custom needs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span className="text-slate-300">Unlimited messages</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span className="text-slate-300">All channels included</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span className="text-slate-300">Custom integrations</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span className="text-slate-300">Dedicated support</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span className="text-slate-300">SLA guarantee</span>
                </div>
                <Button
                  variant="outline"
                  className="w-full mt-8 border-purple-500/50 text-purple-300 hover:bg-purple-500/20 bg-transparent backdrop-blur-sm"
                >
                  Contact Sales
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="relative z-10 py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="relative bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-purple-600/20 rounded-3xl p-12 backdrop-blur-xl border border-white/10 overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
            <div className="relative z-10">
              <Sparkles className="h-12 w-12 text-purple-400 mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Stay Ahead of the Curve</h2>
              <p className="text-xl mb-8 text-slate-300">
                Get exclusive marketing insights, feature updates, and growth strategies delivered to your inbox.
              </p>
              <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-slate-400 backdrop-blur-sm focus:border-purple-400"
                />
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold"
                >
                  {isSubmitting ? "Subscribing..." : "Subscribe"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="relative z-10 py-24 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <Badge className="mb-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-200 border-purple-500/30 backdrop-blur-sm">
              📞 Get in Touch
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Ready to Transform
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {" "}
                Your Marketing?
              </span>
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Have questions? Our expert team is here to help you succeed. Get in touch and we'll respond within 24
              hours.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Contact Form */}
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-white">Send us a Message</CardTitle>
                <CardDescription className="text-slate-300">
                  Fill out the form below and we'll get back to you as soon as possible.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleContactSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      placeholder="First Name"
                      required
                      className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                    />
                    <Input
                      placeholder="Last Name"
                      required
                      className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                    />
                  </div>
                  <Input
                    type="email"
                    placeholder="Email Address"
                    required
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                  />
                  <Input
                    placeholder="Company Name"
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                  />
                  <Textarea
                    placeholder="Tell us about your marketing needs..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={4}
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                  />
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  >
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <div className="space-y-8">
              <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl hover:bg-white/10 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <Mail className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Email Us</h3>
                      <p className="text-slate-300">support@brandbuzzventures.com</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl hover:bg-white/10 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                      <Phone className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Call Us</h3>
                      <p className="text-slate-300">+91 98765 43210</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl hover:bg-white/10 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                      <MessageSquare className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Live Chat</h3>
                      <p className="text-slate-300">Available 24/7 for instant support</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Social Media Links */}
              <div className="flex space-x-4">
                <Button
                  size="icon"
                  variant="outline"
                  className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20 bg-transparent backdrop-blur-sm"
                >
                  <Facebook className="h-5 w-5" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20 bg-transparent backdrop-blur-sm"
                >
                  <Instagram className="h-5 w-5" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20 bg-transparent backdrop-blur-sm"
                >
                  <Twitter className="h-5 w-5" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20 bg-transparent backdrop-blur-sm"
                >
                  <Youtube className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-black/40 backdrop-blur-xl text-white py-16 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-75"></div>
                  <div className="relative w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-purple-400" />
                  </div>
                </div>
                <span className="text-xl font-bold">BrandBuzz Ventures</span>
              </div>
              <p className="text-slate-400 mb-6 max-w-md">
                Empowering businesses with comprehensive multi-channel marketing solutions. Reach your audience across
                WhatsApp, SMS, Email, Voice, and social media platforms with AI-powered intelligence.
              </p>
              <div className="flex space-x-4">
                <Button size="icon" variant="ghost" className="text-slate-400 hover:text-white hover:bg-white/10">
                  <Facebook className="h-5 w-5" />
                </Button>
                <Button size="icon" variant="ghost" className="text-slate-400 hover:text-white hover:bg-white/10">
                  <Instagram className="h-5 w-5" />
                </Button>
                <Button size="icon" variant="ghost" className="text-slate-400 hover:text-white hover:bg-white/10">
                  <Twitter className="h-5 w-5" />
                </Button>
                <Button size="icon" variant="ghost" className="text-slate-400 hover:text-white hover:bg-white/10">
                  <Youtube className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold mb-4 text-white">Quick Links</h3>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <a href="#features" className="hover:text-white transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-white transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <Link href="/login" className="hover:text-white transition-colors">
                    Login
                  </Link>
                </li>
                <li>
                  <Link href="/signup" className="hover:text-white transition-colors">
                    Sign Up
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="font-semibold mb-4 text-white">Support</h3>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <a href="#contact" className="hover:text-white transition-colors">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 mt-12 pt-8 text-center text-slate-400">
            <p>&copy; 2024 BrandBuzz Ventures. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes gradient-x {
          0%, 100% {
            background-size: 200% 200%;
            background-position: left center;
          }
          50% {
            background-size: 200% 200%;
            background-position: right center;
          }
        }
        .animate-gradient-x {
          animation: gradient-x 3s ease infinite;
        }
      `}</style>
    </div>
  )
}
