import { type NextRequest, NextResponse } from "next/server"
import { voiceService } from "@/lib/voice-service"
import { connectToDatabase } from "@/lib/mongodb"

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

    console.log(`Checking status for call: ${callSid}`)

    // Get call status from Twilio
    const twilioStatus = await voiceService.getCallStatus(callSid)

    // Update database with latest status
    const { db } = await connectToDatabase()
    await db.collection("call_history").updateOne(
      { callSid: callSid },
      {
        $set: {
          status: twilioStatus.status,
          duration: twilioStatus.duration || 0,
          startTime: twilioStatus.startTime,
          endTime: twilioStatus.endTime,
          price: twilioStatus.price,
          priceUnit: twilioStatus.priceUnit,
          answeredBy: twilioStatus.answeredBy,
          lastUpdated: new Date(),
        },
      },
    )

    console.log(`Call ${callSid} status: ${twilioStatus.status}`)

    return NextResponse.json({
      success: true,
      callSid: callSid,
      status: twilioStatus.status,
      duration: twilioStatus.duration,
      startTime: twilioStatus.startTime,
      endTime: twilioStatus.endTime,
      price: twilioStatus.price,
      priceUnit: twilioStatus.priceUnit,
      answeredBy: twilioStatus.answeredBy,
    })
  } catch (error) {
    console.error("Error checking call status:", error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to check call status",
        details: error.toString(),
      },
      { status: 500 },
    )
  }
}
