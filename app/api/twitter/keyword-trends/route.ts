import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Mock trending keywords data
    const trends = [
      { keyword: "#Bitcoin", volume: 125000, trend: "up", price: 2.5, change: "+15%" },
      { keyword: "#AI", volume: 98000, trend: "up", price: 2.2, change: "+8%" },
      { keyword: "#Crypto", volume: 87000, trend: "down", price: 1.8, change: "-5%" },
      { keyword: "#NFT", volume: 65000, trend: "stable", price: 1.5, change: "0%" },
      { keyword: "#Web3", volume: 54000, trend: "up", price: 1.75, change: "+12%" },
      { keyword: "#Blockchain", volume: 45000, trend: "up", price: 1.6, change: "+6%" },
      { keyword: "#DeFi", volume: 38000, trend: "down", price: 1.4, change: "-3%" },
      { keyword: "#Metaverse", volume: 32000, trend: "stable", price: 1.3, change: "0%" },
    ]

    return NextResponse.json({
      success: true,
      trends,
    })
  } catch (error) {
    console.error("Keyword trends fetch error:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch keyword trends" }, { status: 500 })
  }
}
