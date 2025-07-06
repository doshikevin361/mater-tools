import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId") || "demo_user"
    const platform = searchParams.get("platform")
    const realOnly = searchParams.get("realOnly") === "true"

    const { db } = await connectToDatabase()
    const query: any = { userId }

    if (platform && platform !== "all") {
      query.platform = platform
    }

    if (realOnly) {
      query.realAccount = true
    }

    const accounts = await db.collection("social_accounts").find(query).sort({ createdAt: -1 }).toArray()

    // Transform accounts for frontend
    const transformedAccounts = accounts.map((account) => ({
      _id: account._id.toString(),
      accountNumber: account.accountNumber || 0,
      platform: account.platform,
      email: account.email,
      username: account.username,
      password: account.password,
      profile: account.profile,
      phoneNumber: account.phoneNumber,
      status: account.status,
      verified: account.verified || false,
      realAccount: account.realAccount || false,
      twilioIntegration: account.twilioIntegration,
      creationResult: account.creationResult,
      createdAt: account.createdAt,
    }))

    return NextResponse.json({
      success: true,
      accounts: transformedAccounts,
      count: transformedAccounts.length,
    })
  } catch (error) {
    console.error("Error fetching social accounts:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch social accounts",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
