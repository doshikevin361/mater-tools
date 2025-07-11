import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import * as XLSX from "xlsx"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const platform = searchParams.get("platform")

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Build query
    const query: any = { userId }
    if (platform && platform !== "all") {
      query.platform = platform
    }

    const accounts = await db.collection("social_automation_accounts").find(query).sort({ createdAt: -1 }).toArray()

    if (accounts.length === 0) {
      return NextResponse.json({ error: "No accounts found" }, { status: 404 })
    }

    // Prepare data for Excel
    const excelData = accounts.map((account) => ({
      Platform: account.platform,
      Email: account.email,
      "First Name": account.firstName,
      "Last Name": account.lastName,
      Username: account.username,
      Password: account.password,
      "Birth Date": account.birthDate ? new Date(account.birthDate).toLocaleDateString() : "",
      Gender: account.gender,
      Status: account.status,
      Country: account.country,
      "Created Date": new Date(account.createdAt).toLocaleDateString(),
    }))

    // Create workbook
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(excelData)

    // Auto-size columns
    const colWidths = [
      { wch: 12 }, // Platform
      { wch: 25 }, // Email
      { wch: 15 }, // First Name
      { wch: 15 }, // Last Name
      { wch: 20 }, // Username
      { wch: 15 }, // Password
      { wch: 12 }, // Birth Date
      { wch: 8 }, // Gender
      { wch: 20 }, // Status
      { wch: 10 }, // Country
      { wch: 12 }, // Created Date
    ]
    worksheet["!cols"] = colWidths

    XLSX.utils.book_append_sheet(workbook, worksheet, "Social Accounts")

    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })

    const filename =
      platform && platform !== "all"
        ? `${platform}_accounts_${new Date().toISOString().split("T")[0]}.xlsx`
        : `social_accounts_${new Date().toISOString().split("T")[0]}.xlsx`

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("Download error:", error)
    return NextResponse.json({ error: "Failed to generate Excel file" }, { status: 500 })
  }
}
