export const revalidate = 0
import { type NextRequest, NextResponse } from "next/server"
import { getRedisClient } from "@/lib/redis"
import { useKV, inMemoryVisits, inMemoryUniqueVisitors, clearInMemoryData } from "@/lib/analytics-data"

const handleInMemoryVisit = (visitData: any) => {
  const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000
  const recentVisit = inMemoryVisits.find((visit) => visit.ip === visitData.ip && visit.timestamp > twentyFourHoursAgo)
  if (recentVisit) {
    return { duplicate: true }
  }
  inMemoryVisits.push(visitData)
  if (inMemoryVisits.length > 1000) inMemoryVisits.shift()
  inMemoryUniqueVisitors.add(visitData.ip)
  return { duplicate: false }
}

const parseUserAgent = (userAgent: string) => {
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

export async function POST(request: NextRequest) {
  const useKVResult = useKV()
  const userAgent = request.headers.get("user-agent") || ""
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "127.0.0.1"
  const cleanIP = ip.split(",")[0].trim()

  console.log(`[VISIT POST] Received request for IP: ${cleanIP}`)

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

  const redisClient = await getRedisClient()

  if (useKVResult && redisClient) {
    try {
      const recentVisitKey = `visit:${cleanIP}`
      console.log(`[VISIT POST] Checking for recent visit with key: ${recentVisitKey}`)
      const hasVisitedRecently = await redisClient.get(recentVisitKey)

      if (hasVisitedRecently) {
        console.log(`[VISIT POST] Duplicate visit detected for IP ${cleanIP}. Key value: ${hasVisitedRecently}`)
        return NextResponse.json({ success: true, message: "Recent visit found - not recorded", duplicate: true })
      }

      console.log(`[VISIT POST] No recent visit found for IP ${cleanIP}. Recording new visit.`)
      await redisClient.lPush("visits", JSON.stringify(visitData))
      await redisClient.lTrim("visits", 0, 999)
      await redisClient.sAdd("unique_visitors", cleanIP)
      await redisClient.set(recentVisitKey, "true", { EX: 24 * 60 * 60 })
      console.log(`[VISIT POST] Successfully recorded visit and set TTL key for IP ${cleanIP}.`)
    } catch (redisError) {
      console.error("[VISIT POST] Redis error, falling back to in-memory:", redisError)
      const { duplicate } = handleInMemoryVisit(visitData)
      if (duplicate) {
        return NextResponse.json({ success: true, message: "Recent visit found - not recorded", duplicate: true })
      }
    }
  } else {
    console.warn("[VISIT POST] Redis client not available, using in-memory store.")
    const { duplicate } = handleInMemoryVisit(visitData)
    if (duplicate) {
      return NextResponse.json({ success: true, message: "Recent visit found - not recorded", duplicate: true })
    }
  }

  return NextResponse.json({ success: true, data: visitData })
}

export async function DELETE() {
  const useKVResult = useKV()
  console.log("[VISIT DELETE] Received request to clear statistics.")
  try {
    const redis = await getRedisClient()
    if (useKVResult && redis) {
      console.log("[VISIT DELETE] Redis client available. Scanning for visit keys...")
      const stream = redis.scanIterator({
        TYPE: "string",
        MATCH: "visit:*",
        COUNT: 100,
      })

      const keysToDelete: string[] = ["visits", "unique_visitors"]
      for await (const key of stream) {
        keysToDelete.push(key)
      }

      console.log(`[VISIT DELETE] Found ${keysToDelete.length - 2} visit IP keys to delete.`)
      console.log("[VISIT DELETE] Keys to be deleted:", keysToDelete)

      if (keysToDelete.length > 0) {
        await redis.del(keysToDelete)
        console.log("[VISIT DELETE] Successfully deleted keys from Redis.")
      } else {
        console.log("[VISIT DELETE] No keys found to delete.")
      }
    }

    // Also clear in-memory data as a fallback
    clearInMemoryData()
    console.log("[VISIT DELETE] In-memory data cleared.")

    return NextResponse.json({ success: true, message: "Все данные о посещениях и флаги IP очищены" })
  } catch (error) {
    console.error("[VISIT DELETE] Error during deletion:", error)
    const errorMessage = error instanceof Error ? error.message : "Произошла неизвестная ошибка"
    return NextResponse.json(
      { success: false, error: "Не удалось удалить посещения", details: errorMessage },
      { status: 500 },
    )
  }
}
