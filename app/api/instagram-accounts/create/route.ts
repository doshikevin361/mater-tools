import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import axios from "axios"
import puppeteer from "puppeteer"

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

// Enhanced User Agents pool
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0",
]

const SCREEN_RESOLUTIONS = [
  { width: 1920, height: 1080 },
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 1536, height: 864 },
]

const wait = (ms, variance = 0.6) => {
  const randomDelay = ms + (Math.random() - 0.5) * 2 * variance * ms
  return new Promise((resolve) => setTimeout(resolve, Math.max(1500, randomDelay)))
}

const humanWait = (minMs = 1500, maxMs = 4000) => {
  const delay = minMs + Math.random() * (maxMs - minMs)
  return new Promise((resolve) => setTimeout(resolve, delay))
}

async function sendNotification(userId: string, message: string, type = "info") {
  try {
    const { db } = await connectToDatabase()
    await db.collection("notifications").insertOne({
      userId,
      title: "Instagram Account Creation",
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
  const resolution = SCREEN_RESOLUTIONS[Math.floor(Math.random() * SCREEN_RESOLUTIONS.length)]
  const randomUserAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-blink-features=AutomationControlled",
      "--disable-web-security",
    ],
    ignoreDefaultArgs: ["--enable-automation"],
    defaultViewport: null,
    ignoreHTTPSErrors: true,
  })

  const pages = await browser.pages()
  const page = pages[0] || (await browser.newPage())

  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined })
    window.chrome = {
      runtime: {},
      loadTimes: () => ({}),
      csi: () => ({}),
      app: {},
    }
  })

  await page.setUserAgent(randomUserAgent)
  await page.setViewport({
    width: resolution.width,
    height: resolution.height,
    deviceScaleFactor: 1,
  })

  return { browser, page }
}

async function createTempEmail() {
  try {
    const sessionResponse = await axios.get("https://www.guerrillamail.com/ajax.php?f=get_email_address", {
      timeout: 15000,
      headers: {
        "User-Agent": USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
        Referer: "https://www.guerrillamail.com/inbox",
        Accept: "application/json, text/javascript, */*; q=0.01",
      },
    })

    if (sessionResponse.data && sessionResponse.data.email_addr) {
      return {
        success: true,
        email: sessionResponse.data.email_addr,
        sessionId: sessionResponse.data.sid_token,
      }
    } else {
      throw new Error("Failed to get email")
    }
  } catch (error) {
    throw new Error("Email creation failed")
  }
}

function generateProfile() {
  const indianFirstNames = [
    "Arjun",
    "Aarav",
    "Vivaan",
    "Aditya",
    "Vihaan",
    "Sai",
    "Aryan",
    "Krishna",
    "Ishaan",
    "Shaurya",
    "Atharv",
    "Aadhya",
    "Reyansh",
    "Muhammad",
    "Siddharth",
    "Saanvi",
    "Ananya",
    "Aadhya",
    "Diya",
    "Kavya",
    "Pihu",
    "Angel",
    "Pari",
    "Fatima",
    "Aaradhya",
    "Sara",
    "Anaya",
    "Parina",
    "Aisha",
    "Anvi",
    "Riya",
  ]

  const indianLastNames = [
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
    "Iyer",
    "Rao",
    "Pillai",
    "Menon",
    "Bhat",
    "Shetty",
    "Kaul",
    "Malhotra",
  ]

  const firstName = indianFirstNames[Math.floor(Math.random() * indianFirstNames.length)]
  const lastName = indianLastNames[Math.floor(Math.random() * indianLastNames.length)]
  const birthYear = Math.floor(Math.random() * 22) + 1985
  const birthMonth = Math.floor(Math.random() * 12) + 1
  const birthDay = Math.floor(Math.random() * 28) + 1
  const gender = Math.random() > 0.5 ? "male" : "female"

  const timestamp = Date.now().toString().slice(-6)
  const randomSuffix = Math.floor(Math.random() * 99999)

  const usernames = [
    `${firstName.toLowerCase()}_${lastName.toLowerCase()}_${timestamp}`,
    `${firstName.toLowerCase()}${lastName.toLowerCase()}${timestamp}`,
    `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${timestamp}`,
    `${firstName.toLowerCase()}${randomSuffix}`,
  ]

  const password = `${firstName}${Math.floor(Math.random() * 9999)}!${lastName.charAt(0)}`

  return {
    firstName,
    lastName,
    birthYear,
    birthMonth,
    birthDay,
    gender,
    usernames,
    password,
    fullName: `${firstName} ${lastName}`,
  }
}

async function humanType(page, selector, text) {
  const element = await page.waitForSelector(selector, { timeout: 20000 })
  await element.click()
  await humanWait(400, 1000)

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const typeDelay = 100 + Math.random() * 150
    await element.type(char, { delay: typeDelay })

    if (Math.random() < 0.2) {
      await humanWait(300, 1500)
    }
  }

  await humanWait(300, 800)
}

async function humanClick(page, selector) {
  const element = await page.waitForSelector(selector, { timeout: 20000 })
  const box = await element.boundingBox()
  if (!box) throw new Error("Element not visible")

  const x = box.x + box.width * (0.25 + Math.random() * 0.5)
  const y = box.y + box.height * (0.25 + Math.random() * 0.5)

  await page.mouse.move(x, y, { steps: 5 })
  await humanWait(100, 250)
  await page.mouse.click(x, y)
  await humanWait(200, 500)
}

