import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("user-id")
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")
    const type = searchParams.get("type") // 'credit', 'debit', or null for all

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    // Build query
    const query: any = { userId }
    if (type && (type === "credit" || type === "debit")) {
      query.type = type
    }

    // Fetch transactions
    const transactions = await db
      .collection("transactions")
      .find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray()

    // Get total count
    const totalCount = await db.collection("transactions").countDocuments(query)

    // Format transactions
    const formattedTransactions = transactions.map((transaction) => ({
      id: transaction._id.toString(),
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
      status: transaction.status,
      callSid: transaction.callSid || null,
      createdAt: transaction.createdAt,
    }))

    return NextResponse.json({
      success: true,
      transactions: formattedTransactions,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    })
  } catch (error) {
    console.error("Error fetching transactions:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch transactions",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
