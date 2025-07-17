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

    console.log(`Call webhook: ${callSid} - Status: ${callStatus}`)

    const { db } = await connectToDatabase()

    const updateData: any = {
      status: callStatus,
      updatedAt: new Date(),
    }

    if (callDuration) {
      updateData.duration = Number.parseInt(callDuration)
      updateData.cost = (Number.parseInt(callDuration) / 60) * 0.05 // $0.05 per minute
    }

    await db.collection("calls").updateOne(
      { callSid: callSid },
      {
        $set: updateData,
        $setOnInsert: {
          phoneNumber: to,
          fromNumber: from,
          timestamp: new Date(),
          type: "browser_call",
        },
      },
      { upsert: true },
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing webhook:", error)
    return NextResponse.json({ success: false, error: "Failed to process webhook" }, { status: 500 })
  }
}
