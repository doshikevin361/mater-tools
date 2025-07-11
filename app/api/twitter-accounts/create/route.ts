import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import puppeteer from "puppeteer"

// Indian names and surnames for realistic profiles
const indianFirstNames = [
  "Aarav",
  "Vivaan",
  "Aditya",
  "Vihaan",
  "Arjun",
  "Sai",
  "Reyansh",
  "Ayaan",
  "Krishna",
  "Ishaan",
  "Ananya",
  "Diya",
  "Priya",
  "Kavya",
  "Aanya",
  "Isha",
  "Avni",
  "Sara",
  "Riya",
  "Myra",
]

const indianLastNames = [
  "Sharma",
  "Verma",
  "Singh",
  "Kumar",
  "Gupta",
  "Agarwal",
  "Jain",
  "Patel",
  "Shah",
  "Mehta",
  "Reddy",
  "Nair",
  "Iyer",
  "Rao",
  "Pillai",
  "Menon",
  "Bhat",
  "Shetty",
  "Kulkarni",
  "Desai",
]

// Generate temporary email
function generateTempEmail(): string {
  const domains = ["tempmail.org", "10minutemail.com", "guerrillamail.com", "mailinator.com"]
  const randomString = Math.random().toString(36).substring(2, 10)
  const domain = domains[Math.floor(Math.random() * domains.length)]
  return `${randomString}@${domain}`
}

