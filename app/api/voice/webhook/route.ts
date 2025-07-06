import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const callSid = formData.get("CallSid") as string
    const callStatus = formData.get("CallStatus") as string
    const to = formData.get("To") as string
    const from = formData.get("From") as string
    const duration = formData.get("CallDuration") as string
    const answeredBy = formData.get("AnsweredBy") as string

    console.log("Voice webhook received:", {
      callSid,
      callStatus,
      to,
      from,
      duration,
      answeredBy,
    })

    const db = await getDatabase()

    // Update message logs with call status
    await db.collection("message_logs").updateOne(
      { messageId: callSid },
      {
        $set: {
          status: callStatus.toLowerCase(),
          duration: duration ? Number.parseInt(duration) : 0,
          answeredBy: answeredBy || null,
          updatedAt: new Date(),
        },
      },
    )

    // Update campaign statistics if call is completed
    if (callStatus === "completed" || callStatus === "failed" || callStatus === "no-answer") {
      const messageLog = await db.collection("message_logs").findOne({ messageId: callSid })

      if (messageLog && messageLog.campaignId) {
        const campaign = await db.collection("campaigns").findOne({ _id: messageLog.campaignId })

        if (campaign) {
          const updateFields: any = {}

          if (callStatus === "completed") {
            updateFields.delivered = (campaign.delivered || 0) + 1
          } else if (callStatus === "failed" || callStatus === "no-answer") {
            updateFields.failed = (campaign.failed || 0) + 1
          }

          if (Object.keys(updateFields).length > 0) {
            updateFields.updatedAt = new Date()

            await db.collection("campaigns").updateOne({ _id: messageLog.campaignId }, { $set: updateFields })
          }
        }
      }
    }

    return NextResponse.json({ success: true, message: "Webhook processed successfully" })
  } catch (error) {
    console.error("Voice webhook error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to process webhook", error: error.message },
      { status: 500 },
    )
  }
}
