import { type NextRequest, NextResponse } from "next/server"
import twilio from "twilio"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const { callSid } = await request.json()

    if (!callSid) {
      return NextResponse.json({ error: "Call SID is required" }, { status: 400 })
    }

    // Use your existing Twilio credentials
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN

    if (!accountSid || !authToken) {
      console.error("Twilio credentials missing for end call")
      return NextResponse.json({ error: "Twilio configuration incomplete" }, { status: 500 })
    }

    const client = twilio(accountSid, authToken)

    console.log("Ending call:", callSid)

    // End the call using your existing Twilio setup
    await client.calls(callSid).update({ status: "completed" })

    // Update call record in database
    try {
      const { db } = await connectToDatabase()
      await db.collection("calls").updateOne(
        { callSid },
        {
          $set: {
            status: "completed",
            endTime: new Date(),
            updatedAt: new Date(),
          },
        },
      )
    } catch (dbError) {
      console.error("Database update error:", dbError)
      // Continue even if DB update fails
    }

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
