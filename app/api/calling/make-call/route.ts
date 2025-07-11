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

    // Log the call attempt to database
    try {
      const { db } = await connectToDatabase()

      const callRecord = {
        phoneNumber: formattedNumber,
        status: "initiated",
        timestamp: new Date(),
        duration: 0,
        cost: 0,
        type: "browser_call",
      }

      await db.collection("call_history").insertOne(callRecord)
      console.log(`Call attempt logged for ${formattedNumber}`)
    } catch (dbError) {
      console.error("Failed to log call to database:", dbError)
      // Continue with call even if logging fails
    }

    return NextResponse.json({
      success: true,
      message: "Call initiated",
      phoneNumber: formattedNumber,
    })
  } catch (error) {
    console.error("Error in make-call API:", error)
    return NextResponse.json({ success: false, error: "Failed to initiate call" }, { status: 500 })
  }
}
