import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const callSid = formData.get("CallSid") as string
    const callStatus = formData.get("CallStatus") as string
    const duration = formData.get("CallDuration") as string
    const from = formData.get("From") as string
    const to = formData.get("To") as string

    if (!callSid) {
      return NextResponse.json({ error: "Call SID is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Calculate cost based on duration (₹1.5 per minute)
    const durationSeconds = Number.parseInt(duration) || 0
    const cost = Math.ceil(durationSeconds / 60) * 1.5

    // Update call record based on status
    const updateData: any = {
      status: callStatus,
      updatedAt: new Date(),
    }

    if (callStatus === "completed" && duration) {
      updateData.duration = durationSeconds
      updateData.cost = cost
      updateData.endTime = new Date()
    }

    await db.collection("calls").updateOne({ callSid: callSid }, { $set: updateData })

    // If call completed, deduct cost from user balance
    if (callStatus === "completed" && cost > 0) {
      const callRecord = await db.collection("calls").findOne({ callSid: callSid })
      if (callRecord && callRecord.userId) {
        await db.collection("users").updateOne(
          { _id: callRecord.userId },
          {
            $inc: { balance: -cost },
            $set: { updatedAt: new Date() },
          },
        )
      }
    }

    console.log(`Call ${callSid} status updated to ${callStatus}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json(
      {
        error: "Webhook processing failed",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
