import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { voiceService } from "@/lib/voice-service"

export async function POST(request: NextRequest) {
try {
  const body = await request.json()
  const { recipients, message, audioUrl, campaignName, userId, voiceOptions, campaignType = "tts" } = body


  const actualUserId = userId

  if (!recipients || (!message && !audioUrl)) {
    return NextResponse.json(
      { success: false, message: "Recipients and either message or audio URL are required" },
      { status: 400 },
    )
  }

  if (audioUrl && audioUrl.startsWith("blob:")) {
    return NextResponse.json(
      { success: false, message: "Invalid audio URL. Please upload the audio file to the server first." },
      { status: 400 },
    )
  }

  const db = await getDatabase()

  const user = await db.collection("users").findOne({ _id: actualUserId })
  if (!user) {
    return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
  }


  let contactList = []

  if (Array.isArray(recipients)) {
    if (recipients.length > 0 && recipients[0].name && (recipients[0].phone || recipients[0].mobile)) {
      contactList = recipients.filter((contact) => {
        const hasValidPhone =
          (contact.phone && contact.phone.trim() !== "") || (contact.mobile && contact.mobile.trim() !== "")
        const belongsToUser = contact.userId === actualUserId
        return hasValidPhone && belongsToUser && contact.status !== "deleted"
      })
    } else {
      const contactIds = recipients.map((id) => {
        try {
          return ObjectId.isValid(id) ? new ObjectId(id) : id
        } catch (error) {
          return id
        }
      })

      contactList = await db
        .collection("contacts")
        .find({
          $and: [
            { $or: [{ _id: { $in: contactIds } }, { _id: { $in: recipients } }] },
            { userId: actualUserId },
            { status: { $ne: "deleted" } },
            {
              $or: [
                { phone: { $exists: true, $ne: null, $ne: "" } },
                { mobile: { $exists: true, $ne: null, $ne: "" } },
              ],
            },
          ],
        })
        .toArray()
    }
  }


  if (contactList.length === 0) {
    return NextResponse.json(
      {
        success: false,
        message: "No contacts with valid phone numbers found.",
      },
      { status: 400 },
    )
  }

  const campaignCost = contactList.length * 1.5

  if (user.balance < campaignCost) {
    return NextResponse.json(
      {
        success: false,
        message: `Insufficient balance. Required: ₹${campaignCost.toFixed(2)}, Available: ₹${user.balance.toFixed(2)}`,
      },
      { status: 400 },
    )
  }

  const campaign = {
    name: campaignName || `Voice Campaign - ${new Date().toLocaleDateString()}`,
    type: "Voice",
    campaignType: campaignType, // 'tts' or 'audio'
    message: campaignType === "tts" ? message : undefined,
    audioUrl: campaignType === "audio" ? audioUrl : undefined,
    recipients: Array.isArray(recipients) ? recipients.map((r) => r._id || r) : [recipients._id || recipients],
    recipientCount: contactList.length,
    status: "Processing",
    sent: 0,
    delivered: 0,
    failed: 0,
    cost: campaignCost,
    voiceOptions: voiceOptions || { voice: "alice", language: "en-US", record: false },
    createdAt: new Date(),
    userId: actualUserId,
  }

  const campaignResult = await db.collection("campaigns").insertOne(campaign)
  const campaignId = campaignResult.insertedId

  try {
    await db
      .collection("campaigns")
      .updateOne({ _id: campaignId }, { $set: { status: "Sending", startedAt: new Date() } })


    const voiceContacts = contactList.map((contact) => ({
      phone: contact.phone || contact.mobile,
      name: contact.name,
      messageType: campaignType,
      message: campaignType === "tts" ? message : undefined,
      audioUrl: campaignType === "audio" ? audioUrl : undefined,
    }))

    const enhancedVoiceOptions = {
      ...voiceOptions,
      statusCallback: `${process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"}/api/voice/webhook`,
      record: voiceOptions?.record || false,
    }

    const voiceResult = await voiceService.makeBulkVoiceCalls(
      voiceContacts,
      campaignType === "tts" ? message : undefined,
      enhancedVoiceOptions,
    )


    const totalSent = voiceResult.successful
    const totalFailed = voiceResult.failed

    const detailedResults = voiceResult.results.map((result, index) => ({
      contactId: contactList[index]._id,
      phone: result.contact.phone,
      name: result.contact.name,
      success: result.success,
      callSid: result.callSid,
      status: result.status,
      error: result.error,
      timestamp: result.timestamp,
    }))

    // Update campaign with results
    await db.collection("campaigns").updateOne(
      { _id: campaignId },
      {
        $set: {
          status: totalFailed === 0 ? "Completed" : totalSent > 0 ? "Partially Completed" : "Failed",
          sent: totalSent,
          failed: totalFailed,
          delivered: totalSent,
          completedAt: new Date(),
          voiceResults: detailedResults,
          successRate: voiceResult.successRate,
        },
      },
    )

    // Create message logs
    const messageLogs = detailedResults.map((result) => ({
      campaignId,
      contactId: result.contactId,
      mobile: result.phone,
      status: result.success ? "sent" : "failed",
      messageId: result.callSid,
      error: result.error,
      timestamp: result.timestamp,
    }))

    if (messageLogs.length > 0) {
      await db.collection("message_logs").insertMany(messageLogs)
    }

    // Deduct cost from user balance
    const actualCost = totalSent * 1.5
    await db.collection("users").updateOne(
      { _id: actualUserId },
      {
        $inc: { balance: -actualCost },
        $set: { updatedAt: new Date() },
      },
    )

    // Create transaction record
    await db.collection("transactions").insertOne({
      userId: actualUserId,
      type: "debit",
      amount: actualCost,
      description: `Voice campaign: ${totalSent} calls initiated, ${totalFailed} failed`,
      campaignId,
      status: "completed",
      balanceBefore: user.balance,
      balanceAfter: user.balance - actualCost,
      createdAt: new Date(),
      processedAt: new Date(),
    })

    return NextResponse.json({
      success: true,
      message: `Voice campaign completed! ${totalSent} calls initiated successfully, ${totalFailed} failed.`,
      campaign: {
        ...campaign,
        _id: campaignId,
        sent: totalSent,
        failed: totalFailed,
        status: totalFailed === 0 ? "Completed" : totalSent > 0 ? "Partially Completed" : "Failed",
      },
      results: {
        totalContacts: contactList.length,
        sent: totalSent,
        failed: totalFailed,
        cost: actualCost,
        successRate: voiceResult.successRate,
        provider: "Professional Voice Service",
      },
      newBalance: user.balance - actualCost,
      voiceResults: detailedResults,
    })
  } catch (sendError) {
    console.error("Voice sending error:", sendError)

    await db.collection("campaigns").updateOne(
      { _id: campaignId },
      {
        $set: {
          status: "Failed",
          error: sendError.message,
          failedAt: new Date(),
        },
      },
    )

    return NextResponse.json(
      {
        success: false,
        message: "Failed to send voice campaign: " + sendError.message,
      },
      { status: 500 },
    )
  }
} catch (error) {
  console.error("Voice send error:", error)
  return NextResponse.json(
    { success: false, message: "Failed to start voice campaign", error: error.message },
    { status: 500 },
  )
}
}
