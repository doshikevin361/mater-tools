import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ success: false, message: "Email and password are required" }, { status: 400 })
    }

    try {
      const db = await getDatabase()

      // Check for demo credentials first
      if (email === "demo@brandbuzzventures.com" && password === "demo123") {
        const demoUser = {
          _id: "demo-user-123",
          firstName: "Demo",
          lastName: "User",
          email: "demo@brandbuzzventures.com",
          plan: "Professional",
          balance: 1000,
          avatar: null,
          createdAt: new Date(),
        }

        // Ensure demo user exists in database
        await db.collection("users").updateOne({ _id: "demo-user-123" }, { $set: demoUser }, { upsert: true })

        return NextResponse.json({
          success: true,
          message: "Login successful",
          user: demoUser,
        })
      }

      // Check database for user
      const user = await db.collection("users").findOne({ email })

      if (!user) {
        return NextResponse.json({ success: false, message: "Invalid email or password" }, { status: 401 })
      }

      // Simple password comparison (not hashed)
      const isValidPassword = user.password === password

      if (!isValidPassword) {
        return NextResponse.json({ success: false, message: "Invalid email or password" }, { status: 401 })
      }

      // Update last login
      await db.collection("users").updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } })

      return NextResponse.json({
        success: true,
        message: "Login successful",
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          plan: user.plan,
          balance: user.balance,
          avatar: user.avatar,
          createdAt: user.createdAt,
        },
      })
    } catch (dbError) {
      console.error("Database error:", dbError)

      // Fallback for admin credentials
      if (email === "admin@brandbuzzventures.com" && password === "admin123") {
        return NextResponse.json({
          success: true,
          message: "Login successful (admin fallback)",
          user: {
            _id: "admin-user-456",
            firstName: "Admin",
            lastName: "User",
            email: "admin@brandbuzzventures.com",
            plan: "Enterprise",
            balance: 5000,
            avatar: null,
            createdAt: new Date(),
          },
        })
      }

      return NextResponse.json({ success: false, message: "Database connection error" }, { status: 500 })
    }
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
