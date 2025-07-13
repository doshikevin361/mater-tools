import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import puppeteer from "puppeteer"

// Enhanced User Agents for different platforms
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
]

function log(level: string, message: string) {
  const timestamp = new Date().toLocaleTimeString()
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`)
}

const humanWait = (minMs = 2000, maxMs = 5000) => {
  const delay = minMs + Math.random() * (maxMs - minMs)
  return new Promise((resolve) => setTimeout(resolve, delay))
}

// Create stealth browser
async function createStealthBrowser() {
  const browser = await puppeteer.launch({
    headless: false, // Set to true for production
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-blink-features=AutomationControlled",
      "--disable-web-security",
      "--disable-features=VizDisplayCompositor",
      "--disable-extensions",
      "--no-first-run",
      "--disable-default-apps",
    ],
    ignoreDefaultArgs: ["--enable-automation"],
    defaultViewport: { width: 1366, height: 768 },
  })

  const page = await browser.newPage()

  // Set random user agent
  const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
  await page.setUserAgent(userAgent)

  // Remove webdriver traces
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined })
    delete window.navigator.__proto__.webdriver
  })

  return { browser, page }
}

// Human-like typing
async function humanType(page: any, selector: string, text: string) {
  const element = await page.waitForSelector(selector, { timeout: 10000 })
  await element.click()
  await humanWait(500, 1000)

  // Type with human-like delays
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    await element.type(char, { delay: 50 + Math.random() * 100 })

    // Random pauses
    if (Math.random() < 0.1) {
      await humanWait(200, 500)
    }
  }
}

// Platform-specific login functions
async function loginToFacebook(page: any, email: string, password: string) {
  log("info", `Logging into Facebook with ${email}`)

  await page.goto("https://www.facebook.com/", { waitUntil: "networkidle2" })
  await humanWait(2000, 4000)

  // Login
  await humanType(page, 'input[name="email"]', email)
  await humanWait(1000, 2000)
  await humanType(page, 'input[name="pass"]', password)
  await humanWait(1000, 2000)

  await page.click('button[name="login"]')
  await humanWait(5000, 8000)

  // Check if login successful
  const currentUrl = page.url()
  if (currentUrl.includes("facebook.com") && !currentUrl.includes("login")) {
    log("success", "Facebook login successful")
    return true
  }

  throw new Error("Facebook login failed")
}

async function loginToInstagram(page: any, email: string, password: string) {
  log("info", `Logging into Instagram with ${email}`)

  await page.goto("https://www.instagram.com/", { waitUntil: "networkidle2" })
  await humanWait(2000, 4000)

  // Login
  await humanType(page, 'input[name="username"]', email)
  await humanWait(1000, 2000)
  await humanType(page, 'input[name="password"]', password)
  await humanWait(1000, 2000)

  await page.click('button[type="submit"]')
  await humanWait(5000, 8000)

  // Check if login successful
  const currentUrl = page.url()
  if (currentUrl.includes("instagram.com") && !currentUrl.includes("login")) {
    log("success", "Instagram login successful")
    return true
  }

  throw new Error("Instagram login failed")
}

async function loginToTwitter(page: any, email: string, password: string) {
  log("info", `Logging into Twitter with ${email}`)

  await page.goto("https://twitter.com/i/flow/login", { waitUntil: "networkidle2" })
  await humanWait(2000, 4000)

  // Login
  await humanType(page, 'input[autocomplete="username"]', email)
  await humanWait(1000, 2000)
  await page.click('div[role="button"]:has-text("Next")')
  await humanWait(2000, 3000)

  await humanType(page, 'input[name="password"]', password)
  await humanWait(1000, 2000)
  await page.click('div[role="button"]:has-text("Log in")')
  await humanWait(5000, 8000)

  // Check if login successful
  const currentUrl = page.url()
  if ((currentUrl.includes("twitter.com") || currentUrl.includes("x.com")) && !currentUrl.includes("login")) {
    log("success", "Twitter login successful")
    return true
  }

  throw new Error("Twitter login failed")
}

async function loginToYouTube(page: any, email: string, password: string) {
  log("info", `Logging into YouTube with ${email}`)

  await page.goto("https://accounts.google.com/signin", { waitUntil: "networkidle2" })
  await humanWait(2000, 4000)

  // Login to Google account
  await humanType(page, 'input[type="email"]', email)
  await humanWait(1000, 2000)
  await page.click("#identifierNext")
  await humanWait(3000, 5000)

  await humanType(page, 'input[type="password"]', password)
  await humanWait(1000, 2000)
  await page.click("#passwordNext")
  await humanWait(5000, 8000)

  // Navigate to YouTube
  await page.goto("https://www.youtube.com/", { waitUntil: "networkidle2" })
  await humanWait(2000, 4000)

  log("success", "YouTube login successful")
  return true
}

// Platform-specific comment posting functions
async function postFacebookComment(page: any, targetUrl: string, comment: string) {
  await page.goto(targetUrl, { waitUntil: "networkidle2" })
  await humanWait(3000, 5000)

  // Find comment box
  const commentSelectors = [
    'div[contenteditable="true"][data-testid="fb-composer-text-area"]',
    'div[contenteditable="true"]',
    'textarea[placeholder*="comment"]',
  ]

  let commentBox = null
  for (const selector of commentSelectors) {
    try {
      commentBox = await page.$(selector)
      if (commentBox) break
    } catch (e) {
      continue
    }
  }

  if (!commentBox) {
    throw new Error("Could not find Facebook comment box")
  }

  await commentBox.click()
  await humanWait(1000, 2000)
  await commentBox.type(comment, { delay: 100 })
  await humanWait(2000, 3000)

  // Submit comment
  await page.keyboard.press("Enter")
  await humanWait(3000, 5000)

  log("success", "Facebook comment posted")
}

async function postInstagramComment(page: any, targetUrl: string, comment: string) {
  await page.goto(targetUrl, { waitUntil: "networkidle2" })
  await humanWait(3000, 5000)

  // Find comment box
  const commentSelectors = ['textarea[placeholder="Add a comment..."]', 'textarea[aria-label="Add a comment..."]']

  let commentBox = null
  for (const selector of commentSelectors) {
    try {
      commentBox = await page.$(selector)
      if (commentBox) break
    } catch (e) {
      continue
    }
  }

  if (!commentBox) {
    throw new Error("Could not find Instagram comment box")
  }

  await commentBox.click()
  await humanWait(1000, 2000)
  await commentBox.type(comment, { delay: 100 })
  await humanWait(2000, 3000)

  // Submit comment
  await page.click('button[type="submit"]')
  await humanWait(3000, 5000)

  log("success", "Instagram comment posted")
}

async function postTwitterComment(page: any, targetUrl: string, comment: string) {
  await page.goto(targetUrl, { waitUntil: "networkidle2" })
  await humanWait(3000, 5000)

  // Find reply box
  const replySelectors = ['div[data-testid="tweetTextarea_0"]', 'div[contenteditable="true"]']

  let replyBox = null
  for (const selector of replySelectors) {
    try {
      replyBox = await page.$(selector)
      if (replyBox) break
    } catch (e) {
      continue
    }
  }

  if (!replyBox) {
    throw new Error("Could not find Twitter reply box")
  }

  await replyBox.click()
  await humanWait(1000, 2000)
  await replyBox.type(comment, { delay: 100 })
  await humanWait(2000, 3000)

  // Submit reply
  await page.click('div[data-testid="tweetButton"]')
  await humanWait(3000, 5000)

  log("success", "Twitter comment posted")
}

async function postYouTubeComment(page: any, targetUrl: string, comment: string) {
  await page.goto(targetUrl, { waitUntil: "networkidle2" })
  await humanWait(3000, 5000)

  // Scroll down to comments section
  await page.evaluate(() => {
    window.scrollTo(0, 1000)
  })
  await humanWait(2000, 3000)

  // Find comment box
  const commentSelectors = ['div[id="placeholder-area"]', 'div[contenteditable="true"]']

  let commentBox = null
  for (const selector of commentSelectors) {
    try {
      commentBox = await page.$(selector)
      if (commentBox) break
    } catch (e) {
      continue
    }
  }

  if (!commentBox) {
    throw new Error("Could not find YouTube comment box")
  }

  await commentBox.click()
  await humanWait(1000, 2000)
  await commentBox.type(comment, { delay: 100 })
  await humanWait(2000, 3000)

  // Submit comment
  await page.click('button[id="submit-button"]')
  await humanWait(3000, 5000)

  log("success", "YouTube comment posted")
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, platform, targetUrl, comments, campaignName } = body

    if (!userId || !platform || !targetUrl || !comments || !Array.isArray(comments)) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Get available accounts for the platform
    const collectionName = `${platform}_accounts`
    const accounts = await db
      .collection(collectionName)
      .find({ userId, status: "active" })
      .limit(comments.length)
      .toArray()

    if (accounts.length === 0) {
      return NextResponse.json({ success: false, message: `No active ${platform} accounts found` }, { status: 400 })
    }

    // Create comment campaign record
    const campaign = {
      userId,
      platform,
      name: campaignName || `${platform} Comment Campaign`,
      targetUrl,
      sentiment: body.sentiment || "positive",
      totalComments: comments.length,
      completedComments: 0,
      failedComments: 0,
      status: "running",
      comments,
      accountsUsed: [],
      results: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const campaignResult = await db.collection("comment_campaigns").insertOne(campaign)
    const campaignId = campaignResult.insertedId

    // Start comment posting process
    const results = []
    let successCount = 0
    let failCount = 0

    for (let i = 0; i < Math.min(comments.length, accounts.length); i++) {
      const account = accounts[i]
      const comment = comments[i]

      let browser = null
      try {
        log("info", `Starting comment ${i + 1}/${comments.length} with account ${account.email}`)

        const { browser: newBrowser, page } = await createStealthBrowser()
        browser = newBrowser

        // Login based on platform
        switch (platform) {
          case "facebook":
            await loginToFacebook(page, account.email, account.password)
            await postFacebookComment(page, targetUrl, comment)
            break
          case "instagram":
            await loginToInstagram(page, account.email, account.password)
            await postInstagramComment(page, targetUrl, comment)
            break
          case "twitter":
            await loginToTwitter(page, account.email, account.password)
            await postTwitterComment(page, targetUrl, comment)
            break
          case "youtube":
            await loginToYouTube(page, account.email, account.password)
            await postYouTubeComment(page, targetUrl, comment)
            break
          default:
            throw new Error(`Unsupported platform: ${platform}`)
        }

        const result = {
          accountId: account._id.toString(),
          username: account.username || account.email,
          comment,
          status: "success" as const,
          timestamp: new Date(),
        }

        results.push(result)
        successCount++

        // Update campaign progress
        await db.collection("comment_campaigns").updateOne(
          { _id: campaignId },
          {
            $inc: { completedComments: 1 },
            $push: {
              results: result,
              accountsUsed: account._id.toString(),
            },
            $set: { updatedAt: new Date() },
          },
        )

        log("success", `Comment ${i + 1} posted successfully`)
      } catch (error) {
        const errorResult = {
          accountId: account._id.toString(),
          username: account.username || account.email,
          comment,
          status: "failed" as const,
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date(),
        }

        results.push(errorResult)
        failCount++

        // Update campaign progress
        await db.collection("comment_campaigns").updateOne(
          { _id: campaignId },
          {
            $inc: { failedComments: 1 },
            $push: { results: errorResult },
            $set: { updatedAt: new Date() },
          },
        )

        log("error", `Comment ${i + 1} failed: ${error instanceof Error ? error.message : "Unknown error"}`)
      } finally {
        if (browser) {
          await browser.close()
        }
      }

      // Wait between comments to avoid rate limiting
      if (i < comments.length - 1) {
        const delay = 30000 + Math.random() * 60000 // 30-90 seconds
        log("info", `Waiting ${Math.round(delay / 1000)} seconds before next comment...`)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }

    // Update final campaign status
    const finalStatus = failCount === 0 ? "completed" : successCount > 0 ? "completed" : "failed"
    await db.collection("comment_campaigns").updateOne(
      { _id: campaignId },
      {
        $set: {
          status: finalStatus,
          completedAt: new Date(),
          updatedAt: new Date(),
        },
      },
    )

    return NextResponse.json({
      success: true,
      message: `Comment campaign completed. ${successCount} successful, ${failCount} failed.`,
      campaignId: campaignId.toString(),
      results: {
        total: comments.length,
        successful: successCount,
        failed: failCount,
        details: results,
      },
    })
  } catch (error) {
    console.error("Comment posting error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to post comments",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
