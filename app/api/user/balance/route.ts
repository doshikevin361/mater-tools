import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("user-id")

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const user = await db.collection("users").findOne({ _id: userId })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      balance: user.balance || 0,
    })
  } catch (error) {
    console.error("Error fetching balance:", error)
    return NextResponse.json({ error: "Failed to fetch balance" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { amount } = await request.json()
    const userId = request.headers.get("user-id")

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 401 })
    }

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Valid amount required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Add balance to user account
    await db.collection("users").updateOne(
      { _id: userId },
      {
        $inc: { balance: amount },
        $set: { updatedAt: new Date() },
      },
      { upsert: true },
    )

    // Create transaction record
    await db.collection("transactions").insertOne({
      userId,
      type: "credit",
      amount,
      description: "Balance added",
      createdAt: new Date(),
    })

    return NextResponse.json({
      success: true,
      message: "Balance added successfully",
    })
  } catch (error) {
    console.error("Error adding balance:", error)
    return NextResponse.json({ error: "Failed to add balance" }, { status: 500 })
  }
}
