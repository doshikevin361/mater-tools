import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ success: false, message: "User ID is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Get all accounts for the user
    const accounts = await db.collection("temp_accounts").find({ userId }).sort({ createdAt: -1 }).toArray()

    return NextResponse.json({
      success: true,
      accounts,
      count: accounts.length,
    })
  } catch (error) {
    console.error("Error fetching accounts:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch accounts",
        error: error.message,
      },
      { status: 500 },
    )
  }
}
