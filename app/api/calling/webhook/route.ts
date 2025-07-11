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

    if (callSid) {
      const { db } = await connectToDatabase()

      // Update or create call record
      const updateData = {
        status: callStatus,
        updatedAt: new Date(),
      }

      // Add duration if call completed
      if (callStatus === "completed" && callDuration) {
        updateData.duration = Number.parseInt(callDuration)
        updateData.cost = (Number.parseInt(callDuration) / 60) * 0.05 // $0.05 per minute
      }

      await db.collection("call_history").updateOne(
        { callSid },
        {
          $set: updateData,
          $setOnInsert: {
            userId: "demo-user",
            phoneNumber: to,
            direction: "outbound",
            callType: "browser-direct",
            timestamp: new Date(),
            createdAt: new Date(),
          },
        },
        { upsert: true },
      )

      console.log(`Call ${callSid} status updated to: ${callStatus}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Call webhook error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
