import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("user-id")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const user = await db.collection("users").findOne({ _id: userId })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      balance: user.balance || 0,
      currency: "INR",
    })
  } catch (error) {
    console.error("Error fetching balance:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch balance",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("user-id")
    const { amount, type, description } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 401 })
    }

    if (!amount || !type) {
      return NextResponse.json({ error: "Amount and type are required" }, { status: 400 })
    }

    if (type !== "credit" && type !== "debit") {
      return NextResponse.json({ error: "Type must be 'credit' or 'debit'" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Calculate the balance change
    const balanceChange = type === "credit" ? Math.abs(amount) : -Math.abs(amount)

    // Update user balance
    const result = await db.collection("users").updateOne(
      { _id: userId },
      {
        $inc: { balance: balanceChange },
        $set: { updatedAt: new Date() },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Create transaction record
    await db.collection("transactions").insertOne({
      userId,
      type,
      amount: Math.abs(amount),
      description: description || `Balance ${type}`,
      status: "completed",
      createdAt: new Date(),
    })

    // Get updated balance
    const updatedUser = await db.collection("users").findOne({ _id: userId })

    return NextResponse.json({
      success: true,
      message: `Balance ${type}ed successfully`,
      balance: updatedUser?.balance || 0,
      transaction: {
        type,
        amount: Math.abs(amount),
        description,
      },
    })
  } catch (error) {
    console.error("Error updating balance:", error)
    return NextResponse.json(
      {
        error: "Failed to update balance",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
