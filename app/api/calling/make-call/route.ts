import { type NextRequest, NextResponse } from "next/server"
import twilio from "twilio"
import { connectToDatabase } from "@/lib/mongodb"

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER

if (!accountSid || !authToken || !twilioPhoneNumber) {
  throw new Error("Missing Twilio credentials")
}

const client = twilio(accountSid, authToken)

export async function POST(request: NextRequest) {
  try {
    const { to, record = false } = await request.json()
    const userId = request.headers.get("user-id")

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 401 })
    }

    if (!to) {
      return NextResponse.json({ error: "Phone number required" }, { status: 400 })
    }

    // Connect to database
    const { db } = await connectToDatabase()

    // Check user balance
    const user = await db.collection("users").findOne({ _id: userId })
    if (!user || user.balance < 1.5) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 })
    }

    // Make the call
    const call = await client.calls.create({
      to: to,
      from: twilioPhoneNumber,
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/calling/twiml`,
      statusCallback: `${process.env.NEXT_PUBLIC_BASE_URL}/api/calling/webhook`,
      statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
      record: record,
      recordingStatusCallback: record ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/calling/recording-webhook` : undefined,
    })

    // Store call record in database
    await db.collection("calls").insertOne({
      userId,
      callSid: call.sid,
      to,
      from: twilioPhoneNumber,
      status: "initiated",
      startTime: new Date(),
      record,
      cost: 0,
      duration: 0,
      createdAt: new Date(),
    })

    return NextResponse.json({
      success: true,
      callSid: call.sid,
      status: call.status,
    })
  } catch (error) {
    console.error("Error making call:", error)
    return NextResponse.json({ error: "Failed to make call" }, { status: 500 })
  }
}
