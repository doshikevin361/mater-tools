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

    console.log("Webhook received:", { callSid, callStatus, callDuration, from, to })

    if (!callSid) {
      return NextResponse.json({ error: "Missing CallSid" }, { status: 400 })
    }

    // Calculate cost based on duration (₹1.5 per minute)
    const duration = Number.parseInt(callDuration) || 0
    const cost = Math.ceil(duration / 60) * 1.5

    // Update call record in database
    try {
      const { db } = await connectToDatabase()

      const updateData: any = {
        status: callStatus,
        updatedAt: new Date(),
      }

      if (duration > 0) {
        updateData.duration = duration
        updateData.cost = cost
      }

      if (callStatus === "completed") {
        updateData.endTime = new Date()
      }

      await db.collection("calls").updateOne({ callSid }, { $set: updateData })

      console.log("Call record updated:", callSid, callStatus)
    } catch (dbError) {
      console.error("Database error in webhook:", dbError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
