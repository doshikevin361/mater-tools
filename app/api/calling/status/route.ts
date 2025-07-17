import { type NextRequest, NextResponse } from "next/server"
import { voiceService } from "@/lib/voice-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const callSid = searchParams.get("callSid")

    if (!callSid) {
      return NextResponse.json(
        {
          success: false,
          error: "Call SID is required",
        },
        { status: 400 },
      )
    }

    console.log(`Fetching status for call SID: ${callSid}`)

    // Get call status from Twilio
    const callStatus = await voiceService.getCallStatus(callSid)

    console.log(`Call status response:`, callStatus)

    return NextResponse.json({
      success: true,
      callSid: callSid,
      status: callStatus.status,
      duration: callStatus.duration,
      startTime: callStatus.startTime,
      endTime: callStatus.endTime,
      price: callStatus.price,
      priceUnit: callStatus.priceUnit,
      answeredBy: callStatus.answeredBy,
    })
  } catch (error) {
    console.error("Error fetching call status:", error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch call status",
        callSid: request.nextUrl.searchParams.get("callSid"),
      },
      { status: 500 },
    )
  }
}
