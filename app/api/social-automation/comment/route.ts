import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { generateComment } from "@/lib/gemini-service"
import puppeteer from "puppeteer"

// User agents for different platforms
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
]

// Random delay function
const randomDelay = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Human-like typing function
const humanType = async (page: any, selector: string, text: string) => {
  await page.click(selector)
  await page.evaluate((sel) => {
    const element = document.querySelector(sel) as HTMLInputElement
    if (element) element.value = ""
  }, selector)

  for (const char of text) {
    await page.type(selector, char, { delay: randomDelay(50, 150) })
  }
}

// Detect platform from URL
const detectPlatform = (url: string): string => {
  if (url.includes("instagram.com")) return "instagram"
  if (url.includes("facebook.com")) return "facebook"
  if (url.includes("twitter.com") || url.includes("x.com")) return "twitter"
  if (url.includes("youtube.com")) return "youtube"
  return "unknown"
}

// Instagram comment automation
const commentOnInstagram = async (page: any, account: any, postUrl: string, comment: string) => {
  try {
    // Navigate to Instagram login
    await page.goto("https://www.instagram.com/accounts/login/", { waitUntil: "networkidle2" })
    await page.waitForTimeout(randomDelay(2000, 4000))

    // Login
    await humanType(page, 'input[name="username"]', account.email)
    await page.waitForTimeout(randomDelay(1000, 2000))
    await humanType(page, 'input[name="password"]', account.password)
    await page.waitForTimeout(randomDelay(1000, 2000))

    await page.click('button[type="submit"]')
    await page.waitForTimeout(randomDelay(3000, 5000))

    // Check for security challenges
    const currentUrl = page.url()
    if (currentUrl.includes("challenge") || currentUrl.includes("checkpoint")) {
      throw new Error("Account requires security verification")
    }

    // Navigate to post
    await page.goto(postUrl, { waitUntil: "networkidle2" })
    await page.waitForTimeout(randomDelay(3000, 5000))

    // Find and click comment box
    const commentSelector = 'textarea[placeholder*="comment" i], textarea[aria-label*="comment" i]'
    await page.waitForSelector(commentSelector, { timeout: 10000 })
    await page.click(commentSelector)
    await page.waitForTimeout(randomDelay(1000, 2000))

    // Type comment
    await humanType(page, commentSelector, comment)
    await page.waitForTimeout(randomDelay(2000, 3000))

    // Submit comment
    const submitSelector = 'button[type="submit"], button:contains("Post")'
    await page.click(submitSelector)
    await page.waitForTimeout(randomDelay(2000, 4000))

    return { success: true, comment }
  } catch (error) {
    console.error("Instagram comment error:", error)
    return { success: false, error: error.message }
  }
}

// Facebook comment automation
const commentOnFacebook = async (page: any, account: any, postUrl: string, comment: string) => {
  try {
    // Navigate to Facebook login
    await page.goto("https://www.facebook.com/login", { waitUntil: "networkidle2" })
    await page.waitForTimeout(randomDelay(2000, 4000))

    // Login
    await humanType(page, 'input[name="email"]', account.email)
    await page.waitForTimeout(randomDelay(1000, 2000))
    await humanType(page, 'input[name="pass"]', account.password)
    await page.waitForTimeout(randomDelay(1000, 2000))

    await page.click('button[name="login"]')
    await page.waitForTimeout(randomDelay(3000, 5000))

    // Check for security challenges
    const currentUrl = page.url()
    if (currentUrl.includes("checkpoint") || currentUrl.includes("confirm")) {
      throw new Error("Account requires security verification")
    }

    // Navigate to post
    await page.goto(postUrl, { waitUntil: "networkidle2" })
    await page.waitForTimeout(randomDelay(3000, 5000))

    // Find and click comment box
    const commentSelector = '[data-testid="fb-composer-text-area"], [contenteditable="true"][data-text*="comment" i]'
    await page.waitForSelector(commentSelector, { timeout: 10000 })
    await page.click(commentSelector)
    await page.waitForTimeout(randomDelay(1000, 2000))

    // Type comment
    await page.type(commentSelector, comment, { delay: randomDelay(50, 150) })
    await page.waitForTimeout(randomDelay(2000, 3000))

    // Submit comment
    await page.keyboard.press("Enter")
    await page.waitForTimeout(randomDelay(2000, 4000))

    return { success: true, comment }
  } catch (error) {
    console.error("Facebook comment error:", error)
    return { success: false, error: error.message }
  }
}

