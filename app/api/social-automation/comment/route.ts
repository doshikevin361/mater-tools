import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import puppeteer from "puppeteer"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

// Enhanced User Agents for Social Media
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
]

// Logging function
function log(level: string, message: string, data?: any) {
  const timestamp = new Date().toLocaleTimeString()
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`)
  if (data) console.log(`[${timestamp}] [DATA]`, JSON.stringify(data, null, 2))
}

// Human-like wait function
const humanWait = (minMs = 1500, maxMs = 4000) => {
  const delay = minMs + Math.random() * (maxMs - minMs)
  return new Promise((resolve) => setTimeout(resolve, delay))
}

// Generate AI comment using Gemini
async function generateAIComment(postContent: string, commentStyle = "engaging") {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })

    const prompts = {
      engaging: `Create a natural, engaging comment for this social media post. Keep it 1-2 sentences, friendly, and authentic. Post content: "${postContent}"`,
      supportive: `Write a supportive and encouraging comment for this post. Be positive and uplifting. Keep it brief and genuine. Post content: "${postContent}"`,
      question: `Create a thoughtful question or comment that encourages discussion about this post. Keep it conversational. Post content: "${postContent}"`,
      compliment: `Write a genuine compliment or positive feedback about this post. Be specific and authentic. Post content: "${postContent}"`,
      casual: `Write a casual, friendly comment like a real person would. Use natural language, maybe an emoji. Keep it short. Post content: "${postContent}"`,
    }

    const prompt = prompts[commentStyle as keyof typeof prompts] || prompts.engaging

    const result = await model.generateContent(prompt)
    const response = await result.response
    let comment = response.text().trim()

    // Clean up the comment
    comment = comment.replace(/^["']|["']$/g, "") // Remove quotes
    comment = comment.replace(/\n/g, " ").trim() // Remove line breaks

    // Ensure it's not too long
    if (comment.length > 150) {
      comment = comment.substring(0, 147) + "..."
    }

    log("success", `Generated AI comment: ${comment}`)
    return comment
  } catch (error) {
    log("error", `AI comment generation failed: ${error.message}`)

    // Fallback comments
    const fallbackComments = [
      "Great post! 👍",
      "Love this! ❤️",
      "Thanks for sharing!",
      "Awesome content! 🔥",
      "This is amazing!",
      "So inspiring! ✨",
      "Well said! 💯",
      "Couldn't agree more!",
      "This made my day! 😊",
      "Fantastic! 🙌",
    ]

    return fallbackComments[Math.floor(Math.random() * fallbackComments.length)]
  }
}

// Create stealth browser
async function createStealthBrowser() {
  const browser = await puppeteer.launch({
    headless: true,
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
      "--disable-sync",
      "--disable-translate",
      "--disable-background-timer-throttling",
      "--disable-backgrounding-occluded-windows",
      "--disable-renderer-backgrounding",
      "--disable-ipc-flooding-protection",
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

    // Remove automation indicators
    const automationProps = [
      "__webdriver_script_fn",
      "__driver_evaluate",
      "__webdriver_evaluate",
      "__selenium_evaluate",
      "__fxdriver_evaluate",
      "__driver_unwrapped",
      "__webdriver_unwrapped",
      "__selenium_unwrapped",
      "__fxdriver_unwrapped",
      "_phantom",
      "__nightmare",
      "_selenium",
      "callPhantom",
      "callSelenium",
      "domAutomation",
      "domAutomationController",
      "webdriver",
    ]

    automationProps.forEach((prop) => {
      try {
        delete window[prop]
        delete document[prop]
      } catch (e) {}
    })

    // Enhanced Chrome object
    window.chrome = {
      runtime: {
        onConnect: null,
        onMessage: null,
      },
    }
  })

  return { browser, page }
}

// Instagram login and comment
async function instagramLoginAndComment(page: any, account: any, postUrl: string, comment: string) {
  try {
    log("info", `Logging into Instagram with account: ${account.email}`)

    // Navigate to Instagram login
    await page.goto("https://www.instagram.com/accounts/login/", {
      waitUntil: "networkidle2",
      timeout: 30000,
    })

    await humanWait(3000, 5000)

    // Fill login form
    await page.waitForSelector('input[name="username"]', { timeout: 20000 })
    await page.type('input[name="username"]', account.email, { delay: 120 })
    await humanWait(1000, 2000)

    await page.type('input[name="password"]', account.password, { delay: 120 })
    await humanWait(1000, 2000)

    // Click login button
    await page.click('button[type="submit"]')
    await humanWait(5000, 8000)

    // Handle potential security checks
    try {
      const currentUrl = page.url()
      if (currentUrl.includes("challenge") || currentUrl.includes("checkpoint")) {
        log("warning", "Instagram security challenge detected, skipping...")
        return { success: false, error: "Security challenge required" }
      }
    } catch (e) {}

    // Navigate to post
    log("info", `Navigating to Instagram post: ${postUrl}`)
    await page.goto(postUrl, { waitUntil: "networkidle2", timeout: 30000 })
    await humanWait(3000, 5000)

    // Find and click comment button/area
    const commentSelectors = [
      'textarea[placeholder*="comment"]',
      'textarea[aria-label*="comment"]',
      "form textarea",
      'div[contenteditable="true"]',
    ]

    let commentSuccess = false
    for (const selector of commentSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 })
        await page.click(selector)
        await humanWait(1000, 2000)

        // Type comment
        await page.type(selector, comment, { delay: 100 })
        await humanWait(2000, 3000)

        // Submit comment
        const submitSelectors = ['button[type="submit"]', 'button:contains("Post")', "form button"]

        for (const submitSelector of submitSelectors) {
          try {
            await page.click(submitSelector)
            commentSuccess = true
            break
          } catch (e) {
            continue
          }
        }

        if (!commentSuccess) {
          await page.keyboard.press("Enter")
          commentSuccess = true
        }

        break
      } catch (e) {
        continue
      }
    }

    if (commentSuccess) {
      await humanWait(3000, 5000)
      log("success", `Instagram comment posted successfully: ${comment}`)
      return { success: true, comment, platform: "instagram" }
    } else {
      throw new Error("Could not find comment input or submit button")
    }
  } catch (error) {
    log("error", `Instagram commenting failed: ${error.message}`)
    return { success: false, error: error.message, platform: "instagram" }
  }
}

// Facebook login and comment
async function facebookLoginAndComment(page: any, account: any, postUrl: string, comment: string) {
  try {
    log("info", `Logging into Facebook with account: ${account.email}`)

    // Navigate to Facebook login
    await page.goto("https://www.facebook.com/login", {
      waitUntil: "networkidle2",
      timeout: 30000,
    })

    await humanWait(3000, 5000)

    // Fill login form
    await page.waitForSelector("#email", { timeout: 20000 })
    await page.type("#email", account.email, { delay: 120 })
    await humanWait(1000, 2000)

    await page.type("#pass", account.password, { delay: 120 })
    await humanWait(1000, 2000)

    // Click login button
    await page.click('button[name="login"]')
    await humanWait(5000, 8000)

    // Handle potential security checks
    try {
      const currentUrl = page.url()
      if (currentUrl.includes("checkpoint") || currentUrl.includes("confirmemail")) {
        log("warning", "Facebook security challenge detected, skipping...")
        return { success: false, error: "Security challenge required" }
      }
    } catch (e) {}

    // Navigate to post
    log("info", `Navigating to Facebook post: ${postUrl}`)
    await page.goto(postUrl, { waitUntil: "networkidle2", timeout: 30000 })
    await humanWait(3000, 5000)

    // Find and click comment area
    const commentSelectors = [
      'div[contenteditable="true"][data-testid*="comment"]',
      'div[contenteditable="true"][aria-label*="comment"]',
      'div[contenteditable="true"]',
      'textarea[placeholder*="comment"]',
    ]

    let commentSuccess = false
    for (const selector of commentSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 })
        await page.click(selector)
        await humanWait(1000, 2000)

        // Type comment
        await page.type(selector, comment, { delay: 100 })
        await humanWait(2000, 3000)

        // Submit comment (Enter key or button)
        await page.keyboard.press("Enter")
        commentSuccess = true
        break
      } catch (e) {
        continue
      }
    }

    if (commentSuccess) {
      await humanWait(3000, 5000)
      log("success", `Facebook comment posted successfully: ${comment}`)
      return { success: true, comment, platform: "facebook" }
    } else {
      throw new Error("Could not find comment input")
    }
  } catch (error) {
    log("error", `Facebook commenting failed: ${error.message}`)
    return { success: false, error: error.message, platform: "facebook" }
  }
}

// Twitter login and comment (reply)
async function twitterLoginAndComment(page: any, account: any, postUrl: string, comment: string) {
  try {
    log("info", `Logging into Twitter with account: ${account.email}`)

    // Navigate to Twitter login
    const twitterUrls = ["https://twitter.com/i/flow/login", "https://x.com/i/flow/login"]
    const loginUrl = twitterUrls[Math.floor(Math.random() * twitterUrls.length)]

    await page.goto(loginUrl, {
      waitUntil: "networkidle2",
      timeout: 30000,
    })

    await humanWait(3000, 5000)

    // Fill username/email
    const usernameSelectors = [
      'input[name="text"]',
      'input[autocomplete="username"]',
      'input[data-testid="ocfEnterTextTextInput"]',
    ]

    let loginSuccess = false
    for (const selector of usernameSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 10000 })
        await page.type(selector, account.email, { delay: 120 })
        await humanWait(1000, 2000)

        // Click Next
        await page.click('button:contains("Next")')
        await humanWait(3000, 5000)
        loginSuccess = true
        break
      } catch (e) {
        continue
      }
    }

    if (!loginSuccess) {
      throw new Error("Could not find username input")
    }

    // Fill password
    const passwordSelectors = [
      'input[name="password"]',
      'input[type="password"]',
      'input[data-testid="ocfPasswordField"]',
    ]

    for (const selector of passwordSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 10000 })
        await page.type(selector, account.password, { delay: 120 })
        await humanWait(1000, 2000)

        // Click Login
        await page.click('button[data-testid="LoginForm_Login_Button"]')
        await humanWait(5000, 8000)
        break
      } catch (e) {
        continue
      }
    }

    // Navigate to tweet
    log("info", `Navigating to Twitter post: ${postUrl}`)
    await page.goto(postUrl, { waitUntil: "networkidle2", timeout: 30000 })
    await humanWait(3000, 5000)

    // Find and click reply button
    const replySelectors = ['button[data-testid="reply"]', 'div[data-testid="reply"]', 'button[aria-label*="Reply"]']

    let replySuccess = false
    for (const selector of replySelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 })
        await page.click(selector)
        await humanWait(2000, 3000)
        replySuccess = true
        break
      } catch (e) {
        continue
      }
    }

    if (!replySuccess) {
      throw new Error("Could not find reply button")
    }

    // Type reply
    const tweetBoxSelectors = [
      'div[data-testid="tweetTextarea_0"]',
      'div[contenteditable="true"][data-testid*="tweet"]',
      'div[contenteditable="true"]',
    ]

    let commentSuccess = false
    for (const selector of tweetBoxSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 })
        await page.click(selector)
        await humanWait(1000, 2000)

        await page.type(selector, comment, { delay: 100 })
        await humanWait(2000, 3000)

        // Click Reply button
        const replyButtonSelectors = [
          'button[data-testid="tweetButtonInline"]',
          'button:contains("Reply")',
          'button[data-testid="tweetButton"]',
        ]

        for (const replyBtnSelector of replyButtonSelectors) {
          try {
            await page.click(replyBtnSelector)
            commentSuccess = true
            break
          } catch (e) {
            continue
          }
        }

        break
      } catch (e) {
        continue
      }
    }

    if (commentSuccess) {
      await humanWait(3000, 5000)
      log("success", `Twitter reply posted successfully: ${comment}`)
      return { success: true, comment, platform: "twitter" }
    } else {
      throw new Error("Could not post reply")
    }
  } catch (error) {
    log("error", `Twitter commenting failed: ${error.message}`)
    return { success: false, error: error.message, platform: "twitter" }
  }
}

// Main commenting function
async function performSocialMediaComment(account: any, postUrl: string, postContent: string, commentStyle: string) {
  let browser, page

  try {
    // Create stealth browser
    const browserSetup = await createStealthBrowser()
    browser = browserSetup.browser
    page = browserSetup.page

    // Generate AI comment
    const aiComment = await generateAIComment(postContent, commentStyle)

    // Determine platform from URL
    let platform = "unknown"
    if (postUrl.includes("instagram.com")) {
      platform = "instagram"
    } else if (postUrl.includes("facebook.com") || postUrl.includes("fb.com")) {
      platform = "facebook"
    } else if (postUrl.includes("twitter.com") || postUrl.includes("x.com")) {
      platform = "twitter"
    }

    log("info", `Detected platform: ${platform}`)

    // Perform platform-specific commenting
    let result
    switch (platform) {
      case "instagram":
        result = await instagramLoginAndComment(page, account, postUrl, aiComment)
        break
      case "facebook":
        result = await facebookLoginAndComment(page, account, postUrl, aiComment)
        break
      case "twitter":
        result = await twitterLoginAndComment(page, account, postUrl, aiComment)
        break
      default:
        throw new Error(`Unsupported platform: ${platform}`)
    }

    return result
  } catch (error) {
    log("error", `Social media commenting failed: ${error.message}`)
    return { success: false, error: error.message }
  } finally {
    if (browser) {
      setTimeout(async () => {
        try {
          await browser.close()
        } catch (e) {}
      }, 5000)
    }
  }
}

// Send notification
async function sendNotification(userId: string, title: string, message: string, type = "info") {
  try {
    const { db } = await connectToDatabase()
    await db.collection("notifications").insertOne({
      userId,
      title,
      message,
      type,
      read: false,
      createdAt: new Date(),
    })
  } catch (error) {
    console.error("Failed to send notification:", error)
  }
}

// API POST Handler
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      userId,
      postUrl,
      postContent,
      commentStyle = "engaging",
      accountCount = 1,
      platforms = ["instagram", "facebook", "twitter"],
    } = body

    log("info", `Starting social media commenting automation`)
    log("info", `Post URL: ${postUrl}`)
    log("info", `Comment Style: ${commentStyle}`)
    log("info", `Account Count: ${accountCount}`)
    log("info", `Platforms: ${platforms.join(", ")}`)

    if (!userId || !postUrl) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID and Post URL are required",
        },
        { status: 400 },
      )
    }

    const { db } = await connectToDatabase()

    // Get available accounts from database
    const accountCollections = []
    if (platforms.includes("instagram")) {
      accountCollections.push({ collection: "social_accounts", platform: "instagram" })
    }
    if (platforms.includes("facebook")) {
      accountCollections.push({ collection: "facebook_accounts", platform: "facebook" })
    }
    if (platforms.includes("twitter")) {
      accountCollections.push({ collection: "twitter_accounts", platform: "twitter" })
    }

    let allAccounts = []

    // Fetch accounts from all collections
    for (const { collection, platform } of accountCollections) {
      try {
        const accounts = await db
          .collection(collection)
          .find({
            userId,
            status: "active",
            ...(platform && { platform }),
          })
          .limit(accountCount)
          .toArray()

        allAccounts.push(...accounts.map((acc) => ({ ...acc, platform })))
      } catch (error) {
        log("error", `Failed to fetch ${platform} accounts: ${error.message}`)
      }
    }

    if (allAccounts.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No active social media accounts found",
        },
        { status: 404 },
      )
    }

    // Shuffle accounts for randomness
    allAccounts = allAccounts.sort(() => Math.random() - 0.5)

    // Limit to requested count
    const selectedAccounts = allAccounts.slice(0, accountCount)

    log("info", `Found ${selectedAccounts.length} accounts to use for commenting`)

    // Send initial notification
    await sendNotification(
      userId,
      "Social Media Commenting Started",
      `Starting automated commenting on ${selectedAccounts.length} accounts across ${platforms.join(", ")}`,
      "info",
    )

    const results = []
    let successCount = 0

    // Process each account
    for (let i = 0; i < selectedAccounts.length; i++) {
      const account = selectedAccounts[i]

      log("info", `\n=== COMMENTING WITH ACCOUNT ${i + 1}/${selectedAccounts.length} ===`)
      log("info", `Platform: ${account.platform}`)
      log("info", `Email: ${account.email}`)

      try {
        const result = await performSocialMediaComment(account, postUrl, postContent, commentStyle)

        // Save comment activity to database
        await db.collection("comment_activities").insertOne({
          userId,
          accountId: account._id,
          platform: account.platform,
          email: account.email,
          postUrl,
          postContent,
          comment: result.comment || null,
          success: result.success,
          error: result.error || null,
          commentStyle,
          createdAt: new Date(),
        })

        results.push({
          accountNumber: i + 1,
          platform: account.platform,
          email: account.email,
          success: result.success,
          comment: result.comment,
          error: result.error,
        })

        if (result.success) {
          successCount++
          log("success", `✅ Comment posted successfully on ${account.platform}`)

          await sendNotification(
            userId,
            "Comment Posted Successfully",
            `Comment posted on ${account.platform} using ${account.email}: "${result.comment}"`,
            "success",
          )
        } else {
          log("error", `❌ Comment failed on ${account.platform}: ${result.error}`)

          await sendNotification(
            userId,
            "Comment Failed",
            `Failed to comment on ${account.platform} using ${account.email}: ${result.error}`,
            "error",
          )
        }

        // Wait between accounts to avoid rate limiting
        if (i < selectedAccounts.length - 1) {
          const delay = 30000 + Math.random() * 60000 // 30-90 seconds
          log("info", `⏳ Waiting ${Math.round(delay / 1000)} seconds before next account...`)
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      } catch (error) {
        log("error", `Account ${i + 1} failed: ${error.message}`)

        results.push({
          accountNumber: i + 1,
          platform: account.platform,
          email: account.email,
          success: false,
          error: error.message,
        })

        await sendNotification(
          userId,
          "Comment Error",
          `Error with ${account.platform} account ${account.email}: ${error.message}`,
          "error",
        )
      }
    }

    // Send completion notification
    await sendNotification(
      userId,
      "Social Media Commenting Completed",
      `Commenting completed! ${successCount}/${selectedAccounts.length} comments posted successfully.`,
      successCount === selectedAccounts.length ? "success" : successCount > 0 ? "warning" : "error",
    )

    log("success", `🎉 Commenting completed: ${successCount}/${selectedAccounts.length} successful`)

    return NextResponse.json({
      success: true,
      message: `Social media commenting completed! ${successCount}/${selectedAccounts.length} comments posted successfully.`,
      totalAccounts: selectedAccounts.length,
      successfulComments: successCount,
      failedComments: selectedAccounts.length - successCount,
      results,
      postUrl,
      commentStyle,
      platforms: platforms,
    })
  } catch (error) {
    log("error", `API Error: ${error.message}`)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to perform social media commenting",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// API GET Handler - Get comment history
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const platform = searchParams.get("platform")
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID is required",
        },
        { status: 400 },
      )
    }

    const { db } = await connectToDatabase()

    const query: any = { userId }
    if (platform && platform !== "all") {
      query.platform = platform
    }

    const activities = await db
      .collection("comment_activities")
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray()

    const summary = {
      total: activities.length,
      successful: activities.filter((a) => a.success).length,
      failed: activities.filter((a) => !a.success).length,
      platforms: {
        instagram: activities.filter((a) => a.platform === "instagram").length,
        facebook: activities.filter((a) => a.platform === "facebook").length,
        twitter: activities.filter((a) => a.platform === "twitter").length,
      },
      recentActivity: activities.slice(0, 10),
    }

    return NextResponse.json({
      success: true,
      activities,
      summary,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch comment activities",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
