import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, userId, duration = 0 } = await request.json()

    if (!phoneNumber) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Calculate cost for browser call (cheaper than Twilio)
    const cost = (duration / 60) * 0.02 // $0.02 per minute

    const callRecord = {
      userId: userId || "demo-user",
      phoneNumber: phoneNumber,
      callType: "browser",
      duration: duration,
      cost: cost,
      status: "completed",
      timestamp: new Date(),
      createdAt: new Date(),
    }

    await db.collection("call_history").insertOne(callRecord)

    return NextResponse.json({
      success: true,
      message: "Browser call logged successfully",
      cost: cost,
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to log browser call" }, { status: 500 })
  }
}
