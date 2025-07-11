import { type NextRequest, NextResponse } from "next/server"
import { twilioService } from "@/lib/twilio-service"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, userId } = await request.json()

    if (!phoneNumber) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 })
    }

    // Format phone number for Indian numbers
    const formatIndianNumber = (number: string) => {
      const cleaned = number.replace(/\D/g, "")
      if (cleaned.startsWith("91") && cleaned.length === 12) {
        return `+${cleaned}`
      } else if (cleaned.length === 10) {
        return `+91${cleaned}`
      } else if (cleaned.startsWith("0") && cleaned.length === 11) {
        return `+91${cleaned.substring(1)}`
      }
      return number.startsWith("+") ? number : `+${cleaned}`
    }

    const formattedNumber = formatIndianNumber(phoneNumber)

    console.log("Making live call to:", formattedNumber)

    // Make a live call that connects directly to the user
    const call = await twilioService.makeLiveCall(formattedNumber)

    // Store call record in database
    const { db } = await connectToDatabase()

    const callRecord = {
      callSid: call.callSid,
      userId: userId || "demo-user",
      phoneNumber: formattedNumber,
      status: call.status,
      direction: "outbound",
      callType: "live", // Mark as live call
      duration: 0,
      cost: 0,
      recordingUrl: null,
      recordingSid: null,
      timestamp: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await db.collection("call_history").insertOne(callRecord)

    return NextResponse.json({
      success: true,
      callSid: call.callSid,
      status: call.status,
      message: "Live call initiated successfully",
    })
  } catch (error) {
    console.error("Error making live call:", error)
    return NextResponse.json({ error: "Failed to make live call", details: error.message }, { status: 500 })
  }
}
