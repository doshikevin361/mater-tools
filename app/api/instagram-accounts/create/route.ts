import { NextResponse } from "next/server"
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

async function createTempEmail() {
  try {
    const sessionResponse = await axios.get("https://www.guerrillamail.com/ajax.php?f=get_email_address", {
      timeout: 15000,
      headers: {
        "User-Agent": USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
        Referer: "https://www.guerrillamail.com/inbox",
        Accept: "application/json, text/javascript, */*; q=0.01",
        "Accept-Language": "en-US,en;q=0.9",
      },
    })

    if (sessionResponse.data && sessionResponse.data.email_addr) {
      return {
        success: true,
        email: sessionResponse.data.email_addr,
        sessionId: sessionResponse.data.sid_token,
        provider: "guerrillamail_default",
      }
    } else {
      throw new Error("Failed to get default Guerrillamail email")
    }
  } catch (error) {
    throw new Error("Guerrillamail failed - cannot get default email")
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
    "Rudra",
    "Ayaan",
    "Yash",
    "Om",
    "Darsh",
    "Rishab",
    "Krian",
    "Armaan",
    "Vedant",
    "Sreyansh",
    "Ahaan",
    "Tejas",
    "Harsh",
    "Samar",
    "Dhruv",
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
    "Myra",
    "Prisha",
    "Aanya",
    "Navya",
    "Drishti",
    "Shanaya",
    "Avni",
    "Reet",
    "Kiara",
    "Khushi",
    "Aradhya",
    "Kainaat",
    "Riddhi",
    "Mahika",
    "Siya",
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
    "Kapoor",
    "Chopra",
    "Khanna",
    "Arora",
    "Bajaj",
    "Bansal",
    "Mittal",
    "Jindal",
    "Agrawal",
    "Goyal",
    "Saxena",
    "Rastogi",
    "Srivastava",
    "Shukla",
    "Pandey",
    "Tiwari",
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
    `${lastName.toLowerCase()}${firstName.toLowerCase()}${randomSuffix}`,
    `${firstName.toLowerCase()}_${randomSuffix}`,
    `${lastName.toLowerCase()}_${randomSuffix}`,
    `indian_${firstName.toLowerCase()}${lastName.toLowerCase()}`,
    `desi_${firstName.toLowerCase()}${randomSuffix}`,
    `${firstName.toLowerCase()}india${randomSuffix}`,
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

async function createStealthBrowser() {
  const resolution = SCREEN_RESOLUTIONS[Math.floor(Math.random() * SCREEN_RESOLUTIONS.length)]
  const randomUserAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]

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
      "--disable-blink-features=AutomationControlled",
      "--disable-web-security",
      "--disable-features=VizDisplayCompositor",
    ],
    ignoreDefaultArgs: ["--enable-automation"],
    defaultViewport: null,
    ignoreHTTPSErrors: true,
  })

  const pages = await browser.pages()
  const page = pages[0] || (await browser.newPage())

  await page.setUserAgent(randomUserAgent)
  await page.setViewport({
    width: resolution.width,
    height: resolution.height,
    deviceScaleFactor: 1,
  })

  return { browser, page }
}

