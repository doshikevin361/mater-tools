import { type NextRequest, NextResponse } from "next/server"
import twilio from "twilio"
import { connectToDatabase } from "@/lib/mongodb"

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER

if (!accountSid || !authToken || !twilioPhoneNumber) {
  console.error("Missing Twilio credentials in environment variables")
}

const client = twilio(accountSid, authToken)

export async function POST(request: NextRequest) {
  try {
    const { to, record = false } = await request.json()
    const userId = request.headers.get("user-id")

    if (!to) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 401 })
    }

    // Validate Indian phone number
    const cleanedNumber = to.replace(/\D/g, "")
    let formattedNumber = to

    if (cleanedNumber.length === 10) {
      formattedNumber = `+91${cleanedNumber}`
    } else if (cleanedNumber.length === 12 && cleanedNumber.startsWith("91")) {
      formattedNumber = `+${cleanedNumber}`
    } else if (!to.startsWith("+91")) {
      return NextResponse.json({ error: "Invalid Indian phone number format" }, { status: 400 })
    }

    console.log("Making call to:", formattedNumber)

    // Check user balance
    const { db } = await connectToDatabase()
    const user = await db.collection("users").findOne({ _id: userId })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const callCost = 1.5 // ₹1.5 minimum cost
    if (user.balance < callCost) {
      return NextResponse.json(
        {
          error: `Insufficient balance. Required: ₹${callCost}, Available: ₹${user.balance.toFixed(2)}`,
        },
        { status: 400 },
      )
    }

    // Create TwiML for the call
    const twimlUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/calling/twiml`

    // Make the call using Twilio
    const call = await client.calls.create({
      to: formattedNumber,
      from: twilioPhoneNumber,
      url: twimlUrl,
      statusCallback: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/calling/webhook`,
      statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
      statusCallbackMethod: "POST",
      record: record,
      recordingStatusCallback: record
        ? `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/calling/recording-webhook`
        : undefined,
    })

    // Store call record in database
    const callRecord = {
      callSid: call.sid,
      userId: userId,
      to: formattedNumber,
      from: twilioPhoneNumber,
      status: call.status,
      record: record,
      cost: callCost,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await db.collection("call_history").insertOne(callRecord)

    console.log("Call created successfully:", call.sid)

    return NextResponse.json({
      success: true,
      callSid: call.sid,
      status: call.status,
      message: "Call initiated successfully",
    })
  } catch (error) {
    console.error("Error making call:", error)
    return NextResponse.json(
      {
        error: "Failed to make call",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
