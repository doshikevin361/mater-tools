import { type NextRequest, NextResponse } from "next/server"
import { generateAccessToken } from "@/lib/twilio-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const identity = searchParams.get("identity") || `user_${Date.now()}`

    console.log("Generating access token for identity:", identity)

    const token = generateAccessToken(identity)

    return NextResponse.json({
      success: true,
      token: token,
      identity: identity,
      message: "Access token generated successfully",
    })
  } catch (error: any) {
    console.error("Error generating access token:", error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate access token",
        message: "Token generation failed",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { identity } = body

    if (!identity) {
      return NextResponse.json(
        {
          success: false,
          error: "Identity is required",
          message: "Please provide a valid identity",
        },
        { status: 400 },
      )
    }

    console.log("Generating access token for identity:", identity)

    const token = generateAccessToken(identity)

    return NextResponse.json({
      success: true,
      token: token,
      identity: identity,
      message: "Access token generated successfully",
    })
  } catch (error: any) {
    console.error("Error generating access token:", error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate access token",
        message: "Token generation failed",
      },
      { status: 500 },
    )
  }
}