// Twitter reply automation
const replyOnTwitter = async (page: any, account: any, postUrl: string, comment: string) => {
  try {
    // Navigate to Twitter login
    await page.goto("https://twitter.com/i/flow/login", { waitUntil: "networkidle2" })
    await page.waitForTimeout(randomDelay(2000, 4000))

    // Login
    await humanType(page, 'input[name="text"]', account.email)
    await page.waitForTimeout(randomDelay(1000, 2000))
    await page.click('[role="button"]:contains("Next")')
    await page.waitForTimeout(randomDelay(2000, 3000))

    await humanType(page, 'input[name="password"]', account.password)
    await page.waitForTimeout(randomDelay(1000, 2000))
    await page.click('[data-testid="LoginForm_Login_Button"]')
    await page.waitForTimeout(randomDelay(3000, 5000))

    // Navigate to tweet
    await page.goto(postUrl, { waitUntil: "networkidle2" })
    await page.waitForTimeout(randomDelay(3000, 5000))

    // Find and click reply button
    const replySelector = '[data-testid="reply"]'
    await page.waitForSelector(replySelector, { timeout: 10000 })
    await page.click(replySelector)
    await page.waitForTimeout(randomDelay(2000, 3000))

    // Type reply
    const textAreaSelector = '[data-testid="tweetTextarea_0"]'
    await page.waitForSelector(textAreaSelector, { timeout: 10000 })
    await humanType(page, textAreaSelector, comment)
    await page.waitForTimeout(randomDelay(2000, 3000))

    // Submit reply
    const submitSelector = '[data-testid="tweetButtonInline"]'
    await page.click(submitSelector)
    await page.waitForTimeout(randomDelay(2000, 4000))

    return { success: true, comment }
  } catch (error) {
    console.error("Twitter reply error:", error)
    return { success: false, error: error.message }
  }
}

// YouTube comment automation
const commentOnYouTube = async (page: any, account: any, postUrl: string, comment: string) => {
  try {
    // Navigate to YouTube
    await page.goto("https://accounts.google.com/signin", { waitUntil: "networkidle2" })
    await page.waitForTimeout(randomDelay(2000, 4000))

    // Login
    await humanType(page, 'input[type="email"]', account.email)
    await page.waitForTimeout(randomDelay(1000, 2000))
    await page.click("#identifierNext")
    await page.waitForTimeout(randomDelay(2000, 3000))

    await page.waitForSelector('input[type="password"]', { timeout: 10000 })
    await humanType(page, 'input[type="password"]', account.password)
    await page.waitForTimeout(randomDelay(1000, 2000))
    await page.click("#passwordNext")
    await page.waitForTimeout(randomDelay(3000, 5000))

    // Navigate to YouTube video
    await page.goto(postUrl, { waitUntil: "networkidle2" })
    await page.waitForTimeout(randomDelay(5000, 8000))

    // Scroll to comments section
    await page.evaluate(() => {
      window.scrollTo(0, 1000)
    })
    await page.waitForTimeout(randomDelay(3000, 5000))

    // Find and click comment box
    const commentSelector = "#placeholder-area, #contenteditable-root"
    await page.waitForSelector(commentSelector, { timeout: 15000 })
    await page.click(commentSelector)
    await page.waitForTimeout(randomDelay(2000, 3000))

    // Type comment
    await page.type(commentSelector, comment, { delay: randomDelay(50, 150) })
    await page.waitForTimeout(randomDelay(2000, 3000))

    // Submit comment
    const submitSelector = "#submit-button button"
    await page.click(submitSelector)
    await page.waitForTimeout(randomDelay(2000, 4000))

    return { success: true, comment }
  } catch (error) {
    console.error("YouTube comment error:", error)
    return { success: false, error: error.message }
  }
}

// Main comment function
const performComment = async (platform: string, account: any, postUrl: string, comment: string) => {
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

    // Set random user agent
    const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
    await page.setUserAgent(userAgent)

    // Set viewport
    await page.setViewport({
      width: 1366 + Math.floor(Math.random() * 200),
      height: 768 + Math.floor(Math.random() * 200),
    })

    // Remove automation traces
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", {
        get: () => undefined,
      })
    })

    let result
    switch (platform) {
      case "instagram":
        result = await commentOnInstagram(page, account, postUrl, comment)
        break
      case "facebook":
        result = await commentOnFacebook(page, account, postUrl, comment)
        break
      case "twitter":
        result = await replyOnTwitter(page, account, postUrl, comment)
        break
      case "youtube":
        result = await commentOnYouTube(page, account, postUrl, comment)
        break
      default:
        result = { success: false, error: "Unsupported platform" }
    }

    return result
  } catch (error) {
    console.error("Comment automation error:", error)
    return { success: false, error: error.message }
  } finally {
    await browser.close()
  }
}

