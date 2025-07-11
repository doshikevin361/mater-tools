import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber } = await request.json()

    if (!phoneNumber) {
      return NextResponse.json({ success: false, error: "Phone number is required" }, { status: 400 })
    }

    // Format Indian phone number
    const formatIndianNumber = (number: string): string => {
      const cleaned = number.replace(/\D/g, "")

      if (cleaned.startsWith("91") && cleaned.length === 12) {
        return `+${cleaned}`
      }

      if (cleaned.length === 10) {
        return `+91${cleaned}`
      }

      if (cleaned.startsWith("91")) {
        return `+${cleaned}`
      }

      return `+91${cleaned}`
    }

    const formattedNumber = formatIndianNumber(phoneNumber)

    // Log call attempt in database
    const { db } = await connectToDatabase()

    const callRecord = {
      phoneNumber: formattedNumber,
      originalNumber: phoneNumber,
      status: "initiated",
      timestamp: new Date(),
      type: "browser_call",
      cost: 0,
      duration: 0,
    }

    const result = await db.collection("calls").insertOne(callRecord)

    console.log(`Call initiated to ${formattedNumber}`)

    return NextResponse.json({
      success: true,
      callId: result.insertedId,
      formattedNumber: formattedNumber,
      message: "Call initiated successfully",
    })
  } catch (error) {
    console.error("Error initiating call:", error)
    return NextResponse.json({ success: false, error: "Failed to initiate call" }, { status: 500 })
  }
}
