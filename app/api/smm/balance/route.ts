import { NextResponse } from "next/server"
import { getSMMClient } from "@/lib/smm-api-client"

export async function GET() {
  try {
    const smmClient = getSMMClient()
    const balance = await smmClient.getBalance()

    return NextResponse.json({
      success: true,
      balance: balance,
    })
  } catch (error) {
    console.error("Error fetching SMM balance:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch balance",
        error: error.message,
      },
      { status: 500 },
    )
  }
}