// POST - Start comment automation
export async function POST(request: NextRequest) {
  try {
    const { userId, postUrl, postContent, commentStyle, accountCount, platforms } = await request.json()

    if (!postUrl || !platforms || platforms.length === 0) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 })
    }

    const platform = detectPlatform(postUrl)
    if (platform === "unknown") {
      return NextResponse.json({ success: false, message: "Unsupported platform URL" }, { status: 400 })
    }

    if (!platforms.includes(platform)) {
      return NextResponse.json(
        { success: false, message: `Platform ${platform} not selected for automation` },
        { status: 400 },
      )
    }

    const { db } = await connectToDatabase()

    // Get available accounts for the platform
    const collectionName = `${platform}_accounts`
    const accounts = await db
      .collection(collectionName)
      .find({ userId, status: "active" })
      .limit(accountCount)
      .toArray()

    if (accounts.length === 0) {
      return NextResponse.json({ success: false, message: `No active ${platform} accounts found` }, { status: 400 })
    }

    // Create notification for start
    await db.collection("notifications").insertOne({
      userId,
      title: "Comment Automation Started",
      message: `Starting automated commenting on ${platform} with ${accounts.length} accounts`,
      type: "info",
      read: false,
      time: new Date().toLocaleTimeString(),
      createdAt: new Date(),
    })

    // Process comments asynchronously
    setImmediate(async () => {
      let successCount = 0
      let failCount = 0

      for (let i = 0; i < accounts.length; i++) {
        const account = accounts[i]

        try {
          // Generate AI comment
          const aiComment = await generateComment(postContent || postUrl, platform, commentStyle)

          // Add delay between accounts (30-90 seconds)
          if (i > 0) {
            const delay = randomDelay(30000, 90000)
            await new Promise((resolve) => setTimeout(resolve, delay))
          }

          // Perform comment
          const result = await performComment(platform, account, postUrl, aiComment)

          // Save activity
          await db.collection("comment_activities").insertOne({
            userId,
            platform,
            email: account.email,
            postUrl,
            comment: result.success ? aiComment : "",
            success: result.success,
            error: result.error || null,
            createdAt: new Date(),
          })

          if (result.success) {
            successCount++
            // Success notification
            await db.collection("notifications").insertOne({
              userId,
              title: "Comment Posted Successfully",
              message: `Comment posted on ${platform} using ${account.email}`,
              type: "success",
              read: false,
              time: new Date().toLocaleTimeString(),
              createdAt: new Date(),
            })
          } else {
            failCount++
            // Error notification
            await db.collection("notifications").insertOne({
              userId,
              title: "Comment Failed",
              message: `Failed to comment on ${platform} using ${account.email}: ${result.error}`,
              type: "error",
              read: false,
              time: new Date().toLocaleTimeString(),
              createdAt: new Date(),
            })
          }
        } catch (error) {
          failCount++
          console.error(`Error with account ${account.email}:`, error)

          // Save failed activity
          await db.collection("comment_activities").insertOne({
            userId,
            platform,
            email: account.email,
            postUrl,
            comment: "",
            success: false,
            error: error.message,
            createdAt: new Date(),
          })

          // Error notification
          await db.collection("notifications").insertOne({
            userId,
            title: "Comment Error",
            message: `Error commenting with ${account.email}: ${error.message}`,
            type: "error",
            read: false,
            time: new Date().toLocaleTimeString(),
            createdAt: new Date(),
          })
        }
      }

      // Final completion notification
      await db.collection("notifications").insertOne({
        userId,
        title: "Comment Automation Completed",
        message: `Completed: ${successCount} successful, ${failCount} failed comments on ${platform}`,
        type: successCount > failCount ? "success" : "warning",
        read: false,
        time: new Date().toLocaleTimeString(),
        createdAt: new Date(),
      })
    })

    return NextResponse.json({
      success: true,
      message: `Comment automation started for ${accounts.length} ${platform} accounts`,
      accountsUsed: accounts.length,
      platform,
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

    // Get comment activities
    const activities = await db
      .collection("comment_activities")
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray()

    // Get summary stats
    const totalActivities = await db.collection("comment_activities").countDocuments({ userId })
    const successfulActivities = await db.collection("comment_activities").countDocuments({ userId, success: true })
    const failedActivities = await db.collection("comment_activities").countDocuments({ userId, success: false })

    // Get platform-specific stats
    const platformStats = await db
      .collection("comment_activities")
      .aggregate([{ $match: { userId, success: true } }, { $group: { _id: "$platform", count: { $sum: 1 } } }])
      .toArray()

    const platforms = {
      instagram: 0,
      facebook: 0,
      twitter: 0,
      youtube: 0,
    }

    platformStats.forEach((stat) => {
      if (platforms.hasOwnProperty(stat._id)) {
        platforms[stat._id] = stat.count
      }
    })

    return NextResponse.json({
      success: true,
      activities,
      summary: {
        total: totalActivities,
        successful: successfulActivities,
        failed: failedActivities,
        platforms,
      },
    })
  } catch (error) {
    console.error("Error fetching comment activities:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
