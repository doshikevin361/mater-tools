import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    let { phoneNumber, userId = "demo-user-123" } = body

    if (!phoneNumber) {
      return NextResponse.json({ success: false, message: "Phone number is required" }, { status: 400 })
    }

    phoneNumber = phoneNumber.replace(/\D/g, "")

    if (phoneNumber.length === 10) {
      phoneNumber = "+91" + phoneNumber
    } else if (phoneNumber.length === 12 && phoneNumber.startsWith("91")) {
      phoneNumber = "+" + phoneNumber
    } else if (!phoneNumber.startsWith("+91")) {
      phoneNumber = "+91" + phoneNumber.slice(-10)
    }

    const db = await getDatabase()

    const callRecord = {
      userId,
      phoneNumber,
      status: "initiated",
      direction: "outbound",
      duration: 0,
      cost: 0,
      createdAt: new Date(),
    }

    const result = await db.collection("call_history").insertOne(callRecord)

    return NextResponse.json({
      success: true,
      message: "Call initiated successfully",
      callId: result.insertedId.toString(),
      phoneNumber,
    })
  } catch (error) {
    return NextResponse.json({ success: false, message: "Failed to initiate call" }, { status: 500 })
  }
}
