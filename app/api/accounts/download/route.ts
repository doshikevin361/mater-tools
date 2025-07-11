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

    const accounts = await db.collection("temp_accounts").find({ userId }).sort({ createdAt: -1 }).toArray()

    if (accounts.length === 0) {
      return NextResponse.json({ success: false, message: "No accounts found" }, { status: 404 })
    }

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

    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(excelData)

    const columnWidths = [
      { wch: 8 },
      { wch: 25 },
      { wch: 15 },
      { wch: 15 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 15 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 10 },
      { wch: 10 },
      { wch: 20 },
    ]
    worksheet["!cols"] = columnWidths

    XLSX.utils.book_append_sheet(workbook, worksheet, "Temp Accounts")

    const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })

    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-")
    const filename = `temp-accounts-${timestamp}.xlsx`

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": excelBuffer.length.toString(),
      },
    })
  } catch (error) {
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
