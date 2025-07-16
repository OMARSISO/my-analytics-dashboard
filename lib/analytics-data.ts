import { kv } from "@vercel/kv"

export const useKV = !!process.env.KV_REST_API_URL

// --- Centralized In-Memory Store ---
// We define and export these so all modules share the same instance.
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

export async function getVisits(period: string) {
  const startTime = getStartTime(period)

  if (useKV) {
    const allVisitsRaw = await kv.lrange("visits", 0, -1)
    const allVisits = allVisitsRaw.map((v) => JSON.parse(v as string))
    const filteredVisits = allVisits.filter((visit) => visit.timestamp >= startTime)
    filteredVisits.sort((a, b) => b.timestamp - a.timestamp)
    const uniqueVisitorsCount = await kv.scard("unique_visitors")
    return {
      visits: filteredVisits,
      total: filteredVisits.length,
      uniqueVisitors: uniqueVisitorsCount,
    }
  } else {
    const filteredVisits = inMemoryVisits.filter((visit) => visit.timestamp >= startTime)
    filteredVisits.sort((a, b) => b.timestamp - a.timestamp)
    return {
      visits: filteredVisits,
      total: filteredVisits.length,
      uniqueVisitors: inMemoryUniqueVisitors.size,
    }
  }
}

export async function getDownloads(period: string) {
  const startTime = getStartTime(period)

  if (useKV) {
    const allDownloadsRaw = await kv.lrange("downloads", 0, -1)
    const allDownloads = allDownloadsRaw.map((d) => JSON.parse(d as string))
    const filteredDownloads = allDownloads.filter((download) => download.timestamp >= startTime)
    filteredDownloads.sort((a, b) => b.timestamp - a.timestamp)
    return {
      downloads: filteredDownloads,
      total: filteredDownloads.length,
    }
  } else {
    const filteredDownloads = inMemoryDownloads.filter((download) => download.timestamp >= startTime)
    filteredDownloads.sort((a, b) => b.timestamp - a.timestamp)
    return {
      downloads: filteredDownloads,
      total: filteredDownloads.length,
    }
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
