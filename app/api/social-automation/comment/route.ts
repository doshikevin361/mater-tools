import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { generateComment } from "@/lib/gemini-service"
import puppeteer from "puppeteer"

// Platform URL patterns
const PLATFORM_PATTERNS = {
  instagram: /(?:instagram\.com\/p\/|instagram\.com\/reel\/)/,
  facebook: /(?:facebook\.com\/.*\/posts\/|facebook\.com\/.*\/videos\/|fb\.watch\/)/,
  twitter: /(?:twitter\.com\/.*\/status\/|x\.com\/.*\/status\/)/,
  youtube: /(?:youtube\.com\/watch\?v=|youtu\.be\/)/,
}

// Detect platform from URL
function detectPlatform(url: string): string | null {
  for (const [platform, pattern] of Object.entries(PLATFORM_PATTERNS)) {
    if (pattern.test(url)) {
      return platform
    }
  }
  return null
}

// Generate random delay between min and max seconds
function randomDelay(min: number, max: number): Promise<void> {
  const delay = Math.floor(Math.random() * (max - min + 1) + min) * 1000
  return new Promise((resolve) => setTimeout(resolve, delay))
}

// Create notification
async function createNotification(db: any, userId: string, title: string, message: string, type: string) {
  try {
    await db.collection("notifications").insertOne({
      userId,
      title,
      message,
      type,
      read: false,
      time: new Date().toLocaleTimeString(),
      createdAt: new Date(),
    })
  } catch (error) {
    console.error("Failed to create notification:", error)
  }
}

// Get random accounts from platform collection
async function getRandomAccounts(db: any, platform: string, count: number) {
  const collectionName = `${platform}_accounts`
  try {
    const accounts = await db
      .collection(collectionName)
      .aggregate([{ $sample: { size: count } }])
      .toArray()
    return accounts
  } catch (error) {
    console.error(`Failed to get ${platform} accounts:`, error)
    return []
  }
}

// Instagram comment automation
async function commentOnInstagram(account: any, postUrl: string, comment: string) {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--disable-gpu",
      "--disable-web-security",
      "--disable-features=VizDisplayCompositor",
    ],
  })

  try {
    const page = await browser.newPage()

    // Set user agent and viewport
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    )
    await page.setViewport({ width: 1366, height: 768 })

    // Navigate to Instagram login
    await page.goto("https://www.instagram.com/accounts/login/", { waitUntil: "networkidle2" })
    await randomDelay(2, 4)

    // Login
    await page.type('input[name="username"]', account.email, { delay: 100 })
    await randomDelay(1, 2)
    await page.type('input[name="password"]', account.password, { delay: 100 })
    await randomDelay(1, 2)

    await page.click('button[type="submit"]')
    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 })

    // Check for login success
    const currentUrl = page.url()
    if (currentUrl.includes("login") || currentUrl.includes("challenge")) {
      throw new Error("Login failed or requires verification")
    }

    // Navigate to post
    await page.goto(postUrl, { waitUntil: "networkidle2" })
    await randomDelay(2, 4)

    // Find and click comment button
    const commentButton = await page.$('svg[aria-label="Comment"]')
    if (commentButton) {
      await commentButton.click()
      await randomDelay(1, 2)
    }

    // Type comment
    const commentBox = await page.$('textarea[placeholder*="comment" i]')
    if (!commentBox) {
      throw new Error("Comment box not found")
    }

    await commentBox.click()
    await randomDelay(1, 2)
    await commentBox.type(comment, { delay: 150 })
    await randomDelay(2, 3)

    // Submit comment
    const postButton = await page.$('button:has-text("Post")')
    if (postButton) {
      await postButton.click()
      await randomDelay(2, 3)
    }

    return true
  } catch (error) {
    console.error("Instagram comment error:", error)
    throw error
  } finally {
    await browser.close()
  }
}

// Facebook comment automation
async function commentOnFacebook(account: any, postUrl: string, comment: string) {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--disable-gpu",
    ],
  })

  try {
    const page = await browser.newPage()
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    )

    // Navigate to Facebook login
    await page.goto("https://www.facebook.com/login", { waitUntil: "networkidle2" })
    await randomDelay(2, 4)

    // Login
    await page.type("#email", account.email, { delay: 100 })
    await randomDelay(1, 2)
    await page.type("#pass", account.password, { delay: 100 })
    await randomDelay(1, 2)

    await page.click('button[name="login"]')
    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 })

    // Navigate to post
    await page.goto(postUrl, { waitUntil: "networkidle2" })
    await randomDelay(3, 5)

    // Find comment box
    const commentBox = await page.$('div[contenteditable="true"][data-testid*="comment"]')
    if (!commentBox) {
      throw new Error("Comment box not found")
    }

    await commentBox.click()
    await randomDelay(1, 2)
    await commentBox.type(comment, { delay: 120 })
    await randomDelay(2, 3)

    // Submit comment
    await page.keyboard.press("Enter")
    await randomDelay(2, 3)

    return true
  } catch (error) {
    console.error("Facebook comment error:", error)
    throw error
  } finally {
    await browser.close()
  }
}

