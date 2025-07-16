export const revalidate = 0
import { type NextRequest, NextResponse } from "next/server"
import { getVisits, getDownloads } from "@/lib/analytics-data"

function generateChartData(visits: any[], downloads: any[], period: string) {
  const now = new Date()
  const intervals: { name: string; start: number; end: number }[] = []

  switch (period) {
    case "day":
      for (let i = 23; i >= 0; i--) {
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() - i, 59, 59, 999)
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() - i, 0, 0, 0)
        intervals.push({
          name: start.getHours().toString().padStart(2, "0"),
          start: start.getTime(),
          end: end.getTime(),
        })
      }
      break
    case "week":
      const days = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"]
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
        const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
        intervals.push({ name: days[date.getDay()], start: start.getTime(), end: end.getTime() })
      }
      break
    case "month":
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
        const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
        intervals.push({ name: date.getDate().toString(), start: start.getTime(), end: end.getTime() })
      }
      break
    case "all":
      const months = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"]
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const start = new Date(date.getFullYear(), date.getMonth(), 1)
        const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
        intervals.push({ name: months[date.getMonth()], start: start.getTime(), end: end.getTime() })
      }
      break
  }

  return intervals.map(({ name, start, end }) => {
    const visitCount = visits.filter((v) => v.timestamp >= start && v.timestamp <= end).length
    const downloadCount = downloads.filter((d) => d.timestamp >= start && d.timestamp <= end).length
    return { name, visitors: visitCount, downloads: downloadCount }
  })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "day"

    const visitsData = await getVisits(period)
    const downloadsData = await getDownloads(period)

    const chartData = generateChartData(visitsData.visits, downloadsData.downloads, period)

    return NextResponse.json({ data: chartData })
  } catch (error) {
    console.error("Error getting chart data:", error)
    return NextResponse.json({ data: [] })
  }
}
