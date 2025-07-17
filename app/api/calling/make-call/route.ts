import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { voiceService } from "@/lib/voice-service"

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, message, messageType = "tts" } = await request.json()

    if (!phoneNumber) {
      return NextResponse.json({ success: false, error: "Phone number is required" }, { status: 400 })
    }

    // Format Indian phone number
    const formatIndianNumber = (number: string): string => {
      const cleaned = number.replace(/\D/g, "")
      if (cleaned.length === 10) {
        return `+91${cleaned}`
      }
      if (cleaned.startsWith("91") && cleaned.length === 12) {
        return `+${cleaned}`
      }
      return `+91${cleaned}`
    }

    const formattedNumber = formatIndianNumber(phoneNumber)
    const callMessage = message || "Hello, this is a test call from BrandBuzz Ventures. Thank you for your time."

    console.log(`Initiating call to ${formattedNumber} with message: ${callMessage}`)

    // Make actual Twilio call
    let twilioResult
    try {
      if (messageType === "tts") {
        twilioResult = await voiceService.makeVoiceCallWithTTS(formattedNumber, callMessage, {
          voice: "alice",
          language: "en-US",
          record: true,
          timeout: 30,
          statusCallback: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/calling/webhook`,
        })
      } else {
        return NextResponse.json(
          {
            success: false,
            error: "Audio calls not supported in this endpoint",
          },
          { status: 400 },
        )
      }

      console.log("Twilio call result:", twilioResult)
    } catch (twilioError) {
      console.error("Twilio call error:", twilioError)
      return NextResponse.json(
        {
          success: false,
          error: `Call failed: ${twilioError.message}`,
        },
        { status: 500 },
      )
    }

    // Store call record in database
    const { db } = await connectToDatabase()
    const callRecord = {
      phoneNumber: formattedNumber,
      callSid: twilioResult.callSid,
      status: twilioResult.status || "initiated",
      timestamp: new Date(),
      duration: 0,
      cost: 0,
      type: "browser_call",
      message: callMessage,
      messageType: messageType,
    }

    const result = await db.collection("calls").insertOne(callRecord)

    return NextResponse.json({
      success: true,
      callId: result.insertedId,
      callSid: twilioResult.callSid,
      phoneNumber: formattedNumber,
      status: twilioResult.status,
      message: "Call initiated successfully through Twilio",
      twilioResponse: twilioResult,
    })
  } catch (error) {
    console.error("Error making call:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Failed to make call: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
