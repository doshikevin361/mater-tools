import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const platform = searchParams.get("platform")

    if (!userId) {
      return NextResponse.json({ success: false, message: "User ID is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const query: any = { userId }

    if (platform && platform !== "all") {
      query.platform = platform
    }

    const accounts = await db.collection("social_automation_accounts").find(query).sort({ createdAt: -1 }).toArray()

    const stats = {
      total: accounts.length,
      instagram: accounts.filter((acc) => acc.platform === "instagram").length,
      facebook: accounts.filter((acc) => acc.platform === "facebook").length,
      twitter: accounts.filter((acc) => acc.platform === "twitter").length,
      active: accounts.filter((acc) => acc.status === "active").length,
      verified: accounts.filter((acc) => acc.verified).length,
    }

    return NextResponse.json({
      success: true,
      accounts: accounts.map((account) => ({
        ...account,
        id: account._id.toString(),
      })),
      stats,
    })
  } catch (error) {
    console.error("Error fetching accounts:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch accounts" }, { status: 500 })
  }
}
