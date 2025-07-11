import { type NextRequest, NextResponse } from "next/server"
import { twilioService } from "@/lib/twilio-service"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber1, phoneNumber2, userId } = await request.json()

    if (!phoneNumber1 || !phoneNumber2) {
      return NextResponse.json({ error: "Both phone numbers are required" }, { status: 400 })
    }

    // Format phone numbers for Indian numbers
    const formatIndianNumber = (number: string) => {
      // Remove all non-digit characters
      const cleaned = number.replace(/\D/g, "")

      // Handle different Indian number formats
      if (cleaned.startsWith("91") && cleaned.length === 12) {
        return `+${cleaned}` // Already has country code
      } else if (cleaned.length === 10) {
        return `+91${cleaned}` // Add India country code
      } else if (cleaned.startsWith("0") && cleaned.length === 11) {
        return `+91${cleaned.substring(1)}` // Remove leading 0 and add country code
      }

      // If it already has + or other country code, return as is
      return number.startsWith("+") ? number : `+${cleaned}`
    }

    const formattedNumber1 = formatIndianNumber(phoneNumber1)
    const formattedNumber2 = formatIndianNumber(phoneNumber2)

    console.log("Connecting calls between:", formattedNumber1, "and", formattedNumber2)

    // Create a conference room
    const conferenceId = `conf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Make first call
    const call1 = await twilioService.makeConferenceCall(formattedNumber1, conferenceId, "first")

    // Wait a moment then make second call
    setTimeout(async () => {
      try {
        await twilioService.makeConferenceCall(formattedNumber2, conferenceId, "second")
      } catch (error) {
        console.error("Error making second call:", error)
      }
    }, 2000)

    // Store conference record
    const { db } = await connectToDatabase()

    const conferenceRecord = {
      conferenceId,
      userId: userId || "demo-user",
      phoneNumber1: formattedNumber1,
      phoneNumber2: formattedNumber2,
      call1Sid: call1.callSid,
      call2Sid: null, // Will be updated when second call is made
      status: "connecting",
      startTime: new Date(),
      endTime: null,
      duration: 0,
      cost: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await db.collection("conference_calls").insertOne(conferenceRecord)

    return NextResponse.json({
      success: true,
      conferenceId,
      call1Sid: call1.callSid,
      message: "Conference call initiated",
    })
  } catch (error) {
    console.error("Error creating conference call:", error)
    return NextResponse.json({ error: "Failed to create conference call", details: error.message }, { status: 500 })
  }
}
