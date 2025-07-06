"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { QuickContactAdd } from "@/components/quick-contact-add"
import { Users, Search, Mail, Phone, Building, Trash2, Edit, Eye, RefreshCw } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Contact {
  _id: string
  name: string
  email?: string
  phone?: string
  company?: string
  group: string
  tags: string[]
  status: string
  createdAt: string
  updatedAt: string
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGroup, setSelectedGroup] = useState("all")
  const [selectedPlatform, setSelectedPlatform] = useState("all")
  const [deleting, setDeleting] = useState<string | null>(null)

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

  // Fetch contacts
  const fetchContacts = async () => {
    try {
      setLoading(true)
      const userId = getUserId()
      const params = new URLSearchParams({
        userId,
        platform: selectedPlatform !== "all" ? selectedPlatform : "",
        group: selectedGroup !== "all" ? selectedGroup : "",
      })

      const response = await fetch(`/api/contacts?${params}`)
      const result = await response.json()

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

  // Delete contact
  const handleDeleteContact = async (contactId: string) => {
    if (!confirm("Are you sure you want to delete this contact?")) {
      return
    }

    try {
      setDeleting(contactId)
      const userId = getUserId()
      const response = await fetch(`/api/contacts?id=${contactId}&userId=${userId}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.success) {
        alert("✅ Contact deleted successfully!")
        fetchContacts() // Refresh the list
      } else {
        alert(`❌ Failed to delete contact: ${result.message}`)
      }
    } catch (error) {
      console.error("Delete contact error:", error)
      alert("❌ Failed to delete contact")
    } finally {
      setDeleting(null)
    }
  }

  // Filter contacts based on search term
  const filteredContacts = contacts.filter((contact) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      contact.name.toLowerCase().includes(searchLower) ||
      contact.email?.toLowerCase().includes(searchLower) ||
      contact.phone?.toLowerCase().includes(searchLower) ||
      contact.company?.toLowerCase().includes(searchLower)
    )
  })

  // Get unique groups
  const groups = Array.from(new Set(contacts.map((contact) => contact.group))).filter(Boolean)

  // Load contacts on mount and when filters change
  useEffect(() => {
    fetchContacts()
  }, [selectedGroup, selectedPlatform])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-50 rounded-lg">
            <Users className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Contacts</h1>
            <p className="text-muted-foreground">Manage your contact database</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={fetchContacts}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Add Contact */}
      <QuickContactAdd onContactAdded={fetchContacts} />

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Management</CardTitle>
          <CardDescription>Search, filter, and manage your contacts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search contacts by name, email, phone, or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Platform Filter */}
            <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="email">Email Contacts</SelectItem>
                <SelectItem value="sms">SMS Contacts</SelectItem>
                <SelectItem value="whatsapp">WhatsApp Contacts</SelectItem>
              </SelectContent>
            </Select>

            {/* Group Filter */}
            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Groups</SelectItem>
                {groups.map((group) => (
                  <SelectItem key={group} value={group}>
                    {group.charAt(0).toUpperCase() + group.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Contacts Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex items-center justify-center space-x-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Loading contacts...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredContacts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center space-y-2">
                        <Users className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          {searchTerm ? "No contacts found matching your search" : "No contacts found"}
                        </p>
                        <p className="text-sm text-muted-foreground">Add your first contact using the form above!</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContacts.map((contact) => (
                    <TableRow key={contact._id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {contact.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span>{contact.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {contact.email ? (
                          <div className="flex items-center space-x-1">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{contact.email}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {contact.phone ? (
                          <div className="flex items-center space-x-1">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{contact.phone}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {contact.company ? (
                          <div className="flex items-center space-x-1">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{contact.company}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{contact.group}</Badge>
                      </TableCell>
                      <TableCell>
                        {contact.tags && contact.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {contact.tags.slice(0, 2).map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {contact.tags.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{contact.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={contact.status === "active" ? "default" : "secondary"}>{contact.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" title="View Details">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Edit Contact">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteContact(contact._id)}
                            disabled={deleting === contact._id}
                            title="Delete Contact"
                            className="text-red-600 hover:text-red-700"
                          >
                            {deleting === contact._id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Contact Stats */}
          {!loading && filteredContacts.length > 0 && (
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Showing {filteredContacts.length} of {contacts.length} contacts
              </span>
              <div className="flex items-center space-x-4">
                <span>
                  Email: {contacts.filter((c) => c.email).length} | Phone: {contacts.filter((c) => c.phone).length}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
