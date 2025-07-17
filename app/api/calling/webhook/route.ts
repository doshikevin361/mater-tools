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

    // Connect to database
    const { db } = await connectToDatabase()

    // Update call record
    const updateData = {
      callSid,
      status: callStatus.toLowerCase(),
      duration: Number.parseInt(callDuration) || 0,
      cost: (Number.parseInt(callDuration) || 0) * 0.05, // $0.05 per minute
      updatedAt: new Date(),
    }

    await db.collection("call_history").updateOne({ phoneNumber: to }, { $set: updateData }, { upsert: true })

    console.log("Call record updated successfully")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ success: false, error: "Webhook processing failed" }, { status: 500 })
  }
}
