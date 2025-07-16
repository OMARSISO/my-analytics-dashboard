export const revalidate = 0
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const period = searchParams.get("period") || "day"

  // Получаем реальные данные посещений и скачиваний
  const visitsResponse = await fetch(`${request.nextUrl.origin}/api/analytics/visits?period=${period}`)
  const downloadsResponse = await fetch(`${request.nextUrl.origin}/api/analytics/downloads?period=${period}`)

  const visitsData = await visitsResponse.json()
  const downloadsData = await downloadsResponse.json()

  // Группируем данные по времени в зависимости от периода
  const chartData = generateChartData(visitsData.visits || [], downloadsData.downloads || [], period)

  return NextResponse.json({ data: chartData })
}

function generateChartData(visits: any[], downloads: any[], period: string) {
  const now = new Date()
  const intervals: string[] = []
  let format = ""

  switch (period) {
    case "day":
      // Последние 24 часа по часам
      for (let i = 23; i >= 0; i--) {
        const hour = new Date(now.getTime() - i * 60 * 60 * 1000)
        intervals.push(hour.getHours().toString().padStart(2, "0"))
      }
      format = "hour"
      break

    case "week":
      // Последние 7 дней
      const days = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"]
      for (let i = 6; i >= 0; i--) {
        const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        intervals.push(days[day.getDay()])
      }
      format = "day"
      break

    case "month":
      // Последние 30 дней
      for (let i = 29; i >= 0; i--) {
        const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        intervals.push(day.getDate().toString())
      }
      format = "date"
      break

    case "all":
      // Последние 12 месяцев
      const months = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"]
      for (let i = 11; i >= 0; i--) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1)
        intervals.push(months[month.getMonth()])
      }
      format = "month"
      break
  }

  // Группируем данные по интервалам
  const chartData = intervals.map((interval) => {
    let visitCount = 0
    let downloadCount = 0

    // Подсчитываем посещения для этого интервала
    visits.forEach((visit) => {
      if (matchesInterval(visit, interval, format)) {
        visitCount++
      }
    })

    // Подсчитываем скачивания для этого интервала
    downloads.forEach((download) => {
      if (matchesInterval(download, interval, format)) {
        downloadCount++
      }
    })

    return {
      name: interval,
      visitors: visitCount,
      downloads: downloadCount,
    }
  })

  return chartData
}

function matchesInterval(record: any, interval: string, format: string): boolean {
  const recordDate = new Date(record.date + " " + record.time)
  const now = new Date()

  switch (format) {
    case "hour":
      const hour = recordDate.getHours().toString().padStart(2, "0")
      return hour === interval && recordDate.toDateString() === now.toDateString()

    case "day":
      const days = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"]
      const dayName = days[recordDate.getDay()]
      return dayName === interval && recordDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    case "date":
      const date = recordDate.getDate().toString()
      return date === interval && recordDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    case "month":
      const months = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"]
      const monthName = months[recordDate.getMonth()]
      return monthName === interval && recordDate >= new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())

    default:
      return false
  }
}