// Twitter reply automation
async function replyOnTwitter(account: any, postUrl: string, comment: string) {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--disable-gpu",
    ],
  })

  try {
    const page = await browser.newPage()
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    )

    // Navigate to Twitter login
    await page.goto("https://twitter.com/i/flow/login", { waitUntil: "networkidle2" })
    await randomDelay(2, 4)

    // Login process
    await page.type('input[name="text"]', account.email, { delay: 100 })
    await randomDelay(1, 2)
    await page.click('div[role="button"]:has-text("Next")')
    await randomDelay(2, 3)

    await page.type('input[name="password"]', account.password, { delay: 100 })
    await randomDelay(1, 2)
    await page.click('div[role="button"]:has-text("Log in")')
    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 })

    // Navigate to tweet
    await page.goto(postUrl, { waitUntil: "networkidle2" })
    await randomDelay(3, 5)

    // Click reply button
    const replyButton = await page.$('div[data-testid="reply"]')
    if (replyButton) {
      await replyButton.click()
      await randomDelay(2, 3)
    }

    // Type reply
    const tweetBox = await page.$('div[data-testid="tweetTextarea_0"]')
    if (!tweetBox) {
      throw new Error("Reply box not found")
    }

    await tweetBox.click()
    await randomDelay(1, 2)
    await tweetBox.type(comment, { delay: 120 })
    await randomDelay(2, 3)

    // Submit reply
    const replySubmitButton = await page.$('div[data-testid="tweetButton"]')
    if (replySubmitButton) {
      await replySubmitButton.click()
      await randomDelay(2, 3)
    }

    return true
  } catch (error) {
    console.error("Twitter reply error:", error)
    throw error
  } finally {
    await browser.close()
  }
}

// YouTube comment automation
async function commentOnYouTube(account: any, postUrl: string, comment: string) {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--disable-gpu",
    ],
  })

  try {
    const page = await browser.newPage()
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    )

    // Navigate to Google login
    await page.goto("https://accounts.google.com/signin", { waitUntil: "networkidle2" })
    await randomDelay(2, 4)

    // Login
    await page.type('input[type="email"]', account.email, { delay: 100 })
    await randomDelay(1, 2)
    await page.click("#identifierNext")
    await randomDelay(3, 5)

    await page.type('input[type="password"]', account.password, { delay: 100 })
    await randomDelay(1, 2)
    await page.click("#passwordNext")
    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 })

    // Navigate to YouTube video
    await page.goto(postUrl, { waitUntil: "networkidle2" })
    await randomDelay(5, 8)

    // Scroll to comments section
    await page.evaluate(() => {
      window.scrollTo(0, 1000)
    })
    await randomDelay(3, 5)

    // Find comment box
    const commentBox = await page.$("#placeholder-area")
    if (commentBox) {
      await commentBox.click()
      await randomDelay(2, 3)
    }

    const textArea = await page.$("#contenteditable-root")
    if (!textArea) {
      throw new Error("Comment box not found")
    }

    await textArea.click()
    await randomDelay(1, 2)
    await textArea.type(comment, { delay: 150 })
    await randomDelay(2, 3)

    // Submit comment
    const submitButton = await page.$("#submit-button")
    if (submitButton) {
      await submitButton.click()
      await randomDelay(2, 3)
    }

    return true
  } catch (error) {
    console.error("YouTube comment error:", error)
    throw error
  } finally {
    await browser.close()
  }
}

// Main comment automation function
async function automateComment(account: any, platform: string, postUrl: string, comment: string) {
  switch (platform) {
    case "instagram":
      return await commentOnInstagram(account, postUrl, comment)
    case "facebook":
      return await commentOnFacebook(account, postUrl, comment)
    case "twitter":
      return await replyOnTwitter(account, postUrl, comment)
    case "youtube":
      return await commentOnYouTube(account, postUrl, comment)
    default:
      throw new Error(`Unsupported platform: ${platform}`)
  }
}

