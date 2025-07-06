"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { RichTextEditor } from "@/components/rich-text-editor"
import { Plus, FileText, Save } from "lucide-react"

interface TemplateCreatorProps {
  platform: string
  onTemplateCreated?: () => void
}

export function TemplateCreator({ platform, onTemplateCreated }: TemplateCreatorProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    subject: "",
    content: "",
    variables: "",
  })

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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      alert("Please enter a template name")
      return
    }

    if (!formData.content.trim()) {
      alert("Please enter template content")
      return
    }

    try {
      setLoading(true)
      const userId = getUserId()

      const templateData = {
        name: formData.name.trim(),
        platform,
        category: formData.category || "Custom",
        subject: formData.subject.trim() || null,
        content: formData.content.trim(),
        variables: formData.variables
          ? formData.variables
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean)
          : [],
        userId,
      }

      console.log("Creating template:", templateData)

      const response = await fetch("/api/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(templateData),
      })

      const result = await response.json()

      if (result.success) {
        alert("✅ Template created successfully!")

        // Reset form
        setFormData({
          name: "",
          category: "",
          subject: "",
          content: "",
          variables: "",
        })

        setOpen(false)

        // Notify parent component
        if (onTemplateCreated) {
          onTemplateCreated()
        }
      } else {
        alert(`❌ Failed to create template: ${result.message}`)
      }
    } catch (error) {
      console.error("Create template error:", error)
      alert("❌ Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Create Template
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Create {platform} Template</span>
          </DialogTitle>
          <DialogDescription>Create a reusable template for your {platform.toLowerCase()} campaigns</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Template Name */}
          <div className="space-y-2">
            <Label htmlFor="template-name">Template Name *</Label>
            <Input
              id="template-name"
              placeholder="e.g., Welcome Email, Monthly Newsletter"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Welcome">Welcome</SelectItem>
                <SelectItem value="Newsletter">Newsletter</SelectItem>
                <SelectItem value="Promotion">Promotion</SelectItem>
                <SelectItem value="Event">Event</SelectItem>
                <SelectItem value="Reminder">Reminder</SelectItem>
                <SelectItem value="Follow-up">Follow-up</SelectItem>
                <SelectItem value="Custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Subject (for Email) */}
          {platform === "Email" && (
            <div className="space-y-2">
              <Label htmlFor="subject">Subject Line</Label>
              <Input
                id="subject"
                placeholder="Enter email subject"
                value={formData.subject}
                onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
              />
            </div>
          )}

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Template Content *</Label>
            {platform === "Email" ? (
              <RichTextEditor
                value={formData.content}
                onChange={(content) => setFormData((prev) => ({ ...prev, content }))}
                placeholder="Enter your template content here..."
                height="250px"
              />
            ) : (
              <Textarea
                id="content"
                placeholder="Enter your template content here..."
                value={formData.content}
                onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                rows={8}
                required
              />
            )}
          </div>

          {/* Variables */}
          <div className="space-y-2">
            <Label htmlFor="variables">Variables (Optional)</Label>
            <Input
              id="variables"
              placeholder="e.g., name, company, date (comma-separated)"
              value={formData.variables}
              onChange={(e) => setFormData((prev) => ({ ...prev, variables: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">
              Use variables like {`{{name}}`} in your content. List them here separated by commas.
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Create Template
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
