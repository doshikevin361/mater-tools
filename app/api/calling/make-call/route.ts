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

    console.log(`Making business call to: ${phoneNumber}`)
    console.log(`Message type: ${messageType}`)
    console.log(`Message: ${message}`)

    // Connect to database
    const { db } = await connectToDatabase()

    // Real professional business message - NO testing language
    const realBusinessMessage =
      message ||
      `Hello, this is BrandBuzz Ventures reaching out to you today. We are a premier digital marketing agency that helps businesses like yours grow their online presence and increase revenue through proven marketing strategies. We specialize in social media automation, targeted email campaigns, SMS marketing, and comprehensive digital solutions that deliver real results. Our team has helped hundreds of businesses expand their reach, engage more customers, and significantly boost their sales. We would love the opportunity to discuss how we can help your business achieve similar success. Please feel free to call us back or visit our website to learn more about our services. We look forward to the possibility of working together. Thank you for your time and have a wonderful day!`

    // Make the actual Twilio call
    let callResult
    if (messageType === "tts") {
      callResult = await voiceService.makeVoiceCallWithTTS(phoneNumber, realBusinessMessage, {
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
      message: realBusinessMessage,
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
      message: "Real business call initiated successfully",
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
