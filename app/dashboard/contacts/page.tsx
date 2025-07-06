"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { QuickContactAdd } from "@/components/quick-contact-add"
import {
  Users,
  Search,
  Mail,
  Phone,
  Building,
  Trash2,
  Edit,
  Eye,
  RefreshCw,
  Filter,
  Download,
  Plus,
} from "lucide-react"
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
  const [showAddForm, setShowAddForm] = useState(false)

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Modern Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Contacts
                </h1>
                <p className="text-gray-600 text-lg">Manage your contact database with ease</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              onClick={fetchContacts}
              className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white hover:shadow-md transition-all duration-200"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button
              variant="outline"
              className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white hover:shadow-md transition-all duration-200"
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Contact
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Contacts</p>
                  <p className="text-3xl font-bold text-gray-900">{contacts.length}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Email Contacts</p>
                  <p className="text-3xl font-bold text-gray-900">{contacts.filter((c) => c.email).length}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Mail className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Phone Contacts</p>
                  <p className="text-3xl font-bold text-gray-900">{contacts.filter((c) => c.phone).length}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Phone className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Groups</p>
                  <p className="text-3xl font-bold text-gray-900">{groups.length}</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <Building className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Add Contact - Collapsible */}
        {showAddForm && (
          <div className="animate-in slide-in-from-top-2 duration-300">
            <QuickContactAdd
              onContactAdded={() => {
                fetchContacts()
                setShowAddForm(false)
              }}
            />
          </div>
        )}

        {/* Main Content Card */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="border-b border-gray-100 bg-white/50">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">Contact Management</CardTitle>
                <CardDescription className="text-gray-600">
                  Search, filter, and manage your contacts efficiently
                </CardDescription>
              </div>

              {/* Enhanced Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-3 min-w-0 lg:min-w-[500px]">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search contacts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/80 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>

                <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                  <SelectTrigger className="w-full sm:w-48 bg-white/80 border-gray-200">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Platforms</SelectItem>
                    <SelectItem value="email">Email Contacts</SelectItem>
                    <SelectItem value="sms">SMS Contacts</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp Contacts</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                  <SelectTrigger className="w-full sm:w-48 bg-white/80 border-gray-200">
                    <SelectValue placeholder="Group" />
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
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* Enhanced Table */}
            <div className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80 hover:bg-gray-50">
                    <TableHead className="font-semibold text-gray-700">Contact</TableHead>
                    <TableHead className="font-semibold text-gray-700">Email</TableHead>
                    <TableHead className="font-semibold text-gray-700">Phone</TableHead>
                    <TableHead className="font-semibold text-gray-700">Company</TableHead>
                    <TableHead className="font-semibold text-gray-700">Group</TableHead>
                    <TableHead className="font-semibold text-gray-700">Tags</TableHead>
                    <TableHead className="font-semibold text-gray-700">Status</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12">
                        <div className="flex flex-col items-center space-y-4">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                          <p className="text-gray-500 text-lg">Loading contacts...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredContacts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12">
                        <div className="flex flex-col items-center space-y-4">
                          <div className="p-4 bg-gray-100 rounded-full">
                            <Users className="h-12 w-12 text-gray-400" />
                          </div>
                          <div className="space-y-2">
                            <p className="text-xl font-medium text-gray-600">
                              {searchTerm ? "No contacts found matching your search" : "No contacts found"}
                            </p>
                            <p className="text-gray-500">
                              {searchTerm
                                ? "Try adjusting your search terms"
                                : "Add your first contact to get started!"}
                            </p>
                          </div>
                          {!searchTerm && (
                            <Button
                              onClick={() => setShowAddForm(true)}
                              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Add Your First Contact
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredContacts.map((contact, index) => (
                      <TableRow
                        key={contact._id}
                        className="hover:bg-blue-50/50 transition-colors duration-200 border-b border-gray-100"
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full flex items-center justify-center shadow-md">
                              <span className="text-sm font-bold text-white">
                                {contact.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{contact.name}</p>
                              <p className="text-xs text-gray-500">ID: {contact._id.slice(-6)}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {contact.email ? (
                            <div className="flex items-center space-x-2">
                              <div className="p-1 bg-green-100 rounded">
                                <Mail className="h-3 w-3 text-green-600" />
                              </div>
                              <span className="text-sm text-gray-700">{contact.email}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">No email</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {contact.phone ? (
                            <div className="flex items-center space-x-2">
                              <div className="p-1 bg-blue-100 rounded">
                                <Phone className="h-3 w-3 text-blue-600" />
                              </div>
                              <span className="text-sm text-gray-700">{contact.phone}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">No phone</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {contact.company ? (
                            <div className="flex items-center space-x-2">
                              <div className="p-1 bg-purple-100 rounded">
                                <Building className="h-3 w-3 text-purple-600" />
                              </div>
                              <span className="text-sm text-gray-700">{contact.company}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">No company</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200 text-gray-700 font-medium"
                          >
                            {contact.group}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {contact.tags && contact.tags.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {contact.tags.slice(0, 2).map((tag, tagIndex) => (
                                <Badge
                                  key={tagIndex}
                                  variant="secondary"
                                  className="text-xs bg-blue-100 text-blue-700 border-blue-200"
                                >
                                  {tag}
                                </Badge>
                              ))}
                              {contact.tags.length > 2 && (
                                <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                                  +{contact.tags.length - 2}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">No tags</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={contact.status === "active" ? "default" : "secondary"}
                            className={
                              contact.status === "active"
                                ? "bg-green-100 text-green-700 border-green-200"
                                : "bg-gray-100 text-gray-600 border-gray-200"
                            }
                          >
                            {contact.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              title="View Details"
                              className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Edit Contact"
                              className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-600"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteContact(contact._id)}
                              disabled={deleting === contact._id}
                              title="Delete Contact"
                              className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
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

            {/* Enhanced Footer Stats */}
            {!loading && filteredContacts.length > 0 && (
              <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center space-x-6 text-sm text-gray-600">
                    <span className="font-medium">
                      Showing {filteredContacts.length} of {contacts.length} contacts
                    </span>
                    <div className="hidden sm:flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Email: {contacts.filter((c) => c.email).length}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>Phone: {contacts.filter((c) => c.phone).length}</span>
                      </div>
                    </div>
                  </div>

                  {searchTerm && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSearchTerm("")}
                      className="bg-white hover:bg-gray-50"
                    >
                      Clear Search
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
