import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const callSid = formData.get("CallSid") as string
    const callStatus = formData.get("CallStatus") as string
    const callDuration = formData.get("CallDuration") as string
    const to = formData.get("To") as string
    const from = formData.get("From") as string

    console.log("Call webhook received:", {
      callSid,
      callStatus,
      callDuration,
      to,
      from,
    })

    // Connect to database and update call record
    const { db } = await connectToDatabase()

    const updateData = {
      callSid,
      status: callStatus?.toLowerCase() || "unknown",
      duration: Number.parseInt(callDuration) || 0,
      cost: ((Number.parseInt(callDuration) || 0) / 60) * 0.05, // $0.05 per minute
      updatedAt: new Date(),
    }

    // Update call record in database
    await db.collection("call_history").updateOne({ phoneNumber: to }, { $set: updateData }, { upsert: true })

    console.log("Call record updated:", updateData)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Webhook processing error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
