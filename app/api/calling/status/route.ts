import { NextResponse } from "next/server"
import twilio from "twilio"

export async function GET() {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER

    // Check if credentials are configured
    if (!accountSid || !authToken || !twilioPhoneNumber) {
      return NextResponse.json({
        configured: false,
        valid: false,
        error: "Missing Twilio credentials in environment variables",
      })
    }

    // Test credentials by making API call
    try {
      const client = twilio(accountSid, authToken)
      const account = await client.api.accounts(accountSid).fetch()

      return NextResponse.json({
        configured: true,
        valid: true,
        accountSid: accountSid,
        phoneNumber: twilioPhoneNumber,
        accountStatus: account.status,
        accountName: account.friendlyName,
      })
    } catch (error) {
      return NextResponse.json({
        configured: true,
        valid: false,
        accountSid: accountSid,
        phoneNumber: twilioPhoneNumber,
        error: error instanceof Error ? error.message : "Invalid credentials",
      })
    }
  } catch (error) {
    return NextResponse.json(
      {
        configured: false,
        valid: false,
        error: "Failed to check Twilio status",
      },
      { status: 500 },
    )
  }
}
