import { type NextRequest, NextResponse } from "next/server"
import { geminiService } from "@/lib/gemini-service"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { postUrl, postContent, commentStyle, sentiment, platforms, accountCount } = body

    // Validate required fields
    if (!postUrl || !platforms || platforms.length === 0) {
      return NextResponse.json({ error: "Post URL and platforms are required" }, { status: 400 })
    }

    // Detect platform from URL if not specified
    let detectedPlatform = "instagram"
    if (postUrl.includes("facebook.com")) detectedPlatform = "facebook"
    else if (postUrl.includes("twitter.com") || postUrl.includes("x.com")) detectedPlatform = "twitter"
    else if (postUrl.includes("youtube.com")) detectedPlatform = "youtube"
    else if (postUrl.includes("instagram.com")) detectedPlatform = "instagram"

    // Connect to database
    const { db } = await connectToDatabase()

    // Get available accounts for selected platforms
    const availableAccounts: any = {}

    for (const platform of platforms) {
      const collectionName = `${platform}_accounts`
      const accounts = await db
        .collection(collectionName)
        .find({ status: "active" })
        .limit(accountCount || 3)
        .toArray()

      availableAccounts[platform] = accounts
    }

    // Generate sample comment for preview
    const sampleComment = await geminiService.generateComment({
      postContent: postContent || "Social media post",
      platform: detectedPlatform,
      style: commentStyle || "engaging",
      sentiment: sentiment || "positive",
    })

    // Log the automation request
    await db.collection("automation_logs").insertOne({
      postUrl,
      postContent,
      commentStyle,
      sentiment,
      platforms,
      accountCount,
      availableAccounts: Object.keys(availableAccounts).reduce((acc, platform) => {
        acc[platform] = availableAccounts[platform].length
        return acc
      }, {} as any),
      sampleComment: sampleComment.comment,
      timestamp: new Date(),
      status: "initiated",
    })

    // In a real implementation, you would:
    // 1. Queue the commenting jobs
    // 2. Use Puppeteer to automate login and commenting
    // 3. Handle rate limiting and delays
    // 4. Update status in real-time via WebSocket or polling

    return NextResponse.json({
      success: true,
      message: "Comment automation started successfully",
      sampleComment: sampleComment.comment,
      accountsFound: Object.keys(availableAccounts).reduce((total, platform) => {
        return total + availableAccounts[platform].length
      }, 0),
      platforms: platforms,
      estimatedComments: platforms.length * (accountCount || 3),
    })
  } catch (error) {
    console.error("Error in comment automation:", error)
    return NextResponse.json({ error: "Failed to start comment automation" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    const { db } = await connectToDatabase()

    // Get recent automation logs
    const logs = await db.collection("automation_logs").find({}).sort({ timestamp: -1 }).limit(limit).toArray()

    // Get statistics
    const stats = await db
      .collection("automation_logs")
      .aggregate([
        {
          $group: {
            _id: null,
            totalAutomations: { $sum: 1 },
            totalComments: { $sum: "$estimatedComments" },
            platformBreakdown: {
              $push: "$platforms",
            },
          },
        },
      ])
      .toArray()

    return NextResponse.json({
      logs,
      stats: stats[0] || { totalAutomations: 0, totalComments: 0, platformBreakdown: [] },
    })
  } catch (error) {
    console.error("Error fetching automation data:", error)
    return NextResponse.json({ error: "Failed to fetch automation data" }, { status: 500 })
  }
}
