"use client"

import { useEffect, useRef } from "react"

export function AnalyticsTracker() {
  const hasSentRequest = useRef(false)

  useEffect(() => {
    // Этот флаг предотвращает повторный вызов в React.StrictMode в режиме разработки
    if (hasSentRequest.current) {
      return
    }
    hasSentRequest.current = true

    // Записываем посещение при загрузке страницы
    const recordVisit = async () => {
      try {
        const response = await fetch("/api/analytics/visits", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        })

        // Проверяем, успешен ли ответ, ПЕРЕД тем как парсить JSON
        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`API Error (${response.status}): ${errorText}`)
        }

        const result = await response.json()
        console.log("📊 Analytics response:", result)

        if (result.duplicate) {
          console.log("❌ Duplicate visit detected - not recorded:", result)
        } else if (result.success) {
          console.log("✅ Visit recorded successfully:", result.data)
        } else {
          console.log("⚠️ Unexpected response:", result)
        }
      } catch (error) {
        console.error("Failed to record visit:", error)
      }
    }

    recordVisit()
  }, [])

  return null // Компонент невидимый
}

// Функция для записи скачивания
export const recordDownload = async (fileName: string, fileSize: string) => {
  try {
    const response = await fetch("/api/analytics/downloads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName,
        fileSize,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API Error on download (${response.status}): ${errorText}`)
    }
  } catch (error) {
    console.error("Failed to record download:", error)
  }
}

// Функция для очистки данных (для тестирования)
export const clearAnalyticsData = async () => {
  try {
    await Promise.all([
      fetch("/api/analytics/visits", { method: "DELETE" }),
      fetch("/api/analytics/downloads", { method: "DELETE" }),
    ])
    console.log("Analytics data cleared")
  } catch (error) {
    console.error("Failed to clear analytics data:", error)
  }
}
