import { kv } from "@vercel/kv"

const useKV = !!process.env.KV_REST_API_URL

// --- Fallback: In-memory store for environments without Vercel KV ---
const inMemoryVisits: any[] = []
const inMemoryDownloads: any[] = []
const inMemoryUniqueVisitors: Set<string> = new Set()
// --------------------------------------------------------------------

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
