import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, message } = await request.json()

    if (!phoneNumber) {
      return NextResponse.json(
        {
          success: false,
          error: "Phone number is required",
        },
        { status: 400 },
      )
    }

    // Format phone number for Indian numbers
    const formatPhoneNumber = (number: string) => {
      const cleaned = number.replace(/\D/g, "")

      // If it's 10 digits, add +91
      if (cleaned.length === 10) {
        return `+91${cleaned}`
      }

      // If it already has 91 prefix
      if (cleaned.startsWith("91") && cleaned.length === 12) {
        return `+${cleaned}`
      }

      // If it already has + prefix
      if (number.startsWith("+")) {
        return number
      }

      // Default: add +91
      return `+91${cleaned}`
    }

    const formattedNumber = formatPhoneNumber(phoneNumber)
    console.log(`Formatted phone number: ${phoneNumber} -> ${formattedNumber}`)

    // Store call attempt in database
    const { db } = await connectToDatabase()

    const callRecord = {
      phoneNumber: formattedNumber,
      originalNumber: phoneNumber,
      message: message || "Browser call initiated",
      status: "initiated",
      timestamp: new Date(),
      type: "browser_call",
      cost: 0,
      duration: 0,
    }

    const result = await db.collection("calls").insertOne(callRecord)
    console.log("Call record created:", result.insertedId)

    return NextResponse.json({
      success: true,
      message: "Call initiated successfully",
      callId: result.insertedId,
      formattedNumber: formattedNumber,
    })
  } catch (error) {
    console.error("Make call error:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Failed to initiate call: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
