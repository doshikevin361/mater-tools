import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const callSid = formData.get("CallSid") as string
    const callStatus = formData.get("CallStatus") as string
    const callDuration = formData.get("CallDuration") as string
    const recordingUrl = formData.get("RecordingUrl") as string

    console.log("Call webhook received:", {
      callSid,
      callStatus,
      callDuration,
      recordingUrl,
    })

    const db = await getDatabase()

    // Update call record
    const updateData: any = {
      status: callStatus.toLowerCase(),
      updatedAt: new Date(),
    }

    if (callDuration) {
      updateData.duration = Number.parseInt(callDuration)
      updateData.endTime = new Date()
    }

    if (recordingUrl) {
      updateData.recordingUrl = recordingUrl
    }

    await db.collection("calls").updateOne({ callSid }, { $set: updateData })

    // If call is completed, deduct cost from user balance
    if (callStatus === "completed" && callDuration) {
      const callRecord = await db.collection("calls").findOne({ callSid })
      if (callRecord && callRecord.userId) {
        const durationMinutes = Math.ceil(Number.parseInt(callDuration) / 60)
        const totalCost = durationMinutes * 1.5

        await db.collection("users").updateOne({ _id: callRecord.userId }, { $inc: { balance: -totalCost } })

        // Create transaction record
        await db.collection("transactions").insertOne({
          userId: callRecord.userId,
          type: "debit",
          amount: totalCost,
          description: `Outbound call to ${callRecord.phoneNumber} - ${durationMinutes} minutes`,
          callSid,
          status: "completed",
          createdAt: new Date(),
        })
      }
    }

    return NextResponse.json({ success: true, message: "Webhook processed successfully" })
  } catch (error) {
    console.error("Call webhook error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to process webhook", error: error.message },
      { status: 500 },
    )
  }
}
