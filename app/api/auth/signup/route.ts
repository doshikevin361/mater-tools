import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, company, phone } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Name, email, and password are required",
        },
        { status: 400 },
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a valid email address",
        },
        { status: 400 },
      )
    }

    const db = await getDatabase()

    const existingUser = await db.collection("users").findOne({
      email: email.toLowerCase(),
    })

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "User with this email already exists",
        },
        { status: 409 },
      )
    }

    const newUser = {
      name,
      email: email.toLowerCase(),
      password,
      company: company || "",
      phone: phone || "",
      plan: "Free",
      balance: 1000,
      avatar: "",
      status: "active",
      createdAt: new Date(),
      lastLogin: new Date(),
      lastActive: new Date(),
    }

    const result = await db.collection("users").insertOne(newUser)

    const userData = {
      id: result.insertedId.toString(),
      name: newUser.name,
      email: newUser.email,
      company: newUser.company,
      phone: newUser.phone,
      plan: newUser.plan,
      balance: newUser.balance,
      avatar: newUser.avatar,
      createdAt: newUser.createdAt,
    }

    return NextResponse.json({
      success: true,
      message: "Account created successfully! Welcome bonus of ₹1,000 added.",
      user: userData,
      token: "jwt-token-" + result.insertedId.toString() + "-" + Date.now(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create account. Please try again.",
      },
      { status: 500 },
    )
  }
}
