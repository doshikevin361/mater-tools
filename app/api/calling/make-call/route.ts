import { type NextRequest, NextResponse } from "next/server"
import { makeBrowserCall, makeDirectCall } from "@/lib/twilio-service"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phoneNumber, callType = "browser", audioUrl, message } = body

    if (!phoneNumber) {
      return NextResponse.json(
        {
          success: false,
          error: "Phone number is required",
          message: "Please provide a valid phone number",
        },
        { status: 400 },
      )
    }

    console.log("Making call:", { phoneNumber, callType, audioUrl })

    let callResult

    if (callType === "browser") {
      // Use TwiML App for browser calling
      callResult = await makeBrowserCall({
        to: phoneNumber,
        url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/calling/twiml-app`,
        record: true,
        recordingChannels: "dual",
        recordingStatusCallback: `${process.env.NEXT_PUBLIC_BASE_URL}/api/calling/recording-webhook`,
      })
    } else {
      // Direct call with custom TwiML
      const twimlUrl = audioUrl
        ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/voice/twiml?audioUrl=${encodeURIComponent(audioUrl)}`
        : `${process.env.NEXT_PUBLIC_BASE_URL}/api/voice/twiml?message=${encodeURIComponent(message || "Hello, this is a test call.")}`

      callResult = await makeDirectCall({
        to: phoneNumber,
        url: twimlUrl,
        record: true,
        recordingChannels: "dual",
        recordingStatusCallback: `${process.env.NEXT_PUBLIC_BASE_URL}/api/calling/recording-webhook`,
      })
    }

    if (callResult.success) {
      // Store call record in database
      try {
        const { db } = await connectToDatabase()
        await db.collection("call_history").insertOne({
          callSid: callResult.callSid,
          phoneNumber: phoneNumber,
          callType: callType,
          status: "initiated",
          audioUrl: audioUrl || null,
          message: message || null,
          twimlAppSid: process.env.TWILIO_TWIML_APP_SID,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        console.log("Call record stored in database")
      } catch (dbError) {
        console.error("Error storing call record:", dbError)
        // Don't fail the API call if database storage fails
      }
    }

    return NextResponse.json({
      success: callResult.success,
      callSid: callResult.callSid,
      error: callResult.error,
      message: callResult.message || (callResult.success ? "Call initiated successfully" : "Call failed"),
      phoneNumber: phoneNumber,
      callType: callType,
    })
  } catch (error: any) {
    console.error("Error in make-call API:", error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
        message: "Failed to initiate call",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const callSid = searchParams.get("callSid")

    if (!callSid) {
      return NextResponse.json(
        {
          success: false,
          error: "Call SID is required",
          message: "Please provide a valid call SID",
        },
        { status: 400 },
      )
    }

    // Get call details from database
    const { db } = await connectToDatabase()
    const callRecord = await db.collection("call_history").findOne({ callSid })

    if (!callRecord) {
      return NextResponse.json(
        {
          success: false,
          error: "Call not found",
          message: "Call record not found in database",
        },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      call: callRecord,
      message: "Call details retrieved successfully",
    })
  } catch (error: any) {
    console.error("Error getting call details:", error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
        message: "Failed to get call details",
      },
      { status: 500 },
    )
  }
}
