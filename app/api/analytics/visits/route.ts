import { type NextRequest, NextResponse } from "next/server"
import { kv } from "@vercel/kv"

// --- Fallback: In-memory store for environments without Vercel KV ---
let inMemoryVisits: any[] = []
let inMemoryUniqueVisitors: Set<string> = new Set()
// --------------------------------------------------------------------

const useKV = !!process.env.KV_REST_API_URL

function parseUserAgent(userAgent: string) {
  const browsers = [
    { name: "Chrome", pattern: /Chrome\/(\d+)/ },
    { name: "Firefox", pattern: /Firefox\/(\d+)/ },
    { name: "Safari", pattern: /Safari\/(\d+)/ },
    { name: "Edge", pattern: /Edg\/(\d+)/ },
    { name: "Opera", pattern: /OPR\/(\d+)/ },
  ]
  const os = [
    { name: "Windows 11", pattern: /Windows NT 10\.0.*Win64/ },
    { name: "Windows 10", pattern: /Windows NT 10\.0/ },
    { name: "macOS", pattern: /Mac OS X/ },
    { name: "Linux", pattern: /Linux/ },
    { name: "Android", pattern: /Android/ },
    { name: "iOS", pattern: /iPhone|iPad/ },
  ]
  let browserName = "Unknown",
    osName = "Unknown"
  for (const browser of browsers) {
    const match = userAgent.match(browser.pattern)
    if (match) {
      browserName = `${browser.name} ${match[1]}`
      break
    }
  }
  for (const system of os) {
    if (system.pattern.test(userAgent)) {
      osName = system.name
      break
    }
  }
  return { browser: browserName, os: osName }
}

