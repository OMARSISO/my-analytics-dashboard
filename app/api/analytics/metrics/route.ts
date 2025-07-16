export const revalidate = 0
import { type NextRequest, NextResponse } from "next/server"
import { getVisits, getDownloads } from "@/lib/analytics-data"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const period = searchParams.get("period") || "day"

  try {
    const visitsData = await getVisits(period)
    const downloadsData = await getDownloads(period)

    const totalVisits = visitsData.total || 0
    const totalDownloads = downloadsData.total || 0
    const uniqueUsersCount = visitsData.uniqueVisitors || 0

    const conversion = totalVisits > 0 ? ((totalDownloads / totalVisits) * 100).toFixed(1) : "0.0"

    // Mock changes
    const visitorsChange = "+" + (Math.random() * 20 + 5).toFixed(1) + "%"
    const usersChange = "+" + (Math.random() * 15 + 3).toFixed(1) + "%"
    const downloadsChange = (Math.random() > 0.7 ? "-" : "+") + (Math.random() * 10 + 1).toFixed(1) + "%"
    const conversionChange = "+" + (Math.random() * 3 + 0.5).toFixed(1) + "%"

    return NextResponse.json({
      visitors: totalVisits.toLocaleString(),
      visitorsChange,
      users: uniqueUsersCount.toLocaleString(),
      usersChange,
      downloads: totalDownloads.toLocaleString(),
      downloadsChange,
      conversion: conversion + "%",
      conversionChange,
    })
  } catch (error) {
    console.error("Error getting metrics:", error)
    return NextResponse.json(
      { error: "Failed to get metrics" },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  }
}