// Generate Indian profile
function generateIndianProfile() {
  const firstName = indianFirstNames[Math.floor(Math.random() * indianFirstNames.length)]
  const lastName = indianLastNames[Math.floor(Math.random() * indianLastNames.length)]
  const email = generateTempEmail()
  const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}${Math.floor(Math.random() * 999)}`
  const password = `${firstName}@${Math.floor(Math.random() * 9999)}`

  // Generate random birth date (18-35 years old)
  const currentYear = new Date().getFullYear()
  const birthYear = currentYear - Math.floor(Math.random() * 17) - 18
  const birthMonth = Math.floor(Math.random() * 12) + 1
  const birthDay = Math.floor(Math.random() * 28) + 1

  return {
    firstName,
    lastName,
    email,
    username,
    password,
    birthDate: `${birthYear}-${birthMonth.toString().padStart(2, "0")}-${birthDay.toString().padStart(2, "0")}`,
    gender: Math.random() > 0.5 ? "male" : "female",
  }
}

// Human-like typing function
async function humanType(page: any, selector: string, text: string) {
  await page.click(selector)
  await page.evaluate((sel) => {
    const element = document.querySelector(sel) as HTMLInputElement
    if (element) element.value = ""
  }, selector)

  for (const char of text) {
    await page.type(selector, char, { delay: Math.random() * 100 + 50 })
  }
}

// Random delay function
function randomDelay(min = 1000, max = 3000) {
  return new Promise((resolve) => setTimeout(resolve, Math.random() * (max - min) + min))
}

async function createTwitterAccount(profile: any, userId: string) {
  let browser
  const accountData = {
    platform: "twitter",
    email: profile.email,
    firstName: profile.firstName,
    lastName: profile.lastName,
    username: profile.username,
    password: profile.password,
    birthDate: profile.birthDate,
    gender: profile.gender,
    status: "creating",
    userId,
    createdAt: new Date(),
    needsPhoneVerification: false,
    error: null,
  }

  try {
    // Launch browser with stealth settings
    browser = await puppeteer.launch({
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
        "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      ],
    })

    const page = await browser.newPage()

    // Set viewport and user agent
    await page.setViewport({
      width: 1366 + Math.floor(Math.random() * 200),
      height: 768 + Math.floor(Math.random() * 200),
    })

    // Navigate to Twitter signup
    await page.goto("https://twitter.com/i/flow/signup", {
      waitUntil: "networkidle2",
      timeout: 30000,
    })

    await randomDelay(2000, 4000)

    // Fill name
    await humanType(page, 'input[name="name"]', `${profile.firstName} ${profile.lastName}`)
    await randomDelay(500, 1500)

    // Fill email
    await humanType(page, 'input[name="email"]', profile.email)
    await randomDelay(1000, 2000)

    // Handle birthday selection
    const birthDate = new Date(profile.birthDate)

    // Select month
    await page.select('select[id*="SELECTOR_1"]', birthDate.toLocaleString("en-US", { month: "long" }))
    await randomDelay(300, 800)

    // Select day
    await page.select('select[id*="SELECTOR_2"]', birthDate.getDate().toString())
    await randomDelay(300, 800)

    // Select year
    await page.select('select[id*="SELECTOR_3"]', birthDate.getFullYear().toString())
    await randomDelay(1000, 2000)

    // Click next button
    await page.click('[data-testid="ocf_base_text_next_button"]')
    await randomDelay(3000, 5000)

    // Skip phone number if possible
    try {
      await page.click('[data-testid="ocf_base_text_skip_button"]')
      await randomDelay(2000, 3000)
    } catch (e) {
      // Phone verification might be required
      accountData.needsPhoneVerification = true
    }

    // Continue with signup process
    await page.click('[data-testid="ocf_base_text_next_button"]')
    await randomDelay(3000, 5000)

    // Fill password
    await humanType(page, 'input[name="password"]', profile.password)
    await randomDelay(1000, 2000)

    // Click next
    await page.click('[data-testid="ocf_base_text_next_button"]')
    await randomDelay(3000, 5000)

    // Check for phone verification requirement
    const currentUrl = page.url()
    if (currentUrl.includes("challenge") || currentUrl.includes("phone") || accountData.needsPhoneVerification) {
      accountData.needsPhoneVerification = true
      accountData.status = "needs_phone_verification"
    } else {
      accountData.status = "active"
    }

    return accountData
  } catch (error) {
    console.error("Error creating Twitter account:", error)
    accountData.status = "failed"
    accountData.error = error instanceof Error ? error.message : "Unknown error"
    return accountData
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { count = 1, userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    if (count > 3) {
      return NextResponse.json({ error: "Maximum 3 accounts per batch for Twitter" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const accounts = []

    // Send initial notification
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        type: "account_creation_started",
        platform: "twitter",
        message: `Starting creation of ${count} Twitter account${count > 1 ? "s" : ""}...`,
        data: { count, platform: "twitter" },
      }),
    })

    for (let i = 0; i < count; i++) {
      const profile = generateIndianProfile()

      // Send progress notification
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          type: "account_creation_progress",
          platform: "twitter",
          message: `Creating Twitter account ${i + 1} of ${count}...`,
          data: { current: i + 1, total: count, platform: "twitter" },
        }),
      })

      const accountData = await createTwitterAccount(profile, userId)

      // Save to database
      await db.collection("social_accounts").insertOne(accountData)
      accounts.push(accountData)

      // Send individual account notification
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          type: "account_created",
          platform: "twitter",
          message: `Twitter account ${accountData.username} ${accountData.status === "active" ? "created successfully" : accountData.status === "needs_phone_verification" ? "created but needs phone verification" : "creation failed"}`,
          data: { account: accountData },
        }),
      })

      // Random delay between accounts
      if (i < count - 1) {
        await randomDelay(8000, 15000) // Longer delay for Twitter
      }
    }

    // Send completion notification
    const successCount = accounts.filter((acc) => acc.status === "active").length
    const phoneVerificationCount = accounts.filter((acc) => acc.status === "needs_phone_verification").length
    const failedCount = accounts.filter((acc) => acc.status === "failed").length

    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        type: "account_creation_completed",
        platform: "twitter",
        message: `Twitter account creation completed! Success: ${successCount}, Phone verification needed: ${phoneVerificationCount}, Failed: ${failedCount}`,
        data: {
          total: count,
          success: successCount,
          phoneVerification: phoneVerificationCount,
          failed: failedCount,
          platform: "twitter",
        },
      }),
    })

    return NextResponse.json({
      success: true,
      accounts,
      summary: {
        total: count,
        success: successCount,
        phoneVerification: phoneVerificationCount,
        failed: failedCount,
      },
    })
  } catch (error) {
    console.error("Error in Twitter account creation:", error)
    return NextResponse.json({ error: "Failed to create Twitter accounts" }, { status: 500 })
  }
}
