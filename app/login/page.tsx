"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Mail, Lock, ArrowRight, MessageSquare, Sparkles, Zap, Shield } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const result = await response.json()

      if (result.success) {
        // Store user info in localStorage
        localStorage.setItem("user", JSON.stringify(result.user))
        localStorage.setItem("userId", result.user._id)

        // Redirect to dashboard
        router.push("/dashboard")
      } else {
        setError(result.message || "Login failed")
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-blue-600">
        {/* Decorative dotted background */}
        <div
          className={`absolute inset-0
    bg-[url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23ffffff' fillOpacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")]
    opacity-20
  `}
        ></div>
        <div className="absolute top-0 left-0 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute top-0 right-0 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-4000"></div>
      </div>

      {/* Left Side - Enhanced Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10 p-12 text-white flex-col justify-between">
        <div>
          <div className="flex items-center space-x-4 mb-12">
            <div className="relative">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm border border-white/30 shadow-2xl">
                <MessageSquare className="h-10 w-10" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-pink-400 to-yellow-400 rounded-full animate-ping"></div>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                BrandBuzz Ventures
              </h1>
              <p className="text-blue-100 text-sm">Your Marketing Universe</p>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="text-5xl font-bold leading-tight mb-6">
                Welcome back to your
                <br />
                <span className="bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
                  Marketing Universe
                </span>
              </h2>
              <p className="text-xl text-blue-100 leading-relaxed">
                Unleash the power of multi-channel marketing. Connect, engage, and convert your audience across
                WhatsApp, Email, SMS, and Voice campaigns with cutting-edge AI-powered insights.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <Sparkles className="h-8 w-8 text-pink-300 mb-2" />
                <h3 className="font-semibold text-lg mb-1">AI-Powered</h3>
                <p className="text-blue-100 text-sm">Smart campaign optimization</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <Zap className="h-8 w-8 text-yellow-300 mb-2" />
                <h3 className="font-semibold text-lg mb-1">Lightning Fast</h3>
                <p className="text-blue-100 text-sm">Instant message delivery</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-4 text-blue-100 bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
            <Shield className="w-5 h-5 text-green-300" />
            <span>Enterprise-grade security & compliance</span>
          </div>
          <div className="flex items-center space-x-4 text-blue-100 bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
            <MessageSquare className="w-5 h-5 text-blue-300" />
            <span>Multi-platform messaging ecosystem</span>
          </div>
          <div className="flex items-center space-x-4 text-blue-100 bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
            <Sparkles className="w-5 h-5 text-purple-300" />
            <span>Real-time analytics & insights</span>
          </div>
        </div>
      </div>

      {/* Right Side - Enhanced Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-md">
          <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader className="text-center pb-8">
              <div className="mx-auto mb-6 lg:hidden">
                <div className="flex items-center justify-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl shadow-lg">
                    <MessageSquare className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <span className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                      BrandBuzz
                    </span>
                    <p className="text-xs text-gray-500 -mt-1">Ventures</p>
                  </div>
                </div>
              </div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Welcome Back
              </CardTitle>
              <CardDescription className="text-base text-gray-600">
                Sign in to access your marketing dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-6">
                {error && (
                  <Alert variant="destructive" className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-800">{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 font-medium">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-11 h-12 border-gray-200 focus:border-violet-500 focus:ring-violet-500 bg-gray-50 focus:bg-white transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-11 pr-11 h-12 border-gray-200 focus:border-violet-500 focus:ring-violet-500 bg-gray-50 focus:bg-white transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-violet-600 via-purple-600 to-blue-600 hover:from-violet-700 hover:via-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    <>
                      Sign In to Dashboard
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{" "}
                  <Link
                    href="/signup"
                    className="text-violet-600 hover:text-violet-500 font-semibold hover:underline transition-all"
                  >
                    Create your account
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
