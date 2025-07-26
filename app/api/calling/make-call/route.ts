import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, message } = await request.json()

    if (!phoneNumber) {
      return NextResponse.json({ success: false, error: "Phone number is required" }, { status: 400 })
    }

    const formatIndianNumber = (number: string): string => {
      const cleaned = number.replace(/\D/g, "")
      if (cleaned.length === 10) {
        return `+91${cleaned}`
      }
      if (cleaned.startsWith("91") && cleaned.length === 12) {
        return `+${cleaned}`
      }
      return `+91${cleaned}`
    }

    const formattedNumber = formatIndianNumber(phoneNumber)

    const { db } = await connectToDatabase()
    const callRecord = {
      phoneNumber: formattedNumber,
      status: "initiated",
      timestamp: new Date(),
      duration: 0,
      cost: 0,
      type: "browser_call",
    }

    const result = await db.collection("calls").insertOne(callRecord)

    return NextResponse.json({
      success: true,
      callId: result.insertedId,
      phoneNumber: formattedNumber,
      message: "Call initiated successfully",
    })
  } catch (error) {
    console.error("Error making call:", error)
    return NextResponse.json({ success: false, error: "Failed to make call" }, { status: 500 })
  }
}
