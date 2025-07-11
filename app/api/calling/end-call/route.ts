import { type NextRequest, NextResponse } from "next/server"
import twilio from "twilio"
import { connectToDatabase } from "@/lib/mongodb"

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN

const client = twilio(accountSid, authToken)

export async function POST(request: NextRequest) {
  try {
    const { callSid } = await request.json()

    if (!callSid) {
      return NextResponse.json({ error: "Call SID is required" }, { status: 400 })
    }

    console.log("Ending call:", callSid)

    // End the call using Twilio
    await client.calls(callSid).update({ status: "completed" })

    // Update call record in database
    const { db } = await connectToDatabase()
    await db.collection("call_history").updateOne(
      { callSid },
      {
        $set: {
          status: "completed",
          endTime: new Date(),
          updatedAt: new Date(),
        },
      },
    )

    console.log("Call ended successfully:", callSid)

    return NextResponse.json({
      success: true,
      message: "Call ended successfully",
    })
  } catch (error) {
    console.error("Error ending call:", error)
    return NextResponse.json(
      {
        error: "Failed to end call",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
