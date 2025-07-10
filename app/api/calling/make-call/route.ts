import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, record = false } = body

    if (!to) {
      return NextResponse.json({ success: false, message: "Phone number is required" }, { status: 400 })
    }

    // Validate Indian phone number
    const cleanedNumber = to.replace(/\D/g, "")
    if (!cleanedNumber.startsWith("91") || cleanedNumber.length !== 12) {
      return NextResponse.json({ success: false, message: "Invalid Indian phone number" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Create call record
    const callRecord = {
      phoneNumber: to,
      status: "initiated",
      record: record,
      createdAt: new Date(),
      userId: "current-user-id", // Replace with actual user ID from session
    }

    const result = await db.collection("calls").insertOne(callRecord)

    // Here you would integrate with Twilio or other calling service
    // For now, we'll simulate the call initiation

    return NextResponse.json({
      success: true,
      callSid: result.insertedId.toString(),
      message: "Call initiated successfully",
    })
  } catch (error) {
    console.error("Make call error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to initiate call", error: error.message },
      { status: 500 },
    )
  }
}
