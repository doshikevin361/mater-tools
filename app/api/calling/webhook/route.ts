import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const params = new URLSearchParams(body)

    const callSid = params.get("CallSid")
    const callStatus = params.get("CallStatus")
    const to = params.get("To")
    const from = params.get("From")
    const duration = params.get("CallDuration")

    console.log(`Call webhook: ${callSid} - Status: ${callStatus}`)

    // Update call record in database
    try {
      const { db } = await connectToDatabase()

      const updateData: any = {
        callSid,
        status: callStatus,
        updatedAt: new Date(),
      }

      if (duration) {
        updateData.duration = Number.parseInt(duration)
        updateData.cost = (Number.parseInt(duration) / 60) * 0.05 // $0.05 per minute
      }

      await db.collection("call_history").updateOne({ phoneNumber: to }, { $set: updateData }, { upsert: true })

      console.log(`Call record updated for ${to}`)
    } catch (dbError) {
      console.error("Failed to update call record:", dbError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in call webhook:", error)
    return NextResponse.json({ success: false, error: "Webhook processing failed" }, { status: 500 })
  }
}
