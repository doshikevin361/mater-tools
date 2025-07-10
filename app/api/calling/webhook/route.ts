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

    // Connect to database and update call record
    const { db } = await connectToDatabase()

    const callRecord = {
      callSid,
      status: callStatus,
      duration: Number.parseInt(callDuration) || 0,
      from,
      to,
      timestamp: new Date(),
      cost: callDuration ? (Number.parseInt(callDuration) / 60) * 0.05 : 0, // $0.05 per minute
    }

    await db.collection("call_history").updateOne({ callSid }, { $set: callRecord }, { upsert: true })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing call webhook:", error)
    return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 })
  }
}
