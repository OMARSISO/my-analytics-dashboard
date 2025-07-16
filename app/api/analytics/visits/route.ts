export const revalidate = 0
import { type NextRequest, NextResponse } from "next/server"
import { getRedisClient } from "@/lib/redis"
import { useKV, inMemoryVisits, inMemoryUniqueVisitors, clearInMemoryData } from "@/lib/analytics-data"

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

function parseUserAgent(userAgent: string) {
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
    return { country: "RU", countryName: "Россия (Локально)" }
  }
  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/`, { headers: { "User-Agent": "ExLoad Analytics/1.0" } })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    if (data.error) throw new Error(data.reason || "IP API Error")
    return { country: data.country_code || "XX", countryName: data.country_name || "Неизвестно" }
  } catch (error) {
    console.error("Error getting country from IP:", error)
    return { country: "XX", countryName: "Неизвестно" }
  }
}

const redisClient = await getRedisClient()

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

    const redis = redisClient
    if (useKV() && redis) {
      const recentVisitKey = `visit:${cleanIP}`
      const hasVisitedRecently = await redis.get(recentVisitKey)
      if (hasVisitedRecently) {
        return NextResponse.json({ success: true, message: "Recent visit found - not recorded", duplicate: true })
      }
      await redis.lPush("visits", JSON.stringify(visitData))
      await redis.lTrim("visits", 0, 999)
      await redis.sAdd("unique_visitors", cleanIP)
      await redis.set(recentVisitKey, "true", { EX: 24 * 60 * 60 }) // 24 hours expiration
    } else {
      const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000
      const recentVisit = inMemoryVisits.find((visit) => visit.ip === cleanIP && visit.timestamp > twentyFourHoursAgo)
      if (recentVisit) {
        return NextResponse.json({ success: true, message: "Recent visit found - not recorded", duplicate: true })
      }
      inMemoryVisits.push(visitData)
      if (inMemoryVisits.length > 1000) inMemoryVisits.shift()
      inMemoryUniqueVisitors.add(cleanIP)
    }
    return NextResponse.json({ success: true, data: visitData })
  } catch (error) {
    console.error("Error in POST /api/analytics/visits:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json(
      { success: false, error: "Failed to record visit", details: errorMessage },
      { status: 500 },
    )
  }
}

export async function DELETE() {
  try {
    const redis = redisClient
    if (useKV() && redis) {
      await redis.del(["visits", "unique_visitors"])
    } else {
      clearInMemoryData()
    }
    return NextResponse.json({ success: true, message: "All visits data cleared" })
  } catch (error) {
    console.error("Error in DELETE /api/analytics/visits:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json(
      { success: false, error: "Failed to delete visits", details: errorMessage },
      { status: 500 },
    )
  }
}
