import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ success: false, message: "User ID is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const campaigns = await db.collection("twitter_campaigns").find({ userId }).sort({ createdAt: -1 }).toArray()

    return NextResponse.json({
      success: true,
      campaigns: campaigns.map((campaign) => ({
        ...campaign,
        id: campaign._id.toString(),
      })),
    })
  } catch (error) {
    console.error("Twitter campaigns fetch error:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch campaigns" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, name, type, targetUrl, targetCount, keywords } = body

    if (!userId || !name || !type || !targetCount) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 })
    }

    if (type !== "keyword_trading" && !targetUrl) {
      return NextResponse.json(
        { success: false, message: "Target URL is required for non-trading campaigns" },
        { status: 400 },
      )
    }

    if (type === "keyword_trading" && (!keywords || keywords.length === 0)) {
      return NextResponse.json(
        { success: false, message: "Keywords are required for trading campaigns" },
        { status: 400 },
      )
    }

    // Calculate cost based on type and count
    const rates = {
      followers: 0.1,
      likes: 0.03,
      retweets: 0.08,
      comments: 0.15,
      keyword_trading: 1.0, // per keyword per day
    }

    let cost = 0
    if (type === "keyword_trading") {
      cost = rates[type] * keywords.length * targetCount // keywords * days
    } else {
      cost = rates[type as keyof typeof rates] * targetCount
    }

    const db = await getDatabase()

    // Check user balance
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) })
    if (!user || user.balance < cost) {
      return NextResponse.json({ success: false, message: "Insufficient balance" }, { status: 400 })
    }

    const campaign = {
      userId,
      name,
      type,
      targetUrl: targetUrl || null,
      keywords: keywords || null,
      targetCount,
      currentCount: 0,
      status: "active",
      cost,
      createdAt: new Date(),
    }

    const result = await db.collection("twitter_campaigns").insertOne(campaign)

    // Deduct cost from user balance
    await db.collection("users").updateOne({ _id: new ObjectId(userId) }, { $inc: { balance: -cost } })

    // Add transaction record
    await db.collection("transactions").insertOne({
      userId,
      type: "debit",
      amount: cost,
      description: `Twitter ${type.replace("_", " ")} campaign: ${name}`,
      campaignId: result.insertedId.toString(),
      status: "completed",
      createdAt: new Date(),
      balanceBefore: user.balance,
      balanceAfter: user.balance - cost,
    })

    return NextResponse.json({
      success: true,
      campaign: {
        ...campaign,
        id: result.insertedId.toString(),
      },
    })
  } catch (error) {
    console.error("Twitter campaign creation error:", error)
    return NextResponse.json({ success: false, message: "Failed to create campaign" }, { status: 500 })
  }
}
