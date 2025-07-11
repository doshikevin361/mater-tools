import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import * as XLSX from "xlsx"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const platform = searchParams.get("platform") || "all"

    if (!userId) {
      return NextResponse.json({ success: false, message: "User ID is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const query: any = { userId }

    if (platform !== "all") {
      query.platform = platform
    }

    const accounts = await db.collection("social_automation_accounts").find(query).sort({ createdAt: -1 }).toArray()

    if (accounts.length === 0) {
      return NextResponse.json({ success: false, message: "No accounts found" }, { status: 404 })
    }

    // Prepare data for Excel
    const excelData = accounts.map((account, index) => ({
      "Account #": account.accountNumber || index + 1,
      Platform: account.platform?.charAt(0).toUpperCase() + account.platform?.slice(1) || "Unknown",
      Username: account.username || "",
      Email: account.email || "",
      Password: account.password || "",
      "First Name": account.profile?.firstName || "",
      "Last Name": account.profile?.lastName || "",
      "Full Name": account.profile?.fullName || "",
      "Birth Date": account.profile?.birthDate || "",
      Gender: account.profile?.gender || "",
      Status: account.status || "",
      Verified: account.verified ? "Yes" : "No",
      "Created Date": account.createdAt ? new Date(account.createdAt).toLocaleDateString() : "",
      "Created Time": account.createdAt ? new Date(account.createdAt).toLocaleTimeString() : "",
    }))

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(excelData)

    // Set column widths
    const columnWidths = [
      { wch: 10 }, // Account #
      { wch: 12 }, // Platform
      { wch: 20 }, // Username
      { wch: 30 }, // Email
      { wch: 15 }, // Password
      { wch: 15 }, // First Name
      { wch: 15 }, // Last Name
      { wch: 25 }, // Full Name
      { wch: 12 }, // Birth Date
      { wch: 8 }, // Gender
      { wch: 10 }, // Status
      { wch: 10 }, // Verified
      { wch: 12 }, // Created Date
      { wch: 12 }, // Created Time
    ]

    worksheet["!cols"] = columnWidths

    // Add worksheet to workbook
    const sheetName =
      platform === "all" ? "All Social Accounts" : `${platform.charAt(0).toUpperCase() + platform.slice(1)} Accounts`
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })

    // Set response headers
    const headers = new Headers()
    headers.set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    headers.set(
      "Content-Disposition",
      `attachment; filename="social-automation-accounts-${platform}-${new Date().toISOString().split("T")[0]}.xlsx"`,
    )

    return new NextResponse(excelBuffer, { headers })
  } catch (error) {
    console.error("Error generating Excel file:", error)
    return NextResponse.json({ success: false, message: "Failed to generate Excel file" }, { status: 500 })
  }
}
