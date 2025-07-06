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
    const campaigns = await db.collection("instagram_campaigns").find({ userId }).sort({ createdAt: -1 }).toArray()

    return NextResponse.json({
      success: true,
      campaigns: campaigns.map((campaign) => ({
        ...campaign,
        id: campaign._id.toString(),
      })),
    })
  } catch (error) {
    console.error("Instagram campaigns fetch error:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch campaigns" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, name, type, targetUrl, targetCount } = body

    if (!userId || !name || !type || !targetUrl || !targetCount) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 })
    }

    // Calculate cost based on type and count
    const rates = {
      followers: 0.08,
      likes: 0.03,
      comments: 0.12,
      views: 0.01,
      story_views: 0.02,
    }

    const cost = rates[type as keyof typeof rates] * targetCount

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
      targetUrl,
      targetCount,
      currentCount: 0,
      status: "active",
      cost,
      createdAt: new Date(),
    }

    const result = await db.collection("instagram_campaigns").insertOne(campaign)

    // Deduct cost from user balance
    await db.collection("users").updateOne({ _id: new ObjectId(userId) }, { $inc: { balance: -cost } })

    // Add transaction record
    await db.collection("transactions").insertOne({
      userId,
      type: "debit",
      amount: cost,
      description: `Instagram ${type} campaign: ${name}`,
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
    console.error("Instagram campaign creation error:", error)
    return NextResponse.json({ success: false, message: "Failed to create campaign" }, { status: 500 })
  }
}
