import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { emailService } from "@/lib/email-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { recipients, subject, content, campaignName, userId } = body

    console.log("Email API - Full request body:", body)

    const actualUserId = userId || "demo-user-123"

    if (!recipients || !subject || !content) {
      return NextResponse.json(
        { success: false, message: "Recipients, subject, and content are required" },
        { status: 400 },
      )
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

    // Get contacts
    let contactList = []
    if (Array.isArray(recipients)) {
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

    const contactsWithEmail = contactList.filter((contact) => contact.email && contact.email.trim() !== "")

    if (contactsWithEmail.length === 0) {
      return NextResponse.json({ success: false, message: "No contacts with email addresses found." }, { status: 400 })
    }

    // Create campaign
    const campaign = {
      name: campaignName || `Email Campaign - ${new Date().toLocaleDateString()}`,
      type: "Email",
      subject,
      content,
      recipients: recipients,
      recipientCount: contactsWithEmail.length,
      status: "Processing",
      sent: 0,
      delivered: 0,
      failed: 0,
      cost: contactsWithEmail.length * 0.1,
      createdAt: new Date(),
      userId: actualUserId,
    }

    const campaignResult = await db.collection("campaigns").insertOne(campaign)
    const campaignId = campaignResult.insertedId

    // Send emails using Gmail
    try {
      await db
        .collection("campaigns")
        .updateOne({ _id: campaignId }, { $set: { status: "Sending", startedAt: new Date() } })

      const emailAddresses = contactsWithEmail.map((contact) => contact.email)
      const emailResult = await emailService.sendEmail(emailAddresses, subject, content)

      let totalSent = 0
      let totalFailed = 0

      if (emailResult.success) {
        totalSent = contactsWithEmail.length
        totalFailed = 0
      } else {
        totalSent = 0
        totalFailed = contactsWithEmail.length
      }

      // Create message logs for each recipient
      const messageLogs = contactsWithEmail.map((contact) => ({
        campaignId: campaignId.toString(),
        userId: actualUserId,
        contactId: contact._id || contact.id,
        contactName: contact.name,
        contactEmail: contact.email,
        subject: subject,
        message: content,
        status: totalSent > 0 ? "delivered" : "failed",
        timestamp: new Date(),
        error: totalSent > 0 ? null : "Email service failed",
        serviceResponse: emailResult,
      }))

      if (messageLogs.length > 0) {
        await db.collection("message_logs").insertMany(messageLogs)
      }

      // Update campaign
      await db.collection("campaigns").updateOne(
        { _id: campaignId },
        {
          $set: {
            status: totalFailed === 0 ? "Completed" : "Failed",
            sent: totalSent,
            failed: totalFailed,
            delivered: totalSent,
            completedAt: new Date(),
          },
        },
      )

      return NextResponse.json({
        success: true,
        message: `Email campaign sent successfully to ${totalSent} recipients!`,
        campaign: {
          ...campaign,
          _id: campaignId,
          sent: totalSent,
          failed: totalFailed,
          status: totalFailed === 0 ? "Completed" : "Failed",
        },
        results: {
          totalContacts: contactsWithEmail.length,
          sent: totalSent,
          failed: totalFailed,
          cost: totalSent * 0.1,
          successRate: totalSent > 0 ? "100.0" : "0.0",
        },
      })
    } catch (sendError) {
      console.error("Email sending error:", sendError)
      await db
        .collection("campaigns")
        .updateOne({ _id: campaignId }, { $set: { status: "Failed", error: sendError.message, failedAt: new Date() } })

      return NextResponse.json(
        { success: false, message: "Failed to send email campaign: " + sendError.message },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Email API - Error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to send email campaign", error: error.message },
      { status: 500 },
    )
  }
}
