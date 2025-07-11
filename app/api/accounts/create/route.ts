import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import axios from "axios"

// Proxy Configuration
const PROXY_CONFIG = {
  user: "PF4IyIyXUrCPsfy",
  pass: "b9PKevM9xA9iJaa",
  ip: "92.113.55.219",
  port: "41330",
}

const headers = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
}

// Create temporary email
async function createTempEmail() {
  try {
    // Try with proxy
    const response = await axios.get("https://www.1secmail.com/api/v1/?action=genRandomMailbox&count=1", {
      proxy: {
        protocol: "http",
        host: PROXY_CONFIG.ip,
        port: Number.parseInt(PROXY_CONFIG.port),
        auth: {
          username: PROXY_CONFIG.user,
          password: PROXY_CONFIG.pass,
        },
      },
      headers,
      timeout: 10000,
    })
    return response.data[0]
  } catch (error) {
    // Try without proxy
    try {
      const response = await axios.get("https://www.1secmail.com/api/v1/?action=genRandomMailbox&count=1", {
        headers,
        timeout: 10000,
      })
      return response.data[0]
    } catch (err) {
      // Manual generation
      const username = `user${Math.floor(Math.random() * 900000) + 100000}`
      const domains = ["1secmail.com", "1secmail.org", "esiix.com"]
      const domain = domains[Math.floor(Math.random() * domains.length)]
      return `${username}@${domain}`
    }
  }
}

// Generate profile data
function generateProfile() {
  const firstNames = ["Alex", "Jordan", "Taylor", "Casey", "Morgan", "Riley", "Avery", "Quinn"]
  const lastNames = ["Smith", "Johnson", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor"]

  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
  const birthYear = Math.floor(Math.random() * 16) + 1990 // 1990-2005
  const birthMonth = Math.floor(Math.random() * 12) + 1
  const birthDay = Math.floor(Math.random() * 28) + 1
  const gender = Math.random() > 0.5 ? "male" : "female"

  const base = `${firstName.toLowerCase()}${lastName.toLowerCase()}`
  const usernames = [
    `${base}${Math.floor(Math.random() * 90) + 10}`,
    `${firstName.toLowerCase()}${birthYear}`,
    `${firstName.toLowerCase()}_${Math.floor(Math.random() * 9000) + 1000}`,
  ]

  return {
    firstName,
    lastName,
    birthYear,
    birthMonth,
    birthDay,
    gender,
    usernames,
    password: `${firstName}123!`,
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { count = 10, userId } = body

    if (!userId) {
      return NextResponse.json({ success: false, message: "User ID is required" }, { status: 400 })
    }

    if (count > 100) {
      return NextResponse.json({ success: false, message: "Maximum 100 accounts allowed" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const accounts = []

    console.log(`Creating ${count} temporary accounts...`)

    for (let i = 0; i < count; i++) {
      console.log(`Creating account ${i + 1}/${count}...`)

      const email = await createTempEmail()
      const profile = generateProfile()

      const account = {
        accountNumber: i + 1,
        email,
        profile,
        userId,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      accounts.push(account)

      // Small delay to avoid rate limiting
      if (i < count - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    // Store accounts in database
    await db.collection("temp_accounts").insertMany(accounts)

    return NextResponse.json({
      success: true,
      accounts,
      count: accounts.length,
      message: `Successfully created ${accounts.length} accounts`,
    })
  } catch (error) {
    console.error("Error creating accounts:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create accounts",
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
    const accounts = await db.collection("temp_accounts").find({ userId }).sort({ createdAt: -1 }).toArray()

    return NextResponse.json({
      success: true,
      accounts,
      count: accounts.length,
    })
  } catch (error) {
    console.error("Error fetching accounts:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch accounts",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