async function createInstagramAccount(accountData) {
  let browser, page

  try {
    const browserSetup = await createStealthBrowser()
    browser = browserSetup.browser
    page = browserSetup.page

    await page.goto("https://www.instagram.com/accounts/emailsignup/?hl=en", {
      waitUntil: "networkidle2",
      timeout: 30000,
    })

    await humanWait(3000, 6000)

    // Fill email
    await page.waitForSelector('input[name="emailOrPhone"]', { timeout: 20000 })
    await page.type('input[name="emailOrPhone"]', accountData.email, { delay: 120 })
    await humanWait(1000, 2000)

    // Fill full name
    await page.type('input[name="fullName"]', accountData.profile.fullName, { delay: 120 })
    await humanWait(1000, 2000)

    // Fill username
    await page.type('input[name="username"]', accountData.profile.usernames[0], { delay: 120 })
    await humanWait(1000, 2000)

    // Fill password
    await page.type('input[name="password"]', accountData.profile.password, { delay: 120 })
    await humanWait(2000, 4000)

    // Submit form
    await page.click('button[type="submit"]')
    await humanWait(4000, 8000)

    // Handle birthday selection
    try {
      await page.waitForSelector("select", { timeout: 10000 })

      const monthName = MONTHS[accountData.profile.birthMonth - 1]
      await page.select('select[title*="Month"]', monthName)
      await humanWait(1000, 2000)

      await page.select('select[title*="Day"]', accountData.profile.birthDay.toString())
      await humanWait(1000, 2000)

      await page.select('select[title*="Year"]', accountData.profile.birthYear.toString())
      await humanWait(2000, 4000)

      await page.click('button[type="submit"]')
      await humanWait(4000, 8000)
    } catch (birthdayError) {
      console.log("Birthday selection not required or failed")
    }

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
      return {
        success: true,
        platform: "instagram",
        message: "Account created successfully",
        username: accountData.profile.usernames[0],
        email: accountData.email,
        profileUrl: `https://instagram.com/${accountData.profile.usernames[0]}`,
      }
    } else {
      return {
        success: false,
        platform: "instagram",
        error: "Account creation failed",
        finalUrl: currentUrl,
      }
    }
  } catch (error) {
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

async function sendNotification(userId, title, message, type = "info") {
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

export async function POST(request) {
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

    // Send initial notification
    await sendNotification(
      userId,
      "Instagram Account Creation Started",
      `Creating ${count} Instagram account${count > 1 ? "s" : ""}. This may take a few minutes...`,
      "info",
    )

    console.log(`🚀 Creating ${count} Instagram accounts...`)

    for (let i = 0; i < count; i++) {
      console.log(`📱 Creating Instagram account ${i + 1}/${count}...`)

      try {
        const emailResult = await createTempEmail()
        if (!emailResult.success) {
          throw new Error("Failed to get temporary email")
        }

        const profile = generateProfile()
        console.log(`🇮🇳 Generated profile: ${profile.fullName} (@${profile.usernames[0]})`)

        const accountData = {
          email: emailResult.email,
          profile: profile,
          platform: "instagram",
        }

        const creationResult = await createInstagramAccount(accountData)

        const instagramAccount = {
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
          status: creationResult.success ? "active" : "failed",
          verified: creationResult.success,
          creationResult: creationResult,
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        await db.collection("instagram_accounts").insertOne(instagramAccount)

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
          profileUrl: creationResult.profileUrl,
        })

        if (creationResult.success) {
          successCount++
          console.log(`✅ Instagram account ${i + 1} created: ${creationResult.username}`)
        } else {
          console.log(`❌ Instagram account ${i + 1} failed: ${creationResult.error}`)
        }

        // Send progress notification
        await sendNotification(
          userId,
          "Instagram Account Progress",
          `Account ${i + 1}/${count} ${creationResult.success ? "created successfully" : "failed"}. ${creationResult.success ? `Username: ${creationResult.username}` : `Error: ${creationResult.error}`}`,
          creationResult.success ? "success" : "error",
        )

        if (i < count - 1) {
          const delay = 60000 + Math.random() * 30000 // 1-1.5 minutes between accounts
          console.log(`⏳ Waiting ${Math.round(delay / 1000)} seconds before next account...`)
          await wait(delay)
        }
      } catch (error) {
        console.log(`❌ Instagram account ${i + 1} failed: ${error.message}`)
        results.push({
          accountNumber: i + 1,
          success: false,
          platform: "instagram",
          error: error.message,
        })

        await sendNotification(
          userId,
          "Instagram Account Error",
          `Account ${i + 1}/${count} failed: ${error.message}`,
          "error",
        )
      }
    }

    // Send completion notification
    await sendNotification(
      userId,
      "Instagram Account Creation Completed",
      `Completed creating Instagram accounts! ${successCount}/${count} accounts created successfully.`,
      successCount === count ? "success" : successCount > 0 ? "warning" : "error",
    )

    return NextResponse.json({
      success: true,
      message: `Instagram account creation completed! ${successCount}/${count} accounts created successfully.`,
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

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ success: false, message: "User ID is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const accounts = await db.collection("instagram_accounts").find({ userId }).sort({ createdAt: -1 }).toArray()

    return NextResponse.json({
      success: true,
      accounts,
      count: accounts.length,
      summary: {
        total: accounts.length,
        successful: accounts.filter((acc) => acc.status === "active").length,
        failed: accounts.filter((acc) => acc.status === "failed").length,
      },
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
