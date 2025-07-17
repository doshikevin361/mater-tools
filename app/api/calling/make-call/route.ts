import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { voiceService } from "@/lib/voice-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phoneNumber, message, messageType = "tts" } = body

    if (!phoneNumber) {
      return NextResponse.json(
        {
          success: false,
          error: "Phone number is required",
        },
        { status: 400 },
      )
    }

    console.log(`Making call to: ${phoneNumber}`)
    console.log(`Message type: ${messageType}`)
    console.log(`Message: ${message}`)

    // Connect to database
    const { db } = await connectToDatabase()

    // Make the actual Twilio call
    let callResult
    if (messageType === "tts") {
      const voiceMessage = message || "Hello, this is a test call from BrandBuzz Ventures. Thank you for your time."
      callResult = await voiceService.makeVoiceCallWithTTS(phoneNumber, voiceMessage, {
        voice: "alice",
        language: "en-US",
        record: true,
        statusCallback: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/calling/webhook`,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Audio calls not yet implemented",
        },
        { status: 400 },
      )
    }

    console.log("Twilio call result:", callResult)

    // Save call record to database
    const callRecord = {
      phoneNumber: phoneNumber,
      callSid: callResult.callSid,
      status: callResult.status || "initiated",
      message: message || "Default message",
      messageType: messageType,
      duration: 0,
      cost: 0,
      timestamp: new Date(),
      twilioResponse: {
        callSid: callResult.callSid,
        status: callResult.status,
        to: callResult.to,
        from: callResult.from,
      },
    }

    const result = await db.collection("call_history").insertOne(callRecord)

    console.log("Call record saved to database:", result.insertedId)

    return NextResponse.json({
      success: true,
      callId: result.insertedId,
      callSid: callResult.callSid,
      phoneNumber: phoneNumber,
      status: callResult.status,
      message: "Call initiated successfully through Twilio",
      twilioResponse: callResult,
    })
  } catch (error) {
    console.error("Error making call:", error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to make call",
        details: error.toString(),
      },
      { status: 500 },
    )
  }
}
