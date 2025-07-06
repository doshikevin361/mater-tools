import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { fast2smsService } from "@/lib/fast2sms-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { recipients, message, campaignName, senderId = "FSTSMS", userId } = body

    console.log("SMS API - Full request body:", JSON.stringify(body, null, 2))

    const actualUserId = userId || "demo-user-123"

    if (!recipients || !message) {
      return NextResponse.json({ success: false, message: "Recipients and message are required" }, { status: 400 })
    }

    const db = await getDatabase()

    // Get user
    let user = await db.collection("users").findOne({ _id: actualUserId })
    if (!user) {
      const demoUser = {
        _id: actualUserId,
        firstName: "Demo",
        lastName: "User",
        email: "vincitore.kevin01@gmail.com",
        balance: 1000,
        createdAt: new Date(),
      }
      await db.collection("users").insertOne(demoUser)
      user = demoUser
    }

    let contactList = []

    // Handle recipients - they can be contact objects or contact IDs
    if (Array.isArray(recipients)) {
      console.log("SMS API - Recipients is array, length:", recipients.length)

      // Check if first item is an object with contact data
      if (recipients.length > 0 && typeof recipients[0] === "object" && recipients[0].name) {
        // Recipients are full contact objects - use them directly
        console.log("SMS API - Recipients are contact objects")
        contactList = recipients
      } else {
        // Recipients are contact IDs - look them up in database
        console.log("SMS API - Recipients are contact IDs, looking up in database")
        const contactIds = recipients.map((id) => {
          try {
            return new ObjectId(id)
          } catch (error) {
            return id
          }
        })

        contactList = await db
          .collection("contacts")
          .find({
            _id: { $in: contactIds },
            userId: actualUserId,
          })
          .toArray()
      }
    }

    console.log("SMS API - Total contacts found:", contactList.length)
    console.log(
      "SMS API - Contact details:",
      contactList.map((c) => ({
        name: c.name,
        phone: c.phone,
        hasPhone: !!(c.phone && c.phone.trim() !== ""),
      })),
    )

    // Filter contacts with valid phone numbers
    const contactsWithPhone = contactList.filter((contact) => {
      const hasValidPhone = contact.phone && contact.phone.trim() !== ""
      console.log(`SMS API - Contact "${contact.name}": phone="${contact.phone}", valid=${hasValidPhone}`)
      return hasValidPhone
    })

    console.log("SMS API - Contacts with valid phone numbers:", contactsWithPhone.length)

    if (contactsWithPhone.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No contacts with phone numbers found.",
          debug: {
            totalContacts: contactList.length,
            contactsWithPhone: contactsWithPhone.length,
            contactDetails: contactList.map((c) => ({
              name: c.name,
              phone: c.phone,
              phoneLength: c.phone ? c.phone.length : 0,
              phoneType: typeof c.phone,
            })),
          },
        },
        { status: 400 },
      )
    }

    // Prepare phone numbers for SMS service (remove +91- format)
    const phoneNumbers = contactsWithPhone.map((contact) => {
      let phone = contact.phone.replace(/\D/g, "") // Remove all non-digits
      if (phone.startsWith("91")) {
        phone = phone.substring(2) // Remove country code
      }
      return phone
    })

    console.log("SMS API - Formatted phone numbers:", phoneNumbers)

    // Actually send SMS using Fast2SMS service
    let smsResult
    let actualSent = 0
    let actualFailed = 0

    try {
      console.log("SMS API - Sending SMS via Fast2SMS...")
      smsResult = await fast2smsService.sendSMS(phoneNumbers, message, senderId)

      if (smsResult.success) {
        actualSent = contactsWithPhone.length
        actualFailed = 0
        console.log("SMS API - SMS sent successfully:", smsResult)
      } else {
        actualSent = 0
        actualFailed = contactsWithPhone.length
        console.log("SMS API - SMS sending failed:", smsResult)
      }
    } catch (error) {
      console.error("SMS API - SMS service error:", error)
      actualSent = 0
      actualFailed = contactsWithPhone.length
    }

    // Extract recipient IDs for campaign storage
    const recipientIds = contactsWithPhone.map((contact) => contact._id || contact.id)

    // Create campaign record with actual results
    const campaign = {
      name: campaignName || `SMS Campaign - ${new Date().toLocaleDateString()}`,
      type: "SMS",
      message,
      senderId,
      recipients: recipientIds,
      recipientCount: contactsWithPhone.length,
      status: actualSent > 0 ? "Completed" : "Failed",
      sent: actualSent,
      delivered: actualSent,
      failed: actualFailed,
      cost: actualSent * 0.25,
      createdAt: new Date(),
      userId: actualUserId,
      smsServiceResult: smsResult,
    }

    const campaignResult = await db.collection("campaigns").insertOne(campaign)

    console.log("SMS API - Campaign created successfully with ID:", campaignResult.insertedId)

    return NextResponse.json({
      success: actualSent > 0,
      message:
        actualSent > 0
          ? `SMS campaign sent successfully to ${actualSent} recipients!`
          : `SMS campaign failed to send to ${actualFailed} recipients.`,
      campaign: {
        ...campaign,
        _id: campaignResult.insertedId,
      },
      results: {
        totalContacts: contactsWithPhone.length,
        sent: actualSent,
        failed: actualFailed,
        cost: actualSent * 0.25,
        successRate: ((actualSent / contactsWithPhone.length) * 100).toFixed(1),
      },
      sentTo: contactsWithPhone.map((c, index) => ({
        name: c.name,
        phone: c.phone,
        formattedPhone: phoneNumbers[index],
      })),
      smsServiceResponse: smsResult,
    })
  } catch (error) {
    console.error("SMS API - Error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to send SMS campaign", error: error.message },
      { status: 500 },
    )
  }
}
