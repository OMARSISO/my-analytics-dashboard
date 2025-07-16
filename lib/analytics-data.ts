import { getRedisClient } from "./redis"

export const useKV = () => !!process.env.REDIS_URL

// --- Centralized In-Memory Store ---
export let inMemoryVisits: any[] = []
export let inMemoryDownloads: any[] = []
export let inMemoryUniqueVisitors: Set<string> = new Set()

export function clearInMemoryData() {
  inMemoryVisits = []
  inMemoryDownloads = []
  inMemoryUniqueVisitors = new Set()
}
// ------------------------------------

function getStartTime(period: string): number {
  const now = Date.now()
  switch (period) {
    case "day":
      return now - 24 * 60 * 60 * 1000
    case "week":
      return now - 7 * 24 * 60 * 60 * 1000
    case "month":
      return now - 30 * 24 * 60 * 60 * 1000
    default:
      return 0
  }
}

async function getVisitsFromMemory(startTime: number) {
  const filteredVisits = inMemoryVisits.filter((visit) => visit.timestamp >= startTime)
  filteredVisits.sort((a, b) => b.timestamp - a.timestamp)
  return {
    visits: filteredVisits,
    total: filteredVisits.length,
    uniqueVisitors: inMemoryUniqueVisitors.size,
  }
}

async function getDownloadsFromMemory(startTime: number) {
  const filteredDownloads = inMemoryDownloads.filter((download) => download.timestamp >= startTime)
  filteredDownloads.sort((a, b) => b.timestamp - a.timestamp)
  return {
    downloads: filteredDownloads,
    total: filteredDownloads.length,
  }
}

export async function getVisits(period: string) {
  const startTime = getStartTime(period)
  const redis = await getRedisClient()

  if (useKV() && redis) {
    try {
      const allVisitsRaw = await redis.lRange("visits", 0, -1)
      const allVisits = allVisitsRaw.map((v) => JSON.parse(v))
      const filteredVisits = allVisits.filter((visit) => visit.timestamp >= startTime)
      filteredVisits.sort((a, b) => b.timestamp - a.timestamp)
      const uniqueVisitorsCount = await redis.sCard("unique_visitors")
      return {
        visits: filteredVisits,
        total: filteredVisits.length,
        uniqueVisitors: uniqueVisitorsCount,
      }
    } catch (error) {
      console.error("Ошибка Redis в getVisits:", error)
      return getVisitsFromMemory(startTime) // Резервный вариант
    }
  } else {
    return getVisitsFromMemory(startTime)
  }
}

export async function getDownloads(period: string) {
  const startTime = getStartTime(period)
  const redis = await getRedisClient()

  if (useKV() && redis) {
    try {
      const allDownloadsRaw = await redis.lRange("downloads", 0, -1)
      const allDownloads = allDownloadsRaw.map((d) => JSON.parse(d))
      const filteredDownloads = allDownloads.filter((download) => download.timestamp >= startTime)
      filteredDownloads.sort((a, b) => b.timestamp - a.timestamp)
      return {
        downloads: filteredDownloads,
        total: filteredDownloads.length,
      }
    } catch (error) {
      console.error("Ошибка Redis в getDownloads:", error)
      return getDownloadsFromMemory(startTime) // Резервный вариант
    }
  } else {
    return getDownloadsFromMemory(startTime)
  }
}

export function generateChartData(visits: any[], downloads: any[], period: string) {
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
