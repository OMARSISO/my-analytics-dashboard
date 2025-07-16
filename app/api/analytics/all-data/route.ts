export const revalidate = 0
import { type NextRequest, NextResponse } from "next/server"
import { getVisits, getDownloads, generateChartData } from "@/lib/analytics-data"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "day"

    // 1. Получаем сырые данные
    const visitsData = await getVisits(period)
    const downloadsData = await getDownloads(period)

    // 2. Считаем метрики
    const totalVisits = visitsData.total || 0
    const totalDownloads = downloadsData.total || 0
    const uniqueUsersCount = visitsData.uniqueVisitors || 0
    const conversion = totalVisits > 0 ? ((totalDownloads / totalVisits) * 100).toFixed(1) : "0.0"

    // Mock changes
    const visitorsChange = "+" + (Math.random() * 20 + 5).toFixed(1) + "%"
    const usersChange = "+" + (Math.random() * 15 + 3).toFixed(1) + "%"
    const downloadsChange = (Math.random() > 0.7 ? "-" : "+") + (Math.random() * 10 + 1).toFixed(1) + "%"
    const conversionChange = "+" + (Math.random() * 3 + 0.5).toFixed(1) + "%"

    const metrics = {
      visitors: totalVisits.toLocaleString(),
      visitorsChange,
      users: uniqueUsersCount.toLocaleString(),
      usersChange,
      downloads: totalDownloads.toLocaleString(),
      downloadsChange,
      conversion: conversion + "%",
      conversionChange,
    }

    // 3. Генерируем данные для графика
    const chartData = generateChartData(visitsData.visits, downloadsData.downloads, period)

    // 4. Возвращаем все единым объектом
    return NextResponse.json({
      metrics,
      chartData,
      visitsLog: visitsData.visits,
      downloadsLog: downloadsData.downloads,
    })
  } catch (error) {
    console.error("Error getting all-data:", error)
    return NextResponse.json(
      {
        metrics: { visitors: "0", users: "0", downloads: "0", conversion: "0.0%" },
        chartData: [],
        visitsLog: [],
        downloadsLog: [],
      },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  }
}
