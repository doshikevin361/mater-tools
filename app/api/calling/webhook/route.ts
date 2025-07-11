import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const callSid = formData.get("CallSid") as string
    const callStatus = formData.get("CallStatus") as string
    const callDuration = formData.get("CallDuration") as string
    const from = formData.get("From") as string
    const to = formData.get("To") as string

    if (!callSid) {
      return NextResponse.json({ error: "CallSid required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Update call record
    const updateData: any = {
      status: callStatus,
      updatedAt: new Date(),
    }

    if (callDuration) {
      const duration = Number.parseInt(callDuration)
      const cost = (duration / 60) * 1.5 // ₹1.5 per minute
      updateData.duration = duration
      updateData.cost = cost
      updateData.endTime = new Date()

      // Deduct cost from user balance if call completed
      if (callStatus === "completed") {
        const callRecord = await db.collection("calls").findOne({ callSid })
        if (callRecord) {
          await db.collection("users").updateOne({ _id: callRecord.userId }, { $inc: { balance: -cost } })

          // Create transaction record
          await db.collection("transactions").insertOne({
            userId: callRecord.userId,
            type: "call",
            amount: -cost,
            description: `Call to ${to}`,
            callSid,
            createdAt: new Date(),
          })
        }
      }
    }

    await db.collection("calls").updateOne({ callSid }, { $set: updateData })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing webhook:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
