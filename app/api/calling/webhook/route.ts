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
    const timestamp = formData.get("Timestamp") as string

    console.log("Call webhook received:", {
      callSid,
      callStatus,
      callDuration,
      from,
      to,
      timestamp,
    })

    // Connect to database
    const { db } = await connectToDatabase()

    // Update call record in database
    const callRecord = {
      callSid,
      status: callStatus,
      duration: Number.parseInt(callDuration) || 0,
      from,
      to,
      timestamp: timestamp || new Date().toISOString(),
      cost: calculateCallCost(Number.parseInt(callDuration) || 0),
      updatedAt: new Date(),
    }

    await db.collection("call_history").updateOne({ callSid }, { $set: callRecord }, { upsert: true })

    console.log("Call record updated:", callRecord)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}

function calculateCallCost(durationSeconds: number): number {
  // ₹0.50 per minute for Indian calls
  const minutes = Math.ceil(durationSeconds / 60)
  return minutes * 0.5
}