async function getCountryFromIP(ip: string) {
  if (ip === "127.0.0.1" || ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172.")) {
    return { country: "RU", countryName: "Россия" }
  }
  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/`, { headers: { "User-Agent": "ExLoad Analytics/1.0" } })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    if (data.error) throw new Error(data.reason || "IP API Error")
    return { country: data.country_code || "RU", countryName: data.country_name || "Россия" }
  } catch (error) {
    console.error("Error getting country from IP:", error)
    const fallbackCountries = [
      { country: "RU", countryName: "Россия" },
      { country: "US", countryName: "США" },
      { country: "DE", countryName: "Германия" },
      { country: "GB", countryName: "Великобритания" },
    ]
    return fallbackCountries[Math.floor(Math.random() * fallbackCountries.length)]
  }
}

export async function POST(request: NextRequest) {
  try {
    const userAgent = request.headers.get("user-agent") || ""
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "127.0.0.1"
    const cleanIP = ip.split(",")[0].trim()
    const { browser, os } = parseUserAgent(userAgent)
    const { country, countryName } = await getCountryFromIP(cleanIP)
    const visitData = {
      id: Date.now() + Math.random(),
      date: new Date().toISOString().split("T")[0],
      time: new Date().toLocaleTimeString("ru-RU"),
      ip: cleanIP,
      country,
      countryName,
      action: "visited",
      browser,
      os,
      timestamp: Date.now(),
    }

    if (useKV) {
      console.log(`[Vercel KV] 🔍 Processing visit from IP: ${cleanIP}`)
      const recentVisitKey = `visit:${cleanIP}`
      const hasVisitedRecently = await kv.get(recentVisitKey)
      if (hasVisitedRecently) {
        console.log(`[Vercel KV] ❌ Recent visit found from IP: ${cleanIP} - skipping`)
        return NextResponse.json({ success: true, message: "Recent visit found - not recorded", duplicate: true })
      }
      await kv.lpush("visits", JSON.stringify(visitData))
      await kv.ltrim("visits", 0, 999)
      await kv.sadd("unique_visitors", cleanIP)
      await kv.set(recentVisitKey, "true", { ex: 24 * 60 * 60 })
      const totalVisits = await kv.llen("visits")
      const uniqueVisitorsCount = await kv.scard("unique_visitors")
      console.log(`[Vercel KV] ✅ New visit recorded. Total visits: ${totalVisits}. Unique: ${uniqueVisitorsCount}`)
      return NextResponse.json({ success: true, data: visitData, totalVisits, uniqueVisitors: uniqueVisitorsCount })
    } else {
      console.log(`[In-Memory] 🔍 Processing visit from IP: ${cleanIP}`)
      const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000
      const recentVisit = inMemoryVisits.find((visit) => visit.ip === cleanIP && visit.timestamp > twentyFourHoursAgo)
      if (recentVisit) {
        console.log(`[In-Memory] ❌ Recent visit found from IP: ${cleanIP} - skipping`)
        return NextResponse.json({ success: true, message: "Recent visit found - not recorded", duplicate: true })
      }
      inMemoryVisits.push(visitData)
      if (inMemoryVisits.length > 1000) inMemoryVisits.shift()
      inMemoryUniqueVisitors.add(cleanIP)
      console.log(
        `[In-Memory] ✅ New visit recorded. Total visits: ${inMemoryVisits.length}. Unique: ${inMemoryUniqueVisitors.size}`,
      )
      return NextResponse.json({
        success: true,
        data: visitData,
        totalVisits: inMemoryVisits.length,
        uniqueVisitors: inMemoryUniqueVisitors.size,
      })
    }
  } catch (error) {
    const storageType = useKV ? "Vercel KV" : "In-Memory"
    console.error(`[${storageType}] ❌ Error recording visit:`, error)
    return NextResponse.json({ error: "Failed to record visit" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "day"
    const now = Date.now()
    let startTime: number
    switch (period) {
      case "day":
        startTime = now - 24 * 60 * 60 * 1000
        break
      case "week":
        startTime = now - 7 * 24 * 60 * 60 * 1000
        break
      case "month":
        startTime = now - 30 * 24 * 60 * 60 * 1000
        break
      default:
        startTime = 0
    }

    if (useKV) {
      const allVisitsRaw = await kv.lrange("visits", 0, -1)
      const allVisits = allVisitsRaw.map((v) => JSON.parse(v as string))
      const filteredVisits = allVisits.filter((visit) => visit.timestamp >= startTime)
      filteredVisits.sort((a, b) => b.timestamp - a.timestamp)
      const uniqueVisitorsCount = await kv.scard("unique_visitors")
      console.log(
        `[Vercel KV] 📊 GET visits: Total stored: ${allVisits.length}, Filtered: ${filteredVisits.length}, Unique IPs: ${uniqueVisitorsCount}`,
      )
      return NextResponse.json({
        visits: filteredVisits,
        total: filteredVisits.length,
        uniqueVisitors: uniqueVisitorsCount,
        period,
      })
    } else {
      const filteredVisits = inMemoryVisits.filter((visit) => visit.timestamp >= startTime)
      filteredVisits.sort((a, b) => b.timestamp - a.timestamp)
      console.log(
        `[In-Memory] 📊 GET visits: Total stored: ${inMemoryVisits.length}, Filtered: ${filteredVisits.length}, Unique IPs: ${inMemoryUniqueVisitors.size}`,
      )
      return NextResponse.json({
        visits: filteredVisits,
        total: filteredVisits.length,
        uniqueVisitors: inMemoryUniqueVisitors.size,
        period,
      })
    }
  } catch (error) {
    const storageType = useKV ? "Vercel KV" : "In-Memory"
    console.error(`[${storageType}] ❌ Error getting visits:`, error)
    return NextResponse.json({ visits: [], total: 0, uniqueVisitors: 0, period: "day" })
  }
}

export async function DELETE() {
  try {
    if (useKV) {
      await kv.del("visits", "unique_visitors")
      console.log("[Vercel KV] 🗑️ All visits data cleared")
    } else {
      inMemoryVisits = []
      inMemoryUniqueVisitors = new Set()
      console.log("[In-Memory] 🗑️ All visits data cleared")
    }
    return NextResponse.json({ success: true, message: "All visits data cleared" })
  } catch (error) {
    const storageType = useKV ? "Vercel KV" : "In-Memory"
    console.error(`[${storageType}] ❌ Error deleting visits:`, error)
    return NextResponse.json({ error: "Failed to delete visits" }, { status: 500 })
  }
}
