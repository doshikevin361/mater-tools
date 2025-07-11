import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import axios from "axios"
import puppeteer from "puppeteer"

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
]

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const humanWait = (minMs = 1500, maxMs = 4000) => {
  const delay = minMs + Math.random() * (maxMs - minMs)
  return new Promise((resolve) => setTimeout(resolve, delay))
}

async function sendNotification(userId: string, message: string, type = "info") {
  try {
    const { db } = await connectToDatabase()
    await db.collection("notifications").insertOne({
      userId,
      title: "Twitter Account Creation",
      message,
      type,
      read: false,
      createdAt: new Date(),
    })
  } catch (error) {
    console.error("Failed to send notification:", error)
  }
}

async function createStealthBrowser() {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-blink-features=AutomationControlled",
    ],
    ignoreDefaultArgs: ["--enable-automation"],
  })

  const page = await browser.newPage()
  await page.setUserAgent(USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)])

  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined })
  })

  return { browser, page }
}

async function createTempEmail() {
  try {
    const sessionResponse = await axios.get("https://www.guerrillamail.com/ajax.php?f=get_email_address", {
      timeout: 15000,
    })

    if (sessionResponse.data && sessionResponse.data.email_addr) {
      return {
        success: true,
        email: sessionResponse.data.email_addr,
      }
    } else {
      throw new Error("Failed to get email")
    }
  } catch (error) {
    throw new Error("Email creation failed")
  }
}

function generateProfile() {
  const firstNames = [
    "Alex",
    "Jordan",
    "Taylor",
    "Morgan",
    "Casey",
    "Riley",
    "Avery",
    "Quinn",
    "Sage",
    "River",
    "Phoenix",
    "Rowan",
    "Skylar",
    "Cameron",
    "Drew",
    "Emery",
  ]

  const lastNames = [
    "Smith",
    "Johnson",
    "Williams",
    "Brown",
    "Jones",
    "Garcia",
    "Miller",
    "Davis",
    "Rodriguez",
    "Martinez",
    "Hernandez",
    "Lopez",
    "Gonzalez",
    "Wilson",
    "Anderson",
    "Thomas",
  ]

  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
  const birthYear = Math.floor(Math.random() * 22) + 1985
  const birthMonth = Math.floor(Math.random() * 12) + 1
  const birthDay = Math.floor(Math.random() * 28) + 1

  const timestamp = Date.now().toString().slice(-4)
  const randomSuffix = Math.floor(Math.random() * 9999)

  const usernames = [
    `${firstName.toLowerCase()}_${lastName.toLowerCase()}${timestamp}`,
    `${firstName.toLowerCase()}${lastName.toLowerCase()}${randomSuffix}`,
    `${firstName.toLowerCase()}_${randomSuffix}`,
  ]

  const password = `${firstName}${Math.floor(Math.random() * 9999)}!`

  return {
    firstName,
    lastName,
    birthYear,
    birthMonth,
    birthDay,
    usernames,
    password,
    fullName: `${firstName} ${lastName}`,
  }
}

