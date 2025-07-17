import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { geminiService } from "@/lib/gemini-service"

interface CommentRequest {
  postUrl: string
  postContent?: string
  platforms: string[]
  commentStyle: string
  sentiment: string
  accountCount: number
}

export async function POST(request: NextRequest) {
  try {
    const body: CommentRequest = await request.json()
    const { postUrl, postContent, platforms, commentStyle, sentiment, accountCount } = body

    if (!postUrl || !platforms || platforms.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Post URL and platforms are required",
        },
        { status: 400 },
      )
    }

    console.log("Starting social media comment automation:", {
      postUrl,
      platforms,
      commentStyle,
      sentiment,
      accountCount,
    })

    // Connect to database
    const { db } = await connectToDatabase()

    // Detect platform from URL
    const detectedPlatform = detectPlatformFromUrl(postUrl)
    if (!detectedPlatform) {
      return NextResponse.json(
        {
          success: false,
          error: "Could not detect platform from URL",
        },
        { status: 400 },
      )
    }

    // Get accounts for selected platforms
    const accounts = await getAccountsForPlatforms(db, platforms, accountCount)
    if (accounts.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No accounts found for selected platforms",
        },
        { status: 400 },
      )
    }

    // Generate AI comment
    const commentResult = await geminiService.generateComment({
      platform: detectedPlatform as any,
      style: commentStyle as any,
      sentiment: sentiment as any,
      postContent: postContent,
    })

    if (!commentResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to generate comment",
        },
        { status: 500 },
      )
    }

    console.log("Generated comment:", commentResult.comment)

    // Start automation process
    const automationId = new Date().getTime().toString()
    const results = []

    // Log automation start
    await db.collection("automation_logs").insertOne({
      automationId,
      postUrl,
      platforms,
      commentStyle,
      sentiment,
      accountCount: accounts.length,
      generatedComment: commentResult.comment,
      status: "started",
      timestamp: new Date(),
    })

    // Process each account
    for (let i = 0; i < Math.min(accounts.length, accountCount); i++) {
      const account = accounts[i]

      try {
        console.log(`Processing account ${i + 1}/${accountCount}: ${account.username} (${account.platform})`)

        // Simulate automation delay
        if (i > 0) {
          const delay = Math.random() * 60000 + 30000 // 30-90 seconds
          console.log(`Waiting ${Math.round(delay / 1000)} seconds before next account...`)
          await new Promise((resolve) => setTimeout(resolve, delay))
        }

        // Simulate comment posting (replace with actual Puppeteer automation)
        const commentSuccess = await simulateCommentPosting(account, postUrl, commentResult.comment)

        const result = {
          account: {
            username: account.username,
            platform: account.platform,
          },
          success: commentSuccess,
          comment: commentResult.comment,
          timestamp: new Date(),
          error: commentSuccess ? null : "Simulated failure for demo",
        }

        results.push(result)

        // Log individual result
        await db.collection("comment_history").insertOne({
          automationId,
          accountId: account._id,
          username: account.username,
          platform: account.platform,
          postUrl,
          comment: commentResult.comment,
          success: commentSuccess,
          timestamp: new Date(),
        })

        console.log(`Account ${account.username}: ${commentSuccess ? "SUCCESS" : "FAILED"}`)
      } catch (error) {
        console.error(`Error processing account ${account.username}:`, error)

        results.push({
          account: {
            username: account.username,
            platform: account.platform,
          },
          success: false,
          comment: commentResult.comment,
          timestamp: new Date(),
          error: error.message,
        })
      }
    }

    // Calculate statistics
    const successful = results.filter((r) => r.success).length
    const failed = results.filter((r) => !r.success).length
    const successRate = ((successful / results.length) * 100).toFixed(1)

    // Update automation log
    await db.collection("automation_logs").updateOne(
      { automationId },
      {
        $set: {
          status: "completed",
          results,
          statistics: {
            total: results.length,
            successful,
            failed,
            successRate: Number.parseFloat(successRate),
          },
          completedAt: new Date(),
        },
      },
    )

    console.log(`Automation completed: ${successful}/${results.length} successful (${successRate}%)`)

    return NextResponse.json({
      success: true,
      automationId,
      generatedComment: commentResult.comment,
      statistics: {
        total: results.length,
        successful,
        failed,
        successRate: Number.parseFloat(successRate),
      },
      results,
      message: `Comment automation completed! ${successful}/${results.length} accounts posted successfully.`,
    })
  } catch (error) {
    console.error("Social automation error:", error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process automation request",
      },
      { status: 500 },
    )
  }
}

function detectPlatformFromUrl(url: string): string | null {
  if (url.includes("instagram.com")) return "instagram"
  if (url.includes("facebook.com")) return "facebook"
  if (url.includes("twitter.com") || url.includes("x.com")) return "twitter"
  if (url.includes("youtube.com")) return "youtube"
  return null
}

async function getAccountsForPlatforms(db: any, platforms: string[], limit: number) {
  const accounts = []

  for (const platform of platforms) {
    let collectionName = ""

    switch (platform) {
      case "instagram":
        collectionName = "instagram_accounts"
        break
      case "facebook":
        collectionName = "facebook_accounts"
        break
      case "twitter":
        collectionName = "twitter_accounts"
        break
      default:
        continue
    }

    try {
      const platformAccounts = await db
        .collection(collectionName)
        .find({ status: "active" })
        .limit(Math.ceil(limit / platforms.length))
        .toArray()

      const formattedAccounts = platformAccounts.map((account) => ({
        ...account,
        platform: platform,
      }))

      accounts.push(...formattedAccounts)
    } catch (error) {
      console.error(`Error fetching ${platform} accounts:`, error)
    }
  }

  // Shuffle accounts for randomization
  return accounts.sort(() => Math.random() - 0.5).slice(0, limit)
}

async function simulateCommentPosting(account: any, postUrl: string, comment: string): Promise<boolean> {
  // This is a simulation - replace with actual Puppeteer automation
  console.log(`[SIMULATION] Posting comment for ${account.username} on ${account.platform}`)
  console.log(`[SIMULATION] Comment: "${comment}"`)
  console.log(`[SIMULATION] Post URL: ${postUrl}`)

  // Simulate random success/failure (80% success rate)
  const success = Math.random() > 0.2

  // Simulate processing time
  await new Promise((resolve) => setTimeout(resolve, Math.random() * 3000 + 2000))

  return success
}

// GET endpoint for fetching automation history
export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()

    const automations = await db.collection("automation_logs").find({}).sort({ timestamp: -1 }).limit(20).toArray()

    return NextResponse.json({
      success: true,
      automations: automations.map((automation) => ({
        ...automation,
        _id: automation._id.toString(),
      })),
    })
  } catch (error) {
    console.error("Error fetching automation history:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch automation history",
      },
      { status: 500 },
    )
  }
}
