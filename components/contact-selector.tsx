"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, Search, Mail, Phone, MessageSquare, ChevronLeft, ChevronRight, Filter, X } from "lucide-react"

interface Contact {
  _id: string
  name: string
  email?: string
  phone?: string
  mobile?: string
  company?: string
  group: string
  tags?: string[]
  status?: string
}

interface ContactSelectorProps {
  selectedContacts: Contact[]
  onContactsChange: (contacts: Contact[]) => void
  filterByEmail?: boolean
  filterByPhone?: boolean
  platform?: "email" | "whatsapp" | "sms" | "voice"
}

const CONTACTS_PER_PAGE = 10

export function ContactSelector({
  selectedContacts,
  onContactsChange,
  filterByEmail = false,
  filterByPhone = false,
  platform = "email",
}: ContactSelectorProps) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGroup, setSelectedGroup] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  // Get userId from localStorage
  const getUserId = () => {
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("user")
      if (userData) {
        try {
          const user = JSON.parse(userData)
          return user._id
        } catch (error) {
          console.error("Error parsing user data:", error)
        }
      }
      // Fallback to old method
      let userId = localStorage.getItem("userId")
      if (!userId) {
        userId = "demo-user-123"
        localStorage.setItem("userId", userId)
      }
      return userId
    }
    return "demo-user-123"
  }

  // Fetch contacts based on platform
  const fetchContacts = async () => {
    const userId = getUserId()
    try {
      setLoading(true)
      const response = await fetch(`/api/contacts?userId=${userId}`)
      const result = await response.json()

      console.log("Contacts fetch result:", result)

      if (result.success) {
        setContacts(result.contacts || [])
      } else {
        console.error("Failed to fetch contacts:", result.message)
      }
    } catch (error) {
      console.error("Fetch contacts error:", error)
    } finally {
      setLoading(false)
    }
  }

  // Validate phone number
  const isValidPhoneNumber = (phone: string): boolean => {
    if (!phone) return false
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, "")
    // Check if it's a valid length (7-15 digits)
    return cleaned.length >= 7 && cleaned.length <= 15
  }

  // Validate email
  const isValidEmail = (email: string): boolean => {
    if (!email) return false
    return email.includes("@") && email.trim() !== ""
  }

  // Filter contacts based on platform requirements
  const getValidContacts = useMemo(() => {
    return contacts.filter((contact) => {
      if (filterByEmail || platform === "email") {
        return contact.email && isValidEmail(contact.email)
      }
      if (filterByPhone || platform === "whatsapp" || platform === "sms" || platform === "voice") {
        // Check both phone and mobile fields
        const phoneNumber = contact.phone || contact.mobile
        return phoneNumber && isValidPhoneNumber(phoneNumber)
      }
      return true
    })
  }, [contacts, filterByEmail, filterByPhone, platform])

  // Filter contacts based on search and group
  const getFilteredContacts = useMemo(() => {
    let filtered = getValidContacts

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (contact) =>
          contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contact.phone?.includes(searchTerm) ||
          contact.mobile?.includes(searchTerm) ||
          contact.company?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filter by group
    if (selectedGroup !== "all") {
      filtered = filtered.filter((contact) => contact.group === selectedGroup)
    }

    return filtered
  }, [getValidContacts, searchTerm, selectedGroup])

  // Get paginated contacts
  const getPaginatedContacts = useMemo(() => {
    const startIndex = (currentPage - 1) * CONTACTS_PER_PAGE
    const endIndex = startIndex + CONTACTS_PER_PAGE
    return getFilteredContacts.slice(startIndex, endIndex)
  }, [getFilteredContacts, currentPage])

  // Get unique groups
  const getGroups = useMemo(() => {
    const groups = [...new Set(contacts.map((contact) => contact.group))]
    return groups.filter((group) => group && group.trim() !== "")
  }, [contacts])

  // Calculate pagination info
  const totalPages = Math.ceil(getFilteredContacts.length / CONTACTS_PER_PAGE)
  const hasNextPage = currentPage < totalPages
  const hasPrevPage = currentPage > 1

  // Handle contact selection
  const handleContactSelect = (contact: Contact, checked: boolean) => {
    if (checked) {
      const newSelection = [...selectedContacts, contact]
      onContactsChange(newSelection)
    } else {
      const newSelection = selectedContacts.filter((c) => c._id !== contact._id)
      onContactsChange(newSelection)
    }
  }

  // Handle select all (current page)
  const handleSelectAllPage = () => {
    const pageContacts = getPaginatedContacts
    const allPageSelected = pageContacts.every((contact) =>
      selectedContacts.some((selected) => selected._id === contact._id),
    )

    if (allPageSelected) {
      // Deselect all contacts on current page
      const remainingContacts = selectedContacts.filter(
        (selected) => !pageContacts.some((pageContact) => pageContact._id === selected._id),
      )
      onContactsChange(remainingContacts)
    } else {
      // Select all contacts on current page
      const newSelections = pageContacts.filter(
        (contact) => !selectedContacts.some((selected) => selected._id === contact._id),
      )
      onContactsChange([...selectedContacts, ...newSelections])
    }
  }

  // Handle select all filtered
  const handleSelectAllFiltered = () => {
    const allFilteredSelected = getFilteredContacts.every((contact) =>
      selectedContacts.some((selected) => selected._id === contact._id),
    )

    if (allFilteredSelected) {
      // Deselect all filtered contacts
      const remainingContacts = selectedContacts.filter(
        (selected) => !getFilteredContacts.some((filtered) => filtered._id === selected._id),
      )
      onContactsChange(remainingContacts)
    } else {
      // Select all filtered contacts
      const newSelections = getFilteredContacts.filter(
        (contact) => !selectedContacts.some((selected) => selected._id === contact._id),
      )
      onContactsChange([...selectedContacts, ...newSelections])
    }
  }

  // Get platform icon
  const getPlatformIcon = () => {
    switch (platform) {
      case "email":
        return <Mail className="h-4 w-4" />
      case "whatsapp":
        return <MessageSquare className="h-4 w-4" />
      case "sms":
      case "voice":
        return <Phone className="h-4 w-4" />
      default:
        return <Users className="h-4 w-4" />
    }
  }

  // Get platform label
  const getPlatformLabel = () => {
    switch (platform) {
      case "email":
        return "Email Contacts"
      case "whatsapp":
        return "WhatsApp Contacts"
      case "sms":
        return "SMS Contacts"
      case "voice":
        return "Voice Contacts"
      default:
        return "Contacts"
    }
  }

  // Get contact's phone number (phone or mobile)
  const getContactPhone = (contact: Contact) => {
    return contact.phone || contact.mobile || ""
  }

  // Check if contact is selected
  const isContactSelected = (contact: Contact) => {
    return selectedContacts.some((selected) => selected._id === contact._id)
  }

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedGroup])

  useEffect(() => {
    fetchContacts()
  }, [platform])

  const groups = getGroups

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getPlatformIcon()}
            <span className="text-lg">{getPlatformLabel()}</span>
            <Badge variant="secondary" className="ml-2">
              {selectedContacts.length} selected
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2"
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
          </Button>
        </CardTitle>
        <CardDescription>
          Select contacts with valid {filterByEmail || platform === "email" ? "email addresses" : "phone numbers"} for
          your campaign
          {getValidContacts.length !== contacts.length && (
            <div className="mt-2 text-sm text-amber-600 bg-amber-50 p-2 rounded">
              ⚠️ {contacts.length - getValidContacts.length} contacts don't have valid{" "}
              {filterByEmail || platform === "email" ? "email addresses" : "phone numbers"} and are hidden
            </div>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filters */}
        <div className={`space-y-4 ${showFilters ? "block" : "hidden sm:block"}`}>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <div className="sm:w-48">
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger>
                  <SelectValue placeholder="All Groups" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Groups</SelectItem>
                  {groups.map((group) => (
                    <SelectItem key={group} value={group}>
                      {group}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Mobile filter toggle */}
          <div className="sm:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="w-full flex items-center justify-center space-x-2"
            >
              <Filter className="h-4 w-4" />
              <span>{showFilters ? "Hide Filters" : "Show Filters"}</span>
            </Button>
          </div>
        </div>

        {/* Selection Controls */}
        {getFilteredContacts.length > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg">
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" size="sm" onClick={handleSelectAllPage}>
                {getPaginatedContacts.every((contact) => isContactSelected(contact))
                  ? `Deselect Page (${getPaginatedContacts.length})`
                  : `Select Page (${getPaginatedContacts.length})`}
              </Button>
              {getFilteredContacts.length > CONTACTS_PER_PAGE && (
                <Button variant="outline" size="sm" onClick={handleSelectAllFiltered}>
                  {getFilteredContacts.every((contact) => isContactSelected(contact))
                    ? `Deselect All (${getFilteredContacts.length})`
                    : `Select All (${getFilteredContacts.length})`}
                </Button>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              Showing {getPaginatedContacts.length} of {getFilteredContacts.length} contacts
            </div>
          </div>
        )}

        {/* Contacts List */}
        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading contacts...</p>
            </div>
          ) : getPaginatedContacts.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {contacts.length === 0
                  ? `No contacts found. Add some contacts first.`
                  : getValidContacts.length === 0
                    ? `No contacts with valid ${filterByEmail || platform === "email" ? "email addresses" : "phone numbers"} found.`
                    : `No contacts match your search criteria.`}
              </p>
              {getValidContacts.length === 0 && contacts.length > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  Please add {filterByEmail || platform === "email" ? "email addresses" : "phone numbers"} to your
                  existing contacts.
                </p>
              )}
            </div>
          ) : (
            <>
              {getPaginatedContacts.map((contact) => (
                <div
                  key={contact._id}
                  className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    checked={isContactSelected(contact)}
                    onCheckedChange={(checked) => handleContactSelect(contact, checked === true)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="font-medium truncate">{contact.name}</p>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {contact.group}
                      </Badge>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-sm text-muted-foreground">
                      {(filterByEmail || platform === "email") && contact.email && (
                        <div className="flex items-center space-x-1">
                          <Mail className="h-3 w-3 shrink-0" />
                          <span className="truncate">{contact.email}</span>
                        </div>
                      )}
                      {(filterByPhone || platform === "whatsapp" || platform === "sms" || platform === "voice") && (
                        <div className="flex items-center space-x-1">
                          <Phone className="h-3 w-3 shrink-0" />
                          <span>{getContactPhone(contact)}</span>
                        </div>
                      )}
                      {contact.company && (
                        <span className="truncate text-xs text-muted-foreground">{contact.company}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={!hasPrevPage}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="hidden sm:inline ml-1">Previous</span>
                    </Button>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum
                        if (totalPages <= 5) {
                          pageNum = i + 1
                        } else if (currentPage <= 3) {
                          pageNum = i + 1
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i
                        } else {
                          pageNum = currentPage - 2 + i
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={!hasNextPage}
                    >
                      <span className="hidden sm:inline mr-1">Next</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Selected Summary */}
        {selectedContacts.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Selected Contacts ({selectedContacts.length}):</p>
              <Button variant="outline" size="sm" onClick={() => onContactsChange([])} className="text-xs">
                Clear All
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
              {selectedContacts.slice(0, 10).map((contact) => (
                <Badge key={contact._id} variant="secondary" className="text-xs flex items-center space-x-1">
                  <span>{contact.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleContactSelect(contact, false)}
                    className="h-3 w-3 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              ))}
              {selectedContacts.length > 10 && (
                <Badge variant="secondary" className="text-xs">
                  +{selectedContacts.length - 10} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
