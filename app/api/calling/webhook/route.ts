import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { CallSid, CallStatus, Duration, RecordingUrl } = body

    const { db } = await connectToDatabase()

    // Update call record with status
    const updateData: any = {
      status: CallStatus?.toLowerCase(),
      updatedAt: new Date(),
    }

    if (Duration) {
      updateData.duration = Number.parseInt(Duration)
      updateData.cost = (Number.parseInt(Duration) / 60) * 2.5 // ₹2.5 per minute
    }

    if (RecordingUrl) {
      updateData.recordingUrl = RecordingUrl
    }

    await db.collection("calls").updateOne({ callSid: CallSid }, { $set: updateData })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ success: false, message: "Webhook processing failed" }, { status: 500 })
  }
}
