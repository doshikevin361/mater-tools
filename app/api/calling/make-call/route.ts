import { type NextRequest, NextResponse } from "next/server"
import twilio from "twilio"

// Your real Twilio credentials
const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER

export async function POST(request: NextRequest) {
  try {
    // Check if Twilio credentials are configured
    if (!accountSid || !authToken || !twilioPhoneNumber) {
      console.error("Missing Twilio credentials:", {
        accountSid: !!accountSid,
        authToken: !!authToken,
        twilioPhoneNumber: !!twilioPhoneNumber,
      })

      return NextResponse.json(
        {
          error: "Twilio credentials not configured",
          message: "कृपया Twilio credentials को .env फाइल में सेट करें",
          missingCredentials: {
            accountSid: !accountSid,
            authToken: !authToken,
            phoneNumber: !twilioPhoneNumber,
          },
        },
        { status: 500 },
      )
    }

    const { to, record = false } = await request.json()

    if (!to) {
      return NextResponse.json(
        {
          error: "Phone number is required",
          message: "फोन नंबर आवश्यक है",
        },
        { status: 400 },
      )
    }

    // Validate Indian phone number format
    const phoneRegex = /^\+91[6-9]\d{9}$/
    if (!phoneRegex.test(to)) {
      return NextResponse.json(
        {
          error: "Invalid Indian phone number format",
          message: "अवैध भारतीय फोन नंबर प्रारूप",
          expectedFormat: "+91XXXXXXXXXX (10 digits after +91)",
        },
        { status: 400 },
      )
    }

    console.log("Initializing Twilio client with your credentials...")
    console.log("Account SID:", accountSid.substring(0, 10) + "...")
    console.log("From Number:", twilioPhoneNumber)
    console.log("To Number:", to)

    // Initialize Twilio client with your real credentials
    const client = twilio(accountSid, authToken)

    const call = await client.calls.create({
      to: to,
      from: twilioPhoneNumber,
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/voice/twiml`,
      statusCallback: `${process.env.NEXT_PUBLIC_BASE_URL}/api/calling/webhook`,
      statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
      statusCallbackMethod: "POST",
      record: record,
      recordingStatusCallback: record ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/calling/recording-webhook` : undefined,
      timeout: 30,
    })

    console.log("Call created successfully:", call.sid)

    return NextResponse.json({
      success: true,
      callSid: call.sid,
      status: call.status,
      message: "Call initiated successfully",
      messageHindi: "कॉल सफलतापूर्वक शुरू की गई",
      from: twilioPhoneNumber,
      to: to,
    })
  } catch (error) {
    console.error("Error making call:", error)

    // Handle specific Twilio errors
    if (error && typeof error === "object" && "code" in error) {
      const twilioError = error as any

      switch (twilioError.code) {
        case 21211:
          return NextResponse.json(
            {
              error: "Invalid phone number",
              message: "अवैध फोन नंबर",
              details: "The phone number format is invalid",
            },
            { status: 400 },
          )

        case 21214:
          return NextResponse.json(
            {
              error: "Invalid caller ID",
              message: "अवैध कॉलर ID",
              details: "The caller ID (from number) is not valid",
            },
            { status: 400 },
          )

        case 20003:
          return NextResponse.json(
            {
              error: "Authentication failed",
              message: "प्रमाणीकरण विफल",
              details: "Invalid Twilio credentials",
            },
            { status: 401 },
          )

        default:
          return NextResponse.json(
            {
              error: "Twilio API error",
              message: "Twilio API त्रुटि",
              code: twilioError.code,
              details: twilioError.message,
            },
            { status: 500 },
          )
      }
    }

    return NextResponse.json(
      {
        error: "Failed to make call",
        message: "कॉल करने में विफल",
        details: error instanceof Error ? error.message : "Unknown error",
        twilioConfigured: !!(accountSid && authToken && twilioPhoneNumber),
      },
      { status: 500 },
    )
  }
}
