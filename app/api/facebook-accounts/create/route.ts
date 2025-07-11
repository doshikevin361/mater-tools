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

async function createFacebookAccount(profile: any, userId: string) {
  let browser
  const accountData = {
    platform: "facebook",
    email: profile.email,
    firstName: profile.firstName,
    lastName: profile.lastName,
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

    // Navigate to Facebook signup
    await page.goto("https://www.facebook.com/reg/", {
      waitUntil: "networkidle2",
      timeout: 30000,
    })

    await randomDelay(2000, 4000)

    // Fill first name
    await humanType(page, 'input[name="firstname"]', profile.firstName)
    await randomDelay(500, 1500)

    // Fill last name
    await humanType(page, 'input[name="lastname"]', profile.lastName)
    await randomDelay(500, 1500)

    // Fill email
    await humanType(page, 'input[name="reg_email__"]', profile.email)
    await randomDelay(500, 1500)

    // Confirm email
    await humanType(page, 'input[name="reg_email_confirmation__"]', profile.email)
    await randomDelay(500, 1500)

    // Fill password
    await humanType(page, 'input[name="reg_passwd__"]', profile.password)
    await randomDelay(1000, 2000)

    // Handle birthday selection
    const birthDate = new Date(profile.birthDate)

    // Select month
    await page.select('select[name="birthday_month"]', (birthDate.getMonth() + 1).toString())
    await randomDelay(300, 800)

    // Select day
    await page.select('select[name="birthday_day"]', birthDate.getDate().toString())
    await randomDelay(300, 800)

    // Select year
    await page.select('select[name="birthday_year"]', birthDate.getFullYear().toString())
    await randomDelay(500, 1000)

    // Select gender
    const genderValue = profile.gender === "male" ? "2" : "1"
    await page.click(`input[name="sex"][value="${genderValue}"]`)
    await randomDelay(1000, 2000)

    // Click sign up button
    await page.click('button[name="websubmit"]')
    await randomDelay(5000, 8000)

    // Check for phone verification requirement
    const currentUrl = page.url()
    if (currentUrl.includes("checkpoint") || currentUrl.includes("phone")) {
      accountData.needsPhoneVerification = true
      accountData.status = "needs_phone_verification"
    } else {
      accountData.status = "active"
    }

    return accountData
  } catch (error) {
    console.error("Error creating Facebook account:", error)
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

    if (count > 5) {
      return NextResponse.json({ error: "Maximum 5 accounts per batch" }, { status: 400 })
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
        platform: "facebook",
        message: `Starting creation of ${count} Facebook account${count > 1 ? "s" : ""}...`,
        data: { count, platform: "facebook" },
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
          platform: "facebook",
          message: `Creating Facebook account ${i + 1} of ${count}...`,
          data: { current: i + 1, total: count, platform: "facebook" },
        }),
      })

      const accountData = await createFacebookAccount(profile, userId)

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
          platform: "facebook",
          message: `Facebook account ${accountData.firstName} ${accountData.lastName} ${accountData.status === "active" ? "created successfully" : accountData.status === "needs_phone_verification" ? "created but needs phone verification" : "creation failed"}`,
          data: { account: accountData },
        }),
      })

      // Random delay between accounts
      if (i < count - 1) {
        await randomDelay(5000, 10000)
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
        platform: "facebook",
        message: `Facebook account creation completed! Success: ${successCount}, Phone verification needed: ${phoneVerificationCount}, Failed: ${failedCount}`,
        data: {
          total: count,
          success: successCount,
          phoneVerification: phoneVerificationCount,
          failed: failedCount,
          platform: "facebook",
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
    console.error("Error in Facebook account creation:", error)
    return NextResponse.json({ error: "Failed to create Facebook accounts" }, { status: 500 })
  }
}
