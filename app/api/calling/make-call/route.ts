import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, message } = await request.json()

    if (!phoneNumber) {
      return NextResponse.json({ success: false, error: "Phone number is required" }, { status: 400 })
    }

    // Connect to database
    const { db } = await connectToDatabase()

    // Create call record
    const callRecord = {
      phoneNumber,
      message: message || "Browser call",
      status: "initiated",
      timestamp: new Date(),
      duration: 0,
      cost: 0,
      type: "outbound",
      platform: "browser",
    }

    const result = await db.collection("call_history").insertOne(callRecord)

    console.log("Call record created:", result.insertedId)

    return NextResponse.json({
      success: true,
      callId: result.insertedId,
      message: "Call initiated successfully",
    })
  } catch (error) {
    console.error("Error creating call record:", error)
    return NextResponse.json({ success: false, error: "Failed to create call record" }, { status: 500 })
  }
}
