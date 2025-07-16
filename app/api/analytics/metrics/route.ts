import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const period = searchParams.get("period") || "day"

  try {
    // Получаем данные из других API
    const visitsResponse = await fetch(`${request.nextUrl.origin}/api/analytics/visits?period=${period}`)
    const downloadsResponse = await fetch(`${request.nextUrl.origin}/api/analytics/downloads?period=${period}`)

    const visitsData = await visitsResponse.json()
    const downloadsData = await downloadsResponse.json()

    const totalVisits = visitsData.total || 0
    const totalDownloads = downloadsData.total || 0
    const uniqueUsersCount = visitsData.uniqueVisitors || 0

    // Расчет конверсии
    const conversion = totalVisits > 0 ? ((totalDownloads / totalVisits) * 100).toFixed(1) : "0.0"

    // Расчет изменений (заглушка, в реальности сравнивать с предыдущим периодом)
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
    return NextResponse.json({
      visitors: "0",
      visitorsChange: "+0%",
      users: "0",
      usersChange: "+0%",
      downloads: "0",
      downloadsChange: "+0%",
      conversion: "0%",
      conversionChange: "+0%",
    })
  }
}