// POST - Start comment automation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, postUrl, postContent, commentStyle, sentiment, accountCount, platforms } = body

    // Validate input
    if (!postUrl || !platforms || platforms.length === 0) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 })
    }

    // Detect platform from URL
    const detectedPlatform = detectPlatform(postUrl)
    if (!detectedPlatform) {
      return NextResponse.json({ success: false, message: "Unsupported post URL format" }, { status: 400 })
    }

    // Check if detected platform is in selected platforms
    if (!platforms.includes(detectedPlatform)) {
      return NextResponse.json(
        { success: false, message: `Post is from ${detectedPlatform} but it's not selected in platforms` },
        { status: 400 },
      )
    }

    const { db } = await connectToDatabase()

    // Create initial notification
    await createNotification(
      db,
      userId,
      "Comment Automation Started",
      `Starting AI comment automation for ${detectedPlatform} post with ${accountCount} accounts`,
      "info",
    )

    // Process each selected platform (but focus on detected platform)
    const results = []
    const platformsToProcess = platforms.includes(detectedPlatform) ? [detectedPlatform] : platforms

    for (const platform of platformsToProcess) {
      try {
        // Get random accounts for this platform
        const accounts = await getRandomAccounts(db, platform, accountCount)

        if (accounts.length === 0) {
          await createNotification(
            db,
            userId,
            "No Accounts Available",
            `No ${platform} accounts found in database`,
            "warning",
          )
          continue
        }

        // Process each account
        for (let i = 0; i < Math.min(accounts.length, accountCount); i++) {
          const account = accounts[i]

          try {
            // Generate AI comment with sentiment
            const comment = await generateComment(postContent || "Social media post", platform, commentStyle, sentiment)

            // Add random delay between accounts (30-90 seconds)
            if (i > 0) {
              await randomDelay(30, 90)
            }

            // Attempt to post comment
            const success = await automateComment(account, platform, postUrl, comment)

            // Store activity in database
            const activity = {
              userId,
              platform,
              email: account.email,
              postUrl,
              comment,
              success,
              sentiment,
              commentStyle,
              createdAt: new Date(),
            }

            await db.collection("comment_activities").insertOne(activity)
            results.push(activity)

            // Create success notification
            if (success) {
              await createNotification(
                db,
                userId,
                "Comment Posted Successfully",
                `${sentiment} comment posted on ${platform} using ${account.email}`,
                "success",
              )
            }
          } catch (error) {
            console.error(`Comment failed for ${account.email}:`, error)

            // Store failed activity
            const activity = {
              userId,
              platform,
              email: account.email,
              postUrl,
              comment: "",
              success: false,
              error: error.message,
              sentiment,
              commentStyle,
              createdAt: new Date(),
            }

            await db.collection("comment_activities").insertOne(activity)
            results.push(activity)

            // Create error notification
            await createNotification(
              db,
              userId,
              "Comment Failed",
              `Failed to post comment using ${account.email}: ${error.message}`,
              "error",
            )
          }
        }
      } catch (error) {
        console.error(`Platform ${platform} processing failed:`, error)
        await createNotification(
          db,
          userId,
          "Platform Error",
          `Failed to process ${platform}: ${error.message}`,
          "error",
        )
      }
    }

    // Final summary notification
    const successful = results.filter((r) => r.success).length
    const failed = results.filter((r) => !r.success).length

    await createNotification(
      db,
      userId,
      "Comment Automation Completed",
      `Completed: ${successful} successful, ${failed} failed comments`,
      successful > failed ? "success" : "warning",
    )

    return NextResponse.json({
      success: true,
      message: `Comment automation completed: ${successful} successful, ${failed} failed`,
      results,
      summary: { successful, failed, total: results.length },
    })
  } catch (error) {
    console.error("Comment automation error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

// GET - Fetch comment activities and stats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    if (!userId) {
      return NextResponse.json({ success: false, message: "User ID required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Fetch recent activities
    const activities = await db
      .collection("comment_activities")
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray()

    // Calculate summary stats
    const total = activities.length
    const successful = activities.filter((a) => a.success).length
    const failed = total - successful

    // Platform breakdown
    const platforms = {
      instagram: activities.filter((a) => a.platform === "instagram").length,
      facebook: activities.filter((a) => a.platform === "facebook").length,
      twitter: activities.filter((a) => a.platform === "twitter").length,
      youtube: activities.filter((a) => a.platform === "youtube").length,
    }

    return NextResponse.json({
      success: true,
      activities,
      summary: {
        total,
        successful,
        failed,
        platforms,
      },
    })
  } catch (error) {
    console.error("Fetch activities error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
