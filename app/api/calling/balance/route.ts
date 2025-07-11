import { type NextRequest, NextResponse } from "next/server"
import { twilioService } from "@/lib/twilio-service"

export async function GET(request: NextRequest) {
  try {
    const balance = await twilioService.getAccountBalance()

    return NextResponse.json({
      success: true,
      balance: balance.balance,
      currency: balance.currency,
    })
  } catch (error) {
    console.error("Error fetching balance:", error)
    return NextResponse.json({ error: "Failed to fetch balance" }, { status: 500 })
  }
}
