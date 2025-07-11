import { type NextRequest, NextResponse } from "next/server"
import { twilioService } from "@/lib/twilio-service"

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber } = await request.json()

    if (!phoneNumber) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 })
    }

    console.log("Making live call to:", phoneNumber)

    const result = await twilioService.makeLiveCall(phoneNumber)

    return NextResponse.json({
      success: true,
      message: "Live call initiated successfully",
      callSid: result.callSid,
      status: result.status,
      to: result.to,
      from: result.from,
    })
  } catch (error) {
    console.error("Live call API error:", error)
    return NextResponse.json(
      {
        error: "Failed to make live call",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
