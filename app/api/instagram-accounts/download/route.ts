import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import * as XLSX from "xlsx"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    const { db } = await connectToDatabase()
    const accounts = await db.collection("social_accounts").find({ userId }).sort({ createdAt: -1 }).toArray()

    if (accounts.length === 0) {
      return NextResponse.json({ success: false, message: "No Instagram accounts found" }, { status: 404 })
    }

    // Prepare data for Excel
    const excelData = accounts.map((account, index) => ({
      "Account #": account.accountNumber || index + 1,
      Platform: "Instagram",
      Email: account.email || "",
      Username: account.username || "",
      Password: account.password || "",
      "First Name": account.profile?.firstName || "",
      "Last Name": account.profile?.lastName || "",
      "Full Name": account.profile?.fullName || "",
      "Birth Date": account.profile?.birthDate || "",
      Gender: account.profile?.gender || "",
      Status: account.status || "",
      Verified: account.verified ? "Yes" : "No",
      "Profile URL": account.creationResult?.profileUrl || "",
      "Creation Message": account.creationResult?.message || "",
      "Creation Error": account.creationResult?.error || "",
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
      { wch: 30 }, // Email
      { wch: 20 }, // Username
      { wch: 15 }, // Password
      { wch: 15 }, // First Name
      { wch: 15 }, // Last Name
      { wch: 25 }, // Full Name
      { wch: 12 }, // Birth Date
      { wch: 8 }, // Gender
      { wch: 10 }, // Status
      { wch: 10 }, // Verified
      { wch: 40 }, // Profile URL
      { wch: 30 }, // Creation Message
      { wch: 30 }, // Creation Error
      { wch: 12 }, // Created Date
      { wch: 12 }, // Created Time
    ]

    worksheet["!cols"] = columnWidths

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Instagram Accounts")

    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })

    // Set response headers
    const headers = new Headers()
    headers.set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    headers.set(
      "Content-Disposition",
      `attachment; filename="instagram-accounts-${new Date().toISOString().split("T")[0]}.xlsx"`,
    )

    return new NextResponse(excelBuffer, { headers })
  } catch (error) {
    console.error("Error generating Instagram accounts Excel file:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to generate Excel file",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
