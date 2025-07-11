import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    const transactions = await db
      .collection("transactions")
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray()

    return NextResponse.json({
      success: true,
      transactions,
    })
  } catch (error) {
    console.error("Error fetching transactions:", error)
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 })
  }
}
