import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const platform = searchParams.get("platform")
    const group = searchParams.get("group")

    if (!userId) {
      return NextResponse.json({ success: false, message: "User ID is required" }, { status: 400 })
    }

    const db = await getDatabase()

    // Build query
    const query: any = {
      userId: userId,
      status: { $ne: "deleted" },
    }

    // Add platform-specific filters
    if (platform) {
      switch (platform) {
        case "email":
          query.email = { $exists: true, $ne: null, $ne: "", $regex: /.+@.+\..+/ }
          break
        case "whatsapp":
        case "sms":
        case "voice":
          // For phone-based platforms, check both phone and mobile fields
          query.$or = [
            { phone: { $exists: true, $ne: null, $ne: "", $regex: /^[+]?[0-9\s\-$$$$]{7,15}$/ } },
            { mobile: { $exists: true, $ne: null, $ne: "", $regex: /^[+]?[0-9\s\-$$$$]{7,15}$/ } },
          ]
          break
      }
    }

    // Add group filter
    if (group && group !== "all") {
      query.group = group
    }

    console.log("Contacts query:", JSON.stringify(query, null, 2))

    const contacts = await db.collection("contacts").find(query).sort({ createdAt: -1 }).toArray()

    console.log(`Found ${contacts.length} contacts for platform: ${platform}`)

    // Log some sample contacts for debugging
    if (contacts.length > 0) {
      console.log(
        "Sample contacts:",
        contacts.slice(0, 3).map((c) => ({
          name: c.name,
          phone: c.phone,
          mobile: c.mobile,
          email: c.email,
        })),
      )
    }

    return NextResponse.json({
      success: true,
      contacts: contacts,
      count: contacts.length,
      platform: platform,
      query: query,
    })
  } catch (error) {
    console.error("Get contacts error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch contacts", error: error.message },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, mobile, company, group, tags, userId } = body

    if (!name || !userId) {
      return NextResponse.json({ success: false, message: "Name and User ID are required" }, { status: 400 })
    }

    const db = await getDatabase()

    // Check if contact already exists
    const existingContact = await db.collection("contacts").findOne({
      userId: userId,
      $or: [{ email: email }, { phone: phone }, { mobile: mobile }].filter((condition) => Object.values(condition)[0]), // Remove empty conditions
    })

    if (existingContact) {
      return NextResponse.json(
        { success: false, message: "Contact with this email or phone already exists" },
        { status: 400 },
      )
    }

    const contact = {
      name: name.trim(),
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      mobile: mobile?.trim() || null,
      company: company?.trim() || null,
      group: group?.trim() || "Default",
      tags: Array.isArray(tags) ? tags : [],
      status: "active",
      userId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("contacts").insertOne(contact)

    return NextResponse.json({
      success: true,
      message: "Contact created successfully",
      contact: { ...contact, _id: result.insertedId },
    })
  } catch (error) {
    console.error("Create contact error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to create contact", error: error.message },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { contactId, name, email, phone, mobile, company, group, tags, userId } = body

    if (!contactId || !userId) {
      return NextResponse.json({ success: false, message: "Contact ID and User ID are required" }, { status: 400 })
    }

    const db = await getDatabase()

    const updateData = {
      name: name?.trim(),
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      mobile: mobile?.trim() || null,
      company: company?.trim() || null,
      group: group?.trim() || "Default",
      tags: Array.isArray(tags) ? tags : [],
      updatedAt: new Date(),
    }

    // Remove undefined values
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key]
      }
    })

    const result = await db.collection("contacts").updateOne(
      {
        _id: ObjectId.isValid(contactId) ? new ObjectId(contactId) : contactId,
        userId: userId,
      },
      { $set: updateData },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, message: "Contact not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Contact updated successfully",
    })
  } catch (error) {
    console.error("Update contact error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to update contact", error: error.message },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const contactId = searchParams.get("id")
    const userId = searchParams.get("userId")

    if (!contactId || !userId) {
      return NextResponse.json({ success: false, message: "Contact ID and User ID are required" }, { status: 400 })
    }

    const db = await getDatabase()

    const result = await db.collection("contacts").updateOne(
      {
        _id: ObjectId.isValid(contactId) ? new ObjectId(contactId) : contactId,
        userId: userId,
      },
      {
        $set: {
          status: "deleted",
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, message: "Contact not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Contact deleted successfully",
    })
  } catch (error) {
    console.error("Delete contact error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to delete contact", error: error.message },
      { status: 500 },
    )
  }
}
