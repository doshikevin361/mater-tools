import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import * as XLSX from "xlsx"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ success: false, message: "User ID is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Get all accounts for the user
    const accounts = await db.collection("temp_accounts").find({ userId }).sort({ createdAt: -1 }).toArray()

    if (accounts.length === 0) {
      return NextResponse.json({ success: false, message: "No accounts found" }, { status: 404 })
    }

    // Prepare data for Excel
    const excelData = accounts.map((account, index) => ({
      "S.No": index + 1,
      Email: account.email,
      "First Name": account.profile.firstName,
      "Last Name": account.profile.lastName,
      "Username 1": account.profile.usernames[0],
      "Username 2": account.profile.usernames[1],
      "Username 3": account.profile.usernames[2],
      Password: account.profile.password,
      "Birth Year": account.profile.birthYear,
      "Birth Month": account.profile.birthMonth,
      "Birth Day": account.profile.birthDay,
      Gender: account.profile.gender,
      Status: account.status,
      "Created At": new Date(account.createdAt).toLocaleString(),
    }))

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(excelData)

    // Set column widths
    const columnWidths = [
      { wch: 8 }, // S.No
      { wch: 25 }, // Email
      { wch: 15 }, // First Name
      { wch: 15 }, // Last Name
      { wch: 20 }, // Username 1
      { wch: 20 }, // Username 2
      { wch: 20 }, // Username 3
      { wch: 15 }, // Password
      { wch: 12 }, // Birth Year
      { wch: 12 }, // Birth Month
      { wch: 12 }, // Birth Day
      { wch: 10 }, // Gender
      { wch: 10 }, // Status
      { wch: 20 }, // Created At
    ]
    worksheet["!cols"] = columnWidths

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Temp Accounts")

    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })

    // Create filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-")
    const filename = `temp-accounts-${timestamp}.xlsx`

    // Return Excel file
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": excelBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error("Error downloading accounts:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to download accounts",
        error: error.message,
      },
      { status: 500 },
    )
  }
}
