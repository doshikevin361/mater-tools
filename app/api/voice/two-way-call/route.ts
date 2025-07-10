import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { voiceService } from "@/lib/voice-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { toNumber, fromNumber, userId, record = true, transcribe = true } = body

    if (!toNumber || !userId) {
      return NextResponse.json({ success: false, message: "Phone number and user ID are required" }, { status: 400 })
    }

    const db = await getDatabase()

    // Verify user exists
    const user = await db.collection("users").findOne({ _id: userId })
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    // Create a two-way call using the enhanced voice service
    const result = await voiceService.createTwoWayCall(toNumber, {
      record,
      transcribe,
      statusCallback: `${process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"}/api/voice/webhook`,
      userId,
    })

    if (result.success) {
      // Log the two-way call initiation
      await db.collection("two_way_calls").insertOne({
        callSid: result.callSid,
        toNumber,
        fromNumber: fromNumber || process.env.TWILIO_PHONE_NUMBER,
        userId,
        status: "initiated",
        record,
        transcribe,
        createdAt: new Date(),
      })

      return NextResponse.json({
        success: true,
        message: "Two-way call initiated successfully",
        callSid: result.callSid,
        status: result.status,
      })
    } else {
      return NextResponse.json(
        { success: false, message: result.error || "Failed to initiate two-way call" },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Two-way call error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to initiate two-way call", error: error.message },
      { status: 500 },
    )
  }
}
