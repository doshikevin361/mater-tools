import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const callSid = formData.get("CallSid") as string
    const callStatus = formData.get("CallStatus") as string
    const callDuration = formData.get("CallDuration") as string
    const recordingUrl = formData.get("RecordingUrl") as string

    const { db } = await connectToDatabase()

    const updateData: any = {
      status: callStatus,
      updatedAt: new Date(),
    }

    if (callDuration) {
      updateData.duration = Number.parseInt(callDuration)
      updateData.cost = (Number.parseInt(callDuration) / 60) * 0.05
    }

    if (recordingUrl) {
      updateData.recordingUrl = recordingUrl
    }

    await db.collection("call_history").updateOne({ callSid: callSid }, { $set: updateData })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 })
  }
}
