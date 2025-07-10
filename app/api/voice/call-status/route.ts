import { type NextRequest, NextResponse } from "next/server"
import { voiceService } from "@/lib/voice-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const callSid = searchParams.get("callSid")

    if (!callSid) {
      return NextResponse.json({ error: "Call SID is required" }, { status: 400 })
    }

    const callStatus = await voiceService.getCallStatus(callSid)

    return NextResponse.json({
      status: callStatus.status,
      duration: callStatus.duration,
      startTime: callStatus.startTime,
      endTime: callStatus.endTime,
    })
  } catch (error) {
    console.error("Error fetching call status:", error)
    return NextResponse.json({ error: "Failed to fetch call status" }, { status: 500 })
  }
}
