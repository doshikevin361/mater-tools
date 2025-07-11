import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import axios from "axios"
import puppeteer from "puppeteer"

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

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
      title: "Facebook Account Creation",
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
    "Arjun",
    "Aarav",
    "Vivaan",
    "Aditya",
    "Vihaan",
    "Sai",
    "Aryan",
    "Krishna",
    "Saanvi",
    "Ananya",
    "Aadhya",
    "Diya",
    "Kavya",
    "Pihu",
    "Angel",
    "Pari",
  ]

  const lastNames = [
    "Sharma",
    "Verma",
    "Singh",
    "Kumar",
    "Gupta",
    "Agarwal",
    "Mishra",
    "Jain",
    "Patel",
    "Shah",
    "Mehta",
    "Joshi",
    "Desai",
    "Modi",
    "Reddy",
    "Nair",
  ]

  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
  const birthYear = Math.floor(Math.random() * 22) + 1985
  const birthMonth = Math.floor(Math.random() * 12) + 1
  const birthDay = Math.floor(Math.random() * 28) + 1

  const password = `${firstName}${Math.floor(Math.random() * 9999)}!`

  return {
    firstName,
    lastName,
    birthYear,
    birthMonth,
    birthDay,
    password,
    fullName: `${firstName} ${lastName}`,
  }
}

async function createFacebookAccount(accountData, userId) {
  let browser, page

  try {
    await sendNotification(userId, `Starting Facebook account creation for ${accountData.profile.fullName}...`, "info")

    const browserSetup = await createStealthBrowser()
    browser = browserSetup.browser
    page = browserSetup.page

    await page.goto("https://www.facebook.com/reg/", {
      waitUntil: "networkidle2",
      timeout: 30000,
    })

    await humanWait(3000, 6000)

    // Fill first name
    await page.type('input[name="firstname"]', accountData.profile.firstName, { delay: 100 })
    await humanWait(500, 1000)

    // Fill last name
    await page.type('input[name="lastname"]', accountData.profile.lastName, { delay: 100 })
    await humanWait(500, 1000)

    // Fill email
    await page.type('input[name="reg_email__"]', accountData.email, { delay: 100 })
    await humanWait(500, 1000)

    // Confirm email
    await page.type('input[name="reg_email_confirmation__"]', accountData.email, { delay: 100 })
    await humanWait(500, 1000)

    // Fill password
    await page.type('input[name="reg_passwd__"]', accountData.profile.password, { delay: 100 })
    await humanWait(1000, 2000)

    await sendNotification(userId, `Setting up profile details for ${accountData.profile.fullName}...`, "info")

    // Select birthday
    await page.select('select[name="birthday_day"]', accountData.profile.birthDay.toString())
    await humanWait(500, 1000)

    await page.select('select[name="birthday_month"]', accountData.profile.birthMonth.toString())
    await humanWait(500, 1000)

    await page.select('select[name="birthday_year"]', accountData.profile.birthYear.toString())
    await humanWait(1000, 2000)

    // Select gender
    const gender = Math.random() > 0.5 ? "2" : "1" // 1=Female, 2=Male
    await page.click(`input[name="sex"][value="${gender}"]`)
    await humanWait(1000, 2000)

    await sendNotification(userId, `Submitting registration for ${accountData.profile.fullName}...`, "info")

    // Submit form
    await page.click('button[name="websubmit"]')
    await humanWait(5000, 8000)

    // Check for success
    const currentUrl = page.url()

    if (currentUrl.includes("facebook.com") && !currentUrl.includes("/reg/")) {
      await sendNotification(
        userId,
        `✅ Facebook account created successfully: ${accountData.profile.fullName}`,
        "success",
      )

      return {
        success: true,
        platform: "facebook",
        message: "Account created successfully",
        username: accountData.profile.fullName,
        email: accountData.email,
        accountData: {
          userId: `fb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          profileUrl: `https://facebook.com/profile.php`,
          createdAt: new Date().toISOString(),
        },
      }
    } else {
      throw new Error("Account creation failed")
    }
  } catch (error) {
    await sendNotification(userId, `❌ Failed to create Facebook account: ${error.message}`, "error")
    return {
      success: false,
      platform: "facebook",
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

    if (count < 1 || count > 5) {
      return NextResponse.json({ success: false, message: "Count must be between 1 and 5" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const results = []
    let successCount = 0

    await sendNotification(
      userId,
      `🚀 Starting creation of ${count} Facebook account${count > 1 ? "s" : ""}...`,
      "info",
    )

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
          platform: "facebook",
        }

        const creationResult = await createFacebookAccount(accountData, userId)

        const socialAccount = {
          userId: userId,
          accountNumber: i + 1,
          platform: "facebook",
          email: emailResult.email,
          username: creationResult.username || profile.fullName,
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
          platform: "facebook",
          email: emailResult.email,
          username: creationResult.username || profile.fullName,
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
          const delay = 60000 + Math.random() * 30000
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
          platform: "facebook",
          error: error.message,
        })
      }
    }

    await sendNotification(
      userId,
      `🎉 Facebook account creation completed! ${successCount}/${count} accounts created successfully.`,
      successCount > 0 ? "success" : "error",
    )

    return NextResponse.json({
      success: true,
      message: `Facebook account creation completed! ${successCount}/${count} accounts created.`,
      totalRequested: count,
      totalCreated: successCount,
      platform: "facebook",
      accounts: results,
    })
  } catch (error) {
    console.error("Error creating Facebook accounts:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create Facebook accounts",
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
      .find({ userId, platform: "facebook" })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({
      success: true,
      accounts,
      count: accounts.length,
    })
  } catch (error) {
    console.error("Error fetching Facebook accounts:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch Facebook accounts",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
