export const revalidate = 0
import { type NextRequest, NextResponse } from "next/server"
import { getRedisClient } from "@/lib/redis"
import { useKV, inMemoryDownloads, clearInMemoryData } from "@/lib/analytics-data"

const handleInMemoryDownload = (downloadData: any) => {
  inMemoryDownloads.push(downloadData)
  if (inMemoryDownloads.length > 1000) inMemoryDownloads.shift()
}

export async function POST(request: NextRequest) {
  const useKVResult = useKV()
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

    if (useKVResult) {
      try {
        const redis = await getRedisClient()
        if (redis) {
          await redis.lPush("downloads", JSON.stringify(downloadData))
          await redis.lTrim("downloads", 0, 999)
        } else {
          console.warn("Клиент Redis недоступен, используется резервное хранилище в памяти для скачивания.")
          handleInMemoryDownload(downloadData)
        }
      } catch (redisError) {
        console.error("Ошибка операции Redis, используется резервное хранилище в памяти для скачивания:", redisError)
        handleInMemoryDownload(downloadData)
      }
    } else {
      handleInMemoryDownload(downloadData)
    }

    return NextResponse.json({ success: true, data: downloadData })
  } catch (error) {
    console.error("Критическая ошибка в POST /api/analytics/downloads:", error)
    const errorMessage = error instanceof Error ? error.message : "Произошла неизвестная ошибка"
    return NextResponse.json(
      { success: false, error: "Не удалось записать скачивание", details: errorMessage },
      { status: 500 },
    )
  }
}

export async function DELETE() {
  try {
    const redis = await getRedisClient()
    if (useKV() && redis) {
      await redis.del("downloads")
    } else {
      clearInMemoryData()
    }
    return NextResponse.json({ success: true, message: "Все данные о скачиваниях очищены" })
  } catch (error) {
    console.error("Ошибка в DELETE /api/analytics/downloads:", error)
    const errorMessage = error instanceof Error ? error.message : "Произошла неизвестная ошибка"
    return NextResponse.json(
      { success: false, error: "Не удалось удалить скачивания", details: errorMessage },
      { status: 500 },
    )
  }
}

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
