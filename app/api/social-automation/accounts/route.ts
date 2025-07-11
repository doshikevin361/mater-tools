import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const platform = searchParams.get("platform")

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Build query
    const query: any = { userId }
    if (platform && platform !== "all") {
      query.platform = platform
    }

    const accounts = await db.collection("social_automation_accounts").find(query).sort({ createdAt: -1 }).toArray()

    // Get statistics
    const stats = await db
      .collection("social_automation_accounts")
      .aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: "$platform",
            count: { $sum: 1 },
            active: {
              $sum: {
                $cond: [{ $eq: ["$status", "active"] }, 1, 0],
              },
            },
          },
        },
      ])
      .toArray()

    const totalAccounts = accounts.length
    const activeAccounts = accounts.filter((acc) => acc.status === "active").length

    return NextResponse.json({
      success: true,
      accounts,
      statistics: {
        total: totalAccounts,
        active: activeAccounts,
        byPlatform: stats.reduce((acc, stat) => {
          acc[stat._id] = {
            total: stat.count,
            active: stat.active,
          }
          return acc
        }, {}),
      },
    })
  } catch (error) {
    console.error("Accounts fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 })
  }
}
