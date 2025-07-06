"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserPlus, Loader2 } from "lucide-react"

interface QuickContactAddProps {
  onContactAdded?: () => void
}

export function QuickContactAdd({ onContactAdded }: QuickContactAddProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    group: "general",
  })
  const [loading, setLoading] = useState(false)

  // Get userId from localStorage
  const getUserId = () => {
    if (typeof window !== "undefined") {
      let userId = localStorage.getItem("userId")
      if (!userId) {
        userId = "demo-user-123"
        localStorage.setItem("userId", userId)
      }
      return userId
    }
    return "demo-user-123"
  }

  // Format phone number as user types
  const handlePhoneChange = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, "")

    // Format as +91-XXXXXXXXXX
    let formatted = digits
    if (digits.length > 0) {
      if (digits.length <= 10) {
        formatted = digits
      } else {
        formatted = digits.substring(0, 10)
      }
    }

    setFormData({ ...formData, phone: formatted })
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      alert("Please enter a contact name")
      return
    }

    if (!formData.email.trim() && !formData.phone.trim()) {
      alert("Please enter either an email address or phone number")
      return
    }

    // Validate email if provided
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      alert("Please enter a valid email address")
      return
    }

    // Validate phone if provided
    if (formData.phone && formData.phone.length < 10) {
      alert("Please enter a valid 10-digit phone number")
      return
    }

    try {
      setLoading(true)
      const userId = getUserId()

      // Format phone number with +91 prefix
      let formattedPhone = formData.phone
      if (formData.phone && !formData.phone.startsWith("+91")) {
        formattedPhone = `+91-${formData.phone}`
      }

      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formattedPhone,
          company: formData.company.trim(),
          group: formData.group,
        }),
      })

      const result = await response.json()

      if (result.success) {
        alert("✅ Contact added successfully!")

        // Reset form
        setFormData({
          name: "",
          email: "",
          phone: "",
          company: "",
          group: "general",
        })

        // Notify parent component
        if (onContactAdded) {
          onContactAdded()
        }
      } else {
        alert(`❌ Failed to add contact: ${result.message}`)
      }
    } catch (error) {
      console.error("Add contact error:", error)
      alert("❌ Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <UserPlus className="h-5 w-5" />
          <span>Quick Add Contact</span>
        </CardTitle>
        <CardDescription>Add a new contact to your database</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Enter full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                  +91-
                </span>
                <Input
                  id="phone"
                  placeholder="Enter 10-digit number"
                  value={formData.phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className="pl-12"
                  maxLength={10}
                />
              </div>
              <p className="text-xs text-muted-foreground">Enter 10-digit Indian mobile number</p>
            </div>

            {/* Company */}
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                placeholder="Enter company name"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>

            {/* Group */}
            <div className="space-y-2">
              <Label htmlFor="group">Group</Label>
              <Select value={formData.group} onValueChange={(value) => setFormData({ ...formData, group: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="customers">Customers</SelectItem>
                  <SelectItem value="prospects">Prospects</SelectItem>
                  <SelectItem value="partners">Partners</SelectItem>
                  <SelectItem value="vendors">Vendors</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Submit Button */}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding Contact...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Contact
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
