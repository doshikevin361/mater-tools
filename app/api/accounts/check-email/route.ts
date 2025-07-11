import { type NextRequest, NextResponse } from "next/server"
import axios from "axios"

const headers = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
}

async function checkEmail(email: string) {
  try {
    const [username, domain] = email.split("@")
    const response = await axios.get(
      `https://www.1secmail.com/api/v1/?action=getMessages&login=${username}&domain=${domain}`,
      { headers, timeout: 10000 },
    )

    if (response.data && response.data.length > 0) {
      return response.data[0]
    }
    return null
  } catch (error) {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ success: false, message: "Email is required" }, { status: 400 })
    }

    const message = await checkEmail(email)

    if (message) {
      return NextResponse.json({
        success: true,
        message: "Email found",
        data: {
          subject: message.subject || "No Subject",
          from: message.from || "Unknown",
          date: message.date,
        },
      })
    } else {
      return NextResponse.json({
        success: false,
        message: "No emails found",
      })
    }
  } catch (error) {
    console.error("Error checking email:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error checking email",
        error: error.message,
      },
      { status: 500 },
    )
  }
}