async function handleBirthdaySelection(page, profile) {
  try {
    await page.waitForSelector("select", { timeout: 20000 })

    const monthName = MONTHS[profile.birthMonth - 1]
    await page.select('select[title*="Month"], select:first-of-type', monthName)
    await humanWait(1000, 2000)

    await page.select('select[title*="Day"], select:nth-of-type(2)', profile.birthDay.toString())
    await humanWait(1000, 2000)

    await page.select('select[title*="Year"], select:nth-of-type(3)', profile.birthYear.toString())
    await humanWait(2000, 4000)

    const nextClicked = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button, [role="button"]')
      for (const button of buttons) {
        const text = button.textContent?.trim().toLowerCase()
        if (text === "next" && button.offsetParent !== null) {
          button.click()
          return true
        }
      }
      return false
    })

    if (!nextClicked) {
      await page.keyboard.press("Enter")
    }

    await humanWait(3000, 5000)
    return { success: true, nextClicked }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function createInstagramAccount(accountData, userId) {
  let browser, page

  try {
    await sendNotification(userId, `Starting Instagram account creation for ${accountData.profile.fullName}...`, "info")

    const browserSetup = await createStealthBrowser()
    browser = browserSetup.browser
    page = browserSetup.page

    await page.goto("https://www.instagram.com/accounts/emailsignup/?hl=en", {
      waitUntil: "networkidle2",
      timeout: 30000,
    })

    await humanWait(3000, 6000)

    // Fill email
    await humanType(page, 'input[name="emailOrPhone"]', accountData.email)
    await humanWait(1200, 2000)

    // Fill full name
    await humanType(page, 'input[name="fullName"]', accountData.profile.fullName)
    await humanWait(1200, 2000)

    // Fill username
    await humanType(page, 'input[name="username"]', accountData.profile.usernames[0])
    await humanWait(1200, 2000)

    // Fill password
    await humanType(page, 'input[name="password"]', accountData.profile.password)
    await humanWait(2000, 4000)

    await sendNotification(userId, `Submitting registration form for ${accountData.profile.fullName}...`, "info")

    // Submit form
    await humanClick(page, 'button[type="submit"]')
    await humanWait(3000, 6000)

    // Handle birthday selection
    await sendNotification(userId, `Setting up profile details for ${accountData.profile.fullName}...`, "info")

    const birthdayResult = await handleBirthdaySelection(page, accountData.profile)
    if (!birthdayResult.success) {
      throw new Error(`Birthday selection failed: ${birthdayResult.error}`)
    }

    await humanWait(4000, 8000)

    // Check for success
    const currentUrl = page.url()
    const finalContent = await page.content()

    const successIndicators = [
      currentUrl.includes("instagram.com") && !currentUrl.includes("emailsignup"),
      finalContent.includes("Home"),
      finalContent.includes("Profile"),
      currentUrl.includes("/onboarding/"),
      currentUrl === "https://www.instagram.com/",
    ]

    const isSuccessful = successIndicators.some((indicator) => indicator)

    if (isSuccessful) {
      await sendNotification(
        userId,
        `✅ Instagram account created successfully: @${accountData.profile.usernames[0]}`,
        "success",
      )

      return {
        success: true,
        platform: "instagram",
        message: "Account created successfully",
        username: accountData.profile.usernames[0],
        email: accountData.email,
        accountData: {
          userId: `ig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          profileUrl: `https://instagram.com/${accountData.profile.usernames[0]}`,
          createdAt: new Date().toISOString(),
        },
      }
    } else {
      throw new Error("Account creation status unclear")
    }
  } catch (error) {
    await sendNotification(userId, `❌ Failed to create Instagram account: ${error.message}`, "error")
    return {
      success: false,
      platform: "instagram",
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
      `🚀 Starting creation of ${count} Instagram account${count > 1 ? "s" : ""}...`,
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
          platform: "instagram",
        }

        const creationResult = await createInstagramAccount(accountData, userId)

        const socialAccount = {
          userId: userId,
          accountNumber: i + 1,
          platform: "instagram",
          email: emailResult.email,
          username: creationResult.username || profile.usernames[0],
          password: profile.password,
          profile: {
            firstName: profile.firstName,
            lastName: profile.lastName,
            fullName: profile.fullName,
            birthDate: `${profile.birthYear}-${profile.birthMonth.toString().padStart(2, "0")}-${profile.birthDay.toString().padStart(2, "0")}`,
            gender: profile.gender,
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
          platform: "instagram",
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
          const delay = 60000 + Math.random() * 30000 // 1-1.5 minutes
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
          platform: "instagram",
          error: error.message,
        })
      }
    }

    // Final notification
    await sendNotification(
      userId,
      `🎉 Instagram account creation completed! ${successCount}/${count} accounts created successfully.`,
      successCount > 0 ? "success" : "error",
    )

    return NextResponse.json({
      success: true,
      message: `Instagram account creation completed! ${successCount}/${count} accounts created.`,
      totalRequested: count,
      totalCreated: successCount,
      platform: "instagram",
      accounts: results,
    })
  } catch (error) {
    console.error("Error creating Instagram accounts:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create Instagram accounts",
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
      .find({ userId, platform: "instagram" })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({
      success: true,
      accounts,
      count: accounts.length,
    })
  } catch (error) {
    console.error("Error fetching Instagram accounts:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch Instagram accounts",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
