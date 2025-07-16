export const revalidate = 0
import { type NextRequest, NextResponse } from "next/server"
import { kv } from "@vercel/kv"
import { getDownloads } from "@/lib/analytics-data"

// --- Fallback: In-memory store for environments without Vercel KV ---
let inMemoryDownloads: any[] = []
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
    const body = await request.json()
    const { fileName, fileSize } = body
    const userAgent = request.headers.get("user-agent") || ""
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "127.0.0.1"
    const cleanIP = ip.split(",")[0].trim()
    const { browser, os } = parseUserAgent(userAgent)
    const { country, countryName } = await getCountryFromIP(cleanIP)
    const downloadData = {
      id: Date.now() + Math.random(),
      date: new Date().toISOString().split("T")[0],
      time: new Date().toLocaleTimeString("ru-RU"),
      ip: cleanIP,
      country,
      countryName,
      action: "downloaded",
      browser,
      os,
      fileName,
      fileSize,
      timestamp: Date.now(),
    }

    if (useKV) {
      await kv.lpush("downloads", JSON.stringify(downloadData))
      await kv.ltrim("downloads", 0, 999)
    } else {
      inMemoryDownloads.push(downloadData)
      if (inMemoryDownloads.length > 1000) inMemoryDownloads.shift()
    }

    return NextResponse.json({ success: true, data: downloadData })
  } catch (error) {
    return NextResponse.json({ error: "Failed to record download" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "day"
    const data = await getDownloads(period)
    return NextResponse.json({ ...data, period })
  } catch (error) {
    return NextResponse.json({ downloads: [], total: 0, period: "day" })
  }
}

export async function DELETE() {
  try {
    if (useKV) {
      await kv.del("downloads")
    } else {
      inMemoryDownloads = []
    }
    return NextResponse.json({ success: true, message: "All downloads data cleared" })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete downloads" }, { status: 500 })
  }
}
