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

    console.log("Call webhook received:", {
      callSid,
      callStatus,
      callDuration,
      from,
      to,
    })

    const { db } = await connectToDatabase()

    // Update call record
    const updateData: any = {
      status: callStatus,
      updatedAt: new Date(),
    }

    if (callDuration) {
      const durationSeconds = Number.parseInt(callDuration)
      updateData.duration = durationSeconds
      updateData.endTime = new Date()

      // Calculate cost: ₹1.5 per minute, minimum ₹1.5
      const durationMinutes = Math.ceil(durationSeconds / 60)
      updateData.cost = Math.max(1.5, durationMinutes * 1.5)
    }

    await db.collection("call_history").updateOne({ callSid }, { $set: updateData })

    // If call is completed, deduct cost from user balance
    if (callStatus === "completed" && callDuration) {
      const callRecord = await db.collection("call_history").findOne({ callSid })
      if (callRecord && callRecord.userId) {
        const finalCost = updateData.cost || 1.5

        // Deduct from user balance
        await db.collection("users").updateOne({ _id: callRecord.userId }, { $inc: { balance: -finalCost } })

        // Create transaction record
        await db.collection("transactions").insertOne({
          userId: callRecord.userId,
          type: "debit",
          amount: finalCost,
          description: `Voice call to ${callRecord.to} - ${Math.ceil(Number.parseInt(callDuration) / 60)} minutes`,
          callSid: callSid,
          status: "completed",
          createdAt: new Date(),
        })

        console.log(`Deducted ₹${finalCost} from user ${callRecord.userId} for call ${callSid}`)
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
