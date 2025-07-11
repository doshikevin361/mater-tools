"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  Building,
  Phone,
  ArrowRight,
  MessageSquare,
  Sparkles,
  Users,
  Globe,
  Shield,
  Star,
} from "lucide-react"
import { toast } from "sonner"

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    company: "",
    phone: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        // Store user data in localStorage
        localStorage.setItem("user", JSON.stringify(data.user))
        localStorage.setItem("token", data.token)

        // Show success toast
        toast.success(data.message || "Account created successfully!")

        // Redirect to dashboard
        router.push("/dashboard")
      } else {
        toast.error(data.message || "Failed to create account")
      }
    } catch (error) {
      console.error("Signup error:", error)
      toast.error("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background */}
      <div className="absolute inset-0">
        {/* Gradient Orbs */}
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>

        {/* Floating Elements */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full opacity-60 animate-ping"></div>
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-purple-400 rounded-full opacity-80 animate-pulse"></div>
        <div className="absolute top-1/2 left-3/4 w-1.5 h-1.5 bg-pink-400 rounded-full opacity-70 animate-bounce"></div>
      </div>

      {/* Left Side - Enhanced Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10 p-12 text-white flex-col justify-between">
        <div>
          {/* Logo Section */}
          <div className="flex items-center space-x-4 mb-16">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
              <div className="relative p-4 bg-slate-900 rounded-2xl leading-none flex items-center">
                <MessageSquare className="h-8 w-8 text-purple-400" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
                BrandBuzz Ventures
              </h1>
              <p className="text-purple-300 text-sm font-medium">Your Marketing Universe</p>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-12">
            <div>
              <h2 className="text-6xl font-bold leading-tight mb-8">
                Join thousands of
                <br />
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-gradient-x">
                  Marketing Leaders
                </span>
              </h2>
              <p className="text-xl text-slate-300 leading-relaxed max-w-lg">
                Start your journey with the most powerful multi-channel marketing platform. Create your account in
                seconds and transform your business today.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 gap-6">
              <div className="group bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl group-hover:scale-110 transition-transform">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-white">Join 50K+ Users</h3>
                    <p className="text-slate-400 text-sm">Trusted by businesses worldwide</p>
                  </div>
                </div>
              </div>

              <div className="group bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl group-hover:scale-110 transition-transform">
                    <Globe className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-white">Global Reach</h3>
                    <p className="text-slate-400 text-sm">Connect with audiences worldwide</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="space-y-6">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
              <Shield className="w-4 h-4 text-green-400" />
              <span className="text-slate-300">Secure & Private</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-slate-300">AI-Powered</span>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
            ))}
            <span className="ml-2 text-slate-300">Rated 5/5 by our users</span>
          </div>
        </div>
      </div>

      {/* Right Side - Enhanced Signup Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center space-x-3 mb-4">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-75"></div>
                <div className="relative p-3 bg-slate-900 rounded-xl">
                  <MessageSquare className="h-6 w-6 text-purple-400" />
                </div>
              </div>
              <span className="text-2xl font-bold text-white">BrandBuzz</span>
            </div>
          </div>

          <Card className="relative bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg"></div>
            <CardHeader className="text-center pb-8 relative z-10">
              <CardTitle className="text-3xl font-bold text-white mb-2">Create Your Account</CardTitle>
              <CardDescription className="text-slate-300 text-base">
                Join BrandBuzz Ventures and start your marketing journey
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-200 font-medium">
                    Full Name
                  </Label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5 group-focus-within:text-purple-400 transition-colors" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className="pl-12 h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-purple-400 focus:ring-purple-400/20 backdrop-blur-sm"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-200 font-medium">
                    Email Address
                  </Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5 group-focus-within:text-purple-400 transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className="pl-12 h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-purple-400 focus:ring-purple-400/20 backdrop-blur-sm"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-200 font-medium">
                    Password
                  </Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5 group-focus-within:text-purple-400 transition-colors" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      className="pl-12 pr-12 h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-purple-400 focus:ring-purple-400/20 backdrop-blur-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company" className="text-slate-200 font-medium">
                    Company <span className="text-slate-400 text-sm">(Optional)</span>
                  </Label>
                  <div className="relative group">
                    <Building className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5 group-focus-within:text-purple-400 transition-colors" />
                    <Input
                      id="company"
                      type="text"
                      placeholder="Enter your company name"
                      value={formData.company}
                      onChange={(e) => handleInputChange("company", e.target.value)}
                      className="pl-12 h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-purple-400 focus:ring-purple-400/20 backdrop-blur-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-slate-200 font-medium">
                    Phone <span className="text-slate-400 text-sm">(Optional)</span>
                  </Label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5 group-focus-within:text-purple-400 transition-colors" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      className="pl-12 h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-purple-400 focus:ring-purple-400/20 backdrop-blur-sm"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-purple-600 via-purple-600 to-pink-600 hover:from-purple-700 hover:via-purple-700 hover:to-pink-700 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating Account...</span>
                    </div>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-sm text-slate-300">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="text-purple-400 hover:text-purple-300 font-semibold hover:underline transition-all"
                  >
                    Sign in here
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
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
        @keyframes tilt {
          0%, 50%, 100% {
            transform: rotate(0deg);
          }
          25% {
            transform: rotate(1deg);
          }
          75% {
            transform: rotate(-1deg);
          }
        }
        .animate-tilt {
          animation: tilt 10s infinite linear;
        }
      `}</style>
    </div>
  )
}
