import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contacts, userId, saveToContacts = true } = body

    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json({ success: false, message: "Contacts array is required" }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ success: false, message: "User ID is required" }, { status: 400 })
    }

    const db = await getDatabase()

    // Validate contacts
    const validatedContacts = []
    const errors = []

    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i]
      const contactErrors = []

      // Validate required fields
      if (!contact.name || contact.name.trim() === "") {
        contactErrors.push("Name is required")
      }

      // Validate email format if provided
      if (contact.email && !isValidEmail(contact.email)) {
        contactErrors.push("Invalid email format")
      }

      // Validate phone format if provided
      if (contact.phone && !isValidPhoneNumber(contact.phone)) {
        contactErrors.push("Invalid phone number format")
      }

      if (contact.mobile && !isValidPhoneNumber(contact.mobile)) {
        contactErrors.push("Invalid mobile number format")
      }

      if (contactErrors.length > 0) {
        errors.push(`Row ${i + 1}: ${contactErrors.join(", ")}`)
      } else {
        validatedContacts.push({
          name: contact.name.trim(),
          email: contact.email?.trim() || null,
          phone: contact.phone?.trim() || null,
          mobile: contact.mobile?.trim() || null,
          company: contact.company?.trim() || null,
          group: contact.group?.trim() || "General",
          tags: Array.isArray(contact.tags) ? contact.tags : [],
          status: "active",
          userId: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      }
    }

    if (validatedContacts.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No valid contacts found",
        errors: errors,
      }, { status: 400 })
    }

    let savedContacts = []
    let duplicateCount = 0

    if (saveToContacts) {
      // Save to contacts collection
      for (const contact of validatedContacts) {
        try {
          // Check for duplicates
          const existingContact = await db.collection("contacts").findOne({
            userId: userId,
            $or: [
              { email: contact.email },
              { phone: contact.phone },
              { mobile: contact.mobile }
            ].filter(condition => Object.values(condition)[0] !== null)
          })

          if (existingContact) {
            duplicateCount++
            continue
          }

          const result = await db.collection("contacts").insertOne(contact)
          savedContacts.push({ ...contact, _id: result.insertedId })
        } catch (error) {
          console.error("Error saving contact:", error)
          errors.push(`Failed to save contact: ${contact.name}`)
        }
      }
    } else {
      // Just return validated contacts without saving
      savedContacts = validatedContacts.map((contact, index) => ({
        ...contact,
        _id: `temp_${index}_${Date.now()}`
      }))
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${validatedContacts.length} contacts`,
      contacts: savedContacts,
      totalProcessed: validatedContacts.length,
      savedCount: savedContacts.length,
      duplicateCount: duplicateCount,
      errors: errors.length > 0 ? errors : undefined,
    })

  } catch (error) {
    console.error("Import contacts error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to import contacts", error: error.message },
      { status: 500 }
    )
  }
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

function isValidPhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, "")
  return cleaned.length >= 7 && cleaned.length <= 15
} 