async function createTwitterAccount(accountData, userId) {
  let browser, page

  try {
    await sendNotification(userId, `Starting Twitter account creation for ${accountData.profile.fullName}...`, "info")

    const browserSetup = await createStealthBrowser()
    browser = browserSetup.browser
    page = browserSetup.page

    await page.goto("https://twitter.com/i/flow/signup", {
      waitUntil: "networkidle2",
      timeout: 30000,
    })

    await humanWait(3000, 6000)

    // Fill name
    await page.waitForSelector('input[name="name"]', { timeout: 20000 })
    await page.type('input[name="name"]', accountData.profile.fullName, { delay: 100 })
    await humanWait(1000, 2000)

    // Fill email
    await page.type('input[name="email"]', accountData.email, { delay: 100 })
    await humanWait(1000, 2000)

    await sendNotification(userId, `Setting up profile for ${accountData.profile.fullName}...`, "info")

    // Select birth month
    await page.click('select[name="month"]')
    await humanWait(500, 1000)
    await page.select('select[name="month"]', accountData.profile.birthMonth.toString())
    await humanWait(500, 1000)

    // Select birth day
    await page.click('select[name="day"]')
    await humanWait(500, 1000)
    await page.select('select[name="day"]', accountData.profile.birthDay.toString())
    await humanWait(500, 1000)

    // Select birth year
    await page.click('select[name="year"]')
    await humanWait(500, 1000)
    await page.select('select[name="year"]', accountData.profile.birthYear.toString())
    await humanWait(1000, 2000)

    // Click Next
    await page.click('[data-testid="ocf_base_step_next_button"]')
    await humanWait(3000, 5000)

    await sendNotification(userId, `Completing registration for ${accountData.profile.fullName}...`, "info")

    // Handle verification code if needed
    try {
      await page.waitForSelector('input[name="verfication_code"]', { timeout: 10000 })
      // If verification code is required, we'll skip for now
      throw new Error("Phone verification required")
    } catch (e) {
      // Continue if no verification code needed
    }

    // Set password
    try {
      await page.waitForSelector('input[name="password"]', { timeout: 10000 })
      await page.type('input[name="password"]', accountData.profile.password, { delay: 100 })
      await humanWait(1000, 2000)

      // Submit
      await page.click('[data-testid="LoginForm_Login_Button"]')
      await humanWait(3000, 5000)
    } catch (e) {
      // Continue
    }

    // Check for success
    const currentUrl = page.url()

    if (currentUrl.includes("twitter.com") && !currentUrl.includes("/signup")) {
      await sendNotification(
        userId,
        `✅ Twitter account created successfully: ${accountData.profile.fullName}`,
        "success",
      )

      return {
        success: true,
        platform: "twitter",
        message: "Account created successfully",
        username: accountData.profile.usernames[0],
        email: accountData.email,
        accountData: {
          userId: `tw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          profileUrl: `https://twitter.com/${accountData.profile.usernames[0]}`,
          createdAt: new Date().toISOString(),
        },
      }
    } else {
      throw new Error("Account creation failed or requires additional verification")
    }
  } catch (error) {
    await sendNotification(userId, `❌ Failed to create Twitter account: ${error.message}`, "error")
    return {
      success: false,
      platform: "twitter",
      error: error.message,
    }
  } finally {
    if (browser) {
      setTimeout(async () => {
        try {
          await browser.close()
        } catch (e) {
          // Ignore
        }
      }, 5000)
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { count = 1, userId } = body

    if (!userId) {
      return NextResponse.json({ success: false, message: "User ID is required" }, { status: 400 })
    }

    if (count < 1 || count > 3) {
      return NextResponse.json({ success: false, message: "Count must be between 1 and 3" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const results = []
    let successCount = 0

    await sendNotification(userId, `🚀 Starting creation of ${count} Twitter account${count > 1 ? "s" : ""}...`, "info")

    for (let i = 0; i < count; i++) {
      try {
        const emailResult = await createTempEmail()
        if (!emailResult.success) {
          throw new Error("Failed to get temporary email")
        }

        const profile = generateProfile()

        const accountData = {
          email: emailResult.email,
          profile: profile,
          platform: "twitter",
        }

        const creationResult = await createTwitterAccount(accountData, userId)

        const socialAccount = {
          userId: userId,
          accountNumber: i + 1,
          platform: "twitter",
          email: emailResult.email,
          username: creationResult.username || profile.usernames[0],
          password: profile.password,
          profile: {
            firstName: profile.firstName,
            lastName: profile.lastName,
            fullName: profile.fullName,
            birthDate: `${profile.birthYear}-${profile.birthMonth.toString().padStart(2, "0")}-${profile.birthDay.toString().padStart(2, "0")}`,
          },
          creationResult: creationResult,
          status: creationResult.success ? "active" : "failed",
          verified: false,
          realAccount: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        await db.collection("social_accounts").insertOne(socialAccount)

        results.push({
          accountNumber: i + 1,
          success: creationResult.success,
          platform: "twitter",
          email: emailResult.email,
          username: creationResult.username || profile.usernames[0],
          password: profile.password,
          profile: profile,
          message: creationResult.message,
          error: creationResult.error,
        })

        if (creationResult.success) {
          successCount++
        }

        // Wait between accounts
        if (i < count - 1) {
          const delay = 90000 + Math.random() * 30000 // 1.5-2 minutes
          await sendNotification(
            userId,
            `⏳ Waiting before creating next account... (${Math.round(delay / 1000)} seconds)`,
            "info",
          )
          await wait(delay)
        }
      } catch (error) {
        await sendNotification(userId, `❌ Account ${i + 1} failed: ${error.message}`, "error")
        results.push({
          accountNumber: i + 1,
          success: false,
          platform: "twitter",
          error: error.message,
        })
      }
    }

    await sendNotification(
      userId,
      `🎉 Twitter account creation completed! ${successCount}/${count} accounts created successfully.`,
      successCount > 0 ? "success" : "error",
    )

    return NextResponse.json({
      success: true,
      message: `Twitter account creation completed! ${successCount}/${count} accounts created.`,
      totalRequested: count,
      totalCreated: successCount,
      platform: "twitter",
      accounts: results,
    })
  } catch (error) {
    console.error("Error creating Twitter accounts:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create Twitter accounts",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ success: false, message: "User ID is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const accounts = await db
      .collection("social_accounts")
      .find({ userId, platform: "twitter" })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({
      success: true,
      accounts,
      count: accounts.length,
    })
  } catch (error) {
    console.error("Error fetching Twitter accounts:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch Twitter accounts",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
