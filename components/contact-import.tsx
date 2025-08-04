"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Upload, 
  Download, 
  Plus, 
  X, 
  FileText, 
  Users, 
  CheckCircle, 
  AlertCircle,
  Mail,
  Phone,
  UserPlus,
  FileSpreadsheet
} from "lucide-react"
import { toast } from "sonner"

interface Contact {
  _id?: string
  name: string
  email?: string
  phone?: string
  mobile?: string
  company?: string
  group?: string
  tags?: string[]
  status?: string
}

interface ContactImportProps {
  onContactsImported: (contacts: Contact[]) => void
  platform: "email" | "whatsapp" | "sms" | "voice"
  existingContacts?: Contact[]
}

export function ContactImport({ onContactsImported, platform, existingContacts = [] }: ContactImportProps) {
  const [importedContacts, setImportedContacts] = useState<Contact[]>([])
  const [directContacts, setDirectContacts] = useState<Contact[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Direct contact form state
  const [directForm, setDirectForm] = useState({
    name: "",
    email: "",
    phone: "",
    mobile: "",
    company: "",
    group: "General"
  })

  // Platform-specific validation
  const validateContact = (contact: Contact): string[] => {
    const errors: string[] = []
    
    if (!contact.name || contact.name.trim() === "") {
      errors.push("Name is required")
    }

    if (platform === "email") {
      if (!contact.email || !isValidEmail(contact.email)) {
        errors.push("Valid email is required for email campaigns")
      }
    } else {
      const phone = contact.phone || contact.mobile
      if (!phone || !isValidPhoneNumber(phone)) {
        errors.push("Valid phone number is required for SMS/WhatsApp/Voice campaigns")
      }
    }

    return errors
  }

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email.trim())
  }

  const isValidPhoneNumber = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, "")
    return cleaned.length >= 7 && cleaned.length <= 15
  }

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsProcessing(true)
    setValidationErrors([])

    try {
      const contacts = await parseFile(file)
      const validatedContacts = validateImportedContacts(contacts)
      setImportedContacts(validatedContacts.valid)
      setValidationErrors(validatedContacts.errors)
      
      if (validatedContacts.valid.length > 0) {
        toast.success(`Successfully imported ${validatedContacts.valid.length} contacts`)
      }
      if (validatedContacts.errors.length > 0) {
        toast.error(`${validatedContacts.errors.length} contacts had validation errors`)
      }
    } catch (error) {
      console.error("File parsing error:", error)
      toast.error("Failed to parse file. Please check the format.")
    } finally {
      setIsProcessing(false)
    }
  }

  // Parse CSV/Excel file
  const parseFile = async (file: File): Promise<Contact[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string
          const lines = text.split('\n')
          const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
          
          const contacts: Contact[] = []
          
          for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === '') continue
            
            const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
            const contact: Contact = {
              name: values[headers.indexOf('name')] || values[headers.indexOf('full name')] || '',
              email: values[headers.indexOf('email')] || values[headers.indexOf('email address')] || '',
              phone: values[headers.indexOf('phone')] || values[headers.indexOf('phone number')] || '',
              mobile: values[headers.indexOf('mobile')] || values[headers.indexOf('mobile number')] || '',
              company: values[headers.indexOf('company')] || values[headers.indexOf('organization')] || '',
              group: values[headers.indexOf('group')] || values[headers.indexOf('category')] || 'General',
              tags: values[headers.indexOf('tags')] ? values[headers.indexOf('tags')].split(';') : []
            }
            
            if (contact.name) {
              contacts.push(contact)
            }
          }
          
          resolve(contacts)
        } catch (error) {
          reject(error)
        }
      }
      
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  // Validate imported contacts
  const validateImportedContacts = (contacts: Contact[]): { valid: Contact[], errors: string[] } => {
    const valid: Contact[] = []
    const errors: string[] = []
    
    contacts.forEach((contact, index) => {
      const contactErrors = validateContact(contact)
      if (contactErrors.length === 0) {
        valid.push(contact)
      } else {
        errors.push(`Row ${index + 2}: ${contactErrors.join(', ')}`)
      }
    })
    
    return { valid, errors }
  }

  // Add direct contact
  const addDirectContact = () => {
    const contact: Contact = {
      name: directForm.name.trim(),
      email: directForm.email.trim(),
      phone: directForm.phone.trim(),
      mobile: directForm.mobile.trim(),
      company: directForm.company.trim(),
      group: directForm.group
    }

    const errors = validateContact(contact)
    if (errors.length > 0) {
      toast.error(`Validation errors: ${errors.join(', ')}`)
      return
    }

    // Check for duplicates
    const isDuplicate = [...directContacts, ...importedContacts].some(
      existing => 
        (contact.email && existing.email === contact.email) ||
        (contact.phone && existing.phone === contact.phone) ||
        (contact.mobile && existing.mobile === contact.mobile)
    )

    if (isDuplicate) {
      toast.error("Contact already exists")
      return
    }

    setDirectContacts([...directContacts, contact])
    setDirectForm({
      name: "",
      email: "",
      phone: "",
      mobile: "",
      company: "",
      group: "General"
    })
    toast.success("Contact added successfully")
  }

  // Remove contact
  const removeContact = (contact: Contact, fromDirect: boolean = false) => {
    if (fromDirect) {
      setDirectContacts(directContacts.filter(c => c !== contact))
    } else {
      setImportedContacts(importedContacts.filter(c => c !== contact))
    }
  }

  // Apply all contacts
  const applyContacts = async () => {
    const allContacts = [...importedContacts, ...directContacts]
    
    if (allContacts.length === 0) {
      toast.error("No contacts to add")
      return
    }

    try {
      const userId = localStorage.getItem("userId")
      if (!userId) {
        toast.error("Please log in to import contacts")
        return
      }

      const response = await fetch("/api/contacts/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contacts: allContacts,
          userId: userId,
          saveToContacts: true // Save to contacts database
        })
      })

      const result = await response.json()

      if (result.success) {
        onContactsImported(result.contacts)
        toast.success(`Successfully added ${result.savedCount} contacts to campaign`)
        
        // Clear the import lists
        setImportedContacts([])
        setDirectContacts([])
        setValidationErrors([])
      } else {
        toast.error(result.message || "Failed to import contacts")
        if (result.errors) {
          setValidationErrors(result.errors)
        }
      }
    } catch (error) {
      console.error("Import error:", error)
      toast.error("Failed to import contacts")
    }
  }

  // Download sample file
  const downloadSampleFile = () => {
    const a = document.createElement('a')
    a.href = `/sample-contacts-${platform}.csv`
    a.download = `sample-contacts-${platform}.csv`
    a.click()
  }

  const getPlatformIcon = () => {
    switch (platform) {
      case "email": return <Mail className="h-4 w-4" />
      case "whatsapp": 
      case "sms": 
      case "voice": return <Phone className="h-4 w-4" />
      default: return <Users className="h-4 w-4" />
    }
  }

  const getPlatformLabel = () => {
    switch (platform) {
      case "email": return "Email Contacts"
      case "whatsapp": return "WhatsApp Contacts"
      case "sms": return "SMS Contacts"
      case "voice": return "Voice Contacts"
      default: return "Contacts"
    }
  }

  const totalContacts = importedContacts.length + directContacts.length

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {getPlatformIcon()}
          <span>Import {getPlatformLabel()}</span>
          {totalContacts > 0 && (
            <Badge variant="secondary">{totalContacts} ready</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Import contacts from file or add them manually. 
          {platform === "email" ? " Valid email addresses required." : " Valid phone numbers required."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="import" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="import" className="flex items-center space-x-2">
              <FileSpreadsheet className="h-4 w-4" />
              <span>Import File</span>
            </TabsTrigger>
            <TabsTrigger value="direct" className="flex items-center space-x-2">
              <UserPlus className="h-4 w-4" />
              <span>Add Direct</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="space-y-4">
            {/* File Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="space-y-4">
                <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-lg font-medium">Upload Contact File</p>
                  <p className="text-sm text-gray-500">
                    Supports CSV, Excel files. {platform === "email" ? "Email addresses" : "Phone numbers"} required.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    className="flex items-center space-x-2"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        <span>Choose File</span>
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={downloadSampleFile}
                    className="flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download Sample</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Imported Contacts */}
            {importedContacts.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Imported Contacts ({importedContacts.length})</h4>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setImportedContacts([])}
                  >
                    Clear All
                  </Button>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {importedContacts.map((contact, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex-1">
                        <p className="font-medium">{contact.name}</p>
                        <div className="text-sm text-gray-600">
                          {platform === "email" ? (
                            contact.email
                          ) : (
                            contact.phone || contact.mobile
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeContact(contact)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">Validation Errors:</p>
                    <div className="max-h-32 overflow-y-auto text-sm">
                      {validationErrors.map((error, index) => (
                        <p key={index} className="text-red-600">• {error}</p>
                      ))}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="direct" className="space-y-4">
            {/* Direct Contact Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={directForm.name}
                  onChange={(e) => setDirectForm({...directForm, name: e.target.value})}
                  placeholder="Full name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="group">Group</Label>
                <Input
                  id="group"
                  value={directForm.group}
                  onChange={(e) => setDirectForm({...directForm, group: e.target.value})}
                  placeholder="General"
                />
              </div>

              {platform === "email" ? (
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={directForm.email}
                    onChange={(e) => setDirectForm({...directForm, email: e.target.value})}
                    placeholder="email@example.com"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={directForm.phone}
                    onChange={(e) => setDirectForm({...directForm, phone: e.target.value})}
                    placeholder="+1234567890"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={directForm.company}
                  onChange={(e) => setDirectForm({...directForm, company: e.target.value})}
                  placeholder="Company name"
                />
              </div>

              {platform !== "email" && (
                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile (Alternative)</Label>
                  <Input
                    id="mobile"
                    value={directForm.mobile}
                    onChange={(e) => setDirectForm({...directForm, mobile: e.target.value})}
                    placeholder="+1234567890"
                  />
                </div>
              )}

              {platform !== "email" && (
                <div className="space-y-2">
                  <Label htmlFor="email-alt">Email (Optional)</Label>
                  <Input
                    id="email-alt"
                    type="email"
                    value={directForm.email}
                    onChange={(e) => setDirectForm({...directForm, email: e.target.value})}
                    placeholder="email@example.com"
                  />
                </div>
              )}
            </div>

            <Button 
              onClick={addDirectContact}
              className="w-full flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Contact</span>
            </Button>

            {/* Direct Contacts List */}
            {directContacts.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Direct Contacts ({directContacts.length})</h4>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setDirectContacts([])}
                  >
                    Clear All
                  </Button>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {directContacts.map((contact, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex-1">
                        <p className="font-medium">{contact.name}</p>
                        <div className="text-sm text-gray-600">
                          {platform === "email" ? (
                            contact.email
                          ) : (
                            contact.phone || contact.mobile
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeContact(contact, true)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Apply Button */}
        {totalContacts > 0 && (
          <div className="border-t pt-4">
            <Button 
              onClick={applyContacts}
              className="w-full flex items-center space-x-2"
            >
              <CheckCircle className="h-4 w-4" />
              <span>Add {totalContacts} Contact{totalContacts !== 1 ? 's' : ''} to Campaign</span>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 