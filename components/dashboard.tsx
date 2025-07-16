"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  TrendingUp,
  Users,
  Download,
  Target,
  Eye,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  ChevronDown,
  Trash2,
  AlertTriangle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
// import { AnalyticsTracker } from "./analytics-tracker"

// Кастомные стили для красивого скролла
const scrollbarStyles = `
.scrollbar-thin::-webkit-scrollbar {
width: 8px;
}
.scrollbar-thin::-webkit-scrollbar-track {
background: rgba(31, 41, 55, 0.2);
border-radius: 10px;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
background: rgba(168, 85, 247, 0.5);
border-radius: 10px;
transition: all 0.3s ease;
}
.scrollbar-thin::-webkit-scrollbar-thumb:hover {
background: rgba(168, 85, 247, 0.7);
}
.scrollbar-downloads::-webkit-scrollbar {
width: 8px;
}
.scrollbar-downloads::-webkit-scrollbar-track {
background: rgba(31, 41, 55, 0.2);
border-radius: 10px;
}
.scrollbar-downloads::-webkit-scrollbar-thumb {
background: rgba(16, 185, 129, 0.5);
border-radius: 10px;
transition: all 0.3s ease;
}
.scrollbar-downloads::-webkit-scrollbar-thumb:hover {
background: rgba(16, 185, 129, 0.7);
}
`

// Добавить стили в head
if (typeof document !== "undefined") {
  const styleElement = document.createElement("style")
  styleElement.textContent = scrollbarStyles
  document.head.appendChild(styleElement)
}

// Заменить функцию getFlagPath на getCountryFlag с полными URL
const getCountryFlag = (countryCode: string) => {
  const flags = {
    RU: "https://flagcdn.com/w40/ru.png",
    US: "https://flagcdn.com/w40/us.png",
    DE: "https://flagcdn.com/w40/de.png",
    JP: "https://flagcdn.com/w40/jp.png",
    GB: "https://flagcdn.com/w40/gb.png",
    FR: "https://flagcdn.com/w40/fr.png",
    CA: "https://flagcdn.com/w40/ca.png",
    AU: "https://flagcdn.com/w40/au.png",
  }
  return flags[countryCode] || "https://flagcdn.com/w40/xx.png"
}

const periodLabels = {
  day: "Сутки",
  week: "Неделя",
  month: "Месяц",
  all: "Все время",
}

interface MetricCardProps {
  title: string
  value: string
  change: string
  changeType: "positive" | "negative"
  icon: React.ReactNode
  gradient: string
  delay?: number
}

function MetricCard({ title, value, change, changeType, icon, gradient, delay = 0 }: MetricCardProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <Card
      className={`relative overflow-hidden bg-gray-900/50 border-gray-800 backdrop-blur-sm transition-all duration-700 hover:bg-gray-900/70 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/10 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5`} />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <CardTitle className="text-sm font-medium text-gray-400">{title}</CardTitle>
        <div
          className={`h-10 w-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg`}
        >
          {icon}
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="text-3xl font-bold text-white mb-2">{value}</div>
        <div className="flex items-center text-sm">
          {changeType === "positive" ? (
            <ArrowUpRight className="h-4 w-4 text-emerald-400 mr-1" />
          ) : (
            <ArrowDownRight className="h-4 w-4 text-red-400 mr-1" />
          )}
          <span className={changeType === "positive" ? "text-emerald-400" : "text-red-400"}>{change}</span>
          <span className="text-gray-500 ml-1">за месяц</span>
        </div>
      </CardContent>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 -translate-x-full hover:translate-x-full transition-transform duration-1000" />
    </Card>
  )
}

function CombinedChart({
  data,
  height = "h-96",
}: {
  data: any[]
  height?: string
}) {
  const [isVisible, setIsVisible] = useState(false)
  const [hoveredPoint, setHoveredPoint] = useState<{ index: number; type: "visitors" | "downloads" } | null>(null)

  useEffect(() => {
    setIsVisible(true)
  }, [data])

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-96 flex items-center justify-center bg-gray-900/30 rounded-xl border border-gray-700/30">
        <div className="text-gray-400">Нет данных для отображения</div>
      </div>
    )
  }

  const maxVisitors = Math.max(...data.map((d) => d.visitors || 0))
  const maxDownloads = Math.max(...data.map((d) => d.downloads || 0))
  const maxValue = Math.max(maxVisitors, maxDownloads, 1) // минимум 1 чтобы избежать деления на 0

  const viewBoxWidth = 800
  const leftMargin = 60
  const rightMargin = 40
  const chartAreaWidth = viewBoxWidth - leftMargin - rightMargin

  const getYPosition = (value: number) => {
    return 40 + (1 - value / maxValue) * 120
  }

  const getXPosition = (index: number) => {
    return leftMargin + (index / Math.max(data.length - 1, 1)) * chartAreaWidth
  }

  const getVisibleLabels = () => {
    if (data.length <= 12) return data.map((_, i) => i)
    if (data.length <= 24) return data.map((_, i) => i)
    if (data.length <= 31) return data.map((_, i) => i)
    return data.map((_, i) => i).filter((_, i) => i % 2 === 0)
  }

  const visibleLabelIndices = getVisibleLabels()

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-8">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 rounded-sm bg-blue-500"></div>
          <span className="text-gray-300 font-medium">Посещения</span>
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 rounded-sm bg-emerald-500"></div>
          <span className="text-gray-300 font-medium">Скачивания</span>
        </div>
      </div>

      <div className={`w-full ${height} relative bg-gray-900/30 rounded-xl border border-gray-700/30 overflow-hidden`}>
        <svg className="w-full h-full" viewBox={`0 0 ${viewBoxWidth} 200`} preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="visitorsAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="downloadsAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = 40 + (1 - ratio) * 120
            const value = Math.round(maxValue * ratio)
            return (
              <g key={i}>
                <line
                  x1={leftMargin - 5}
                  y1={y}
                  x2={viewBoxWidth - rightMargin}
                  y2={y}
                  stroke="rgb(75, 85, 99)"
                  strokeWidth="0.5"
                  opacity="0.4"
                />
                <text
                  x={leftMargin - 10}
                  y={y + 3}
                  fill="rgb(156, 163, 175)"
                  fontSize="11"
                  textAnchor="end"
                  className="font-mono"
                >
                  {value.toLocaleString()}
                </text>
              </g>
            )
          })}

          {visibleLabelIndices.map((index) => {
            const x = getXPosition(index)
            return (
              <text
                key={index}
                x={x}
                y="185"
                fill="rgb(156, 163, 175)"
                fontSize="9"
                textAnchor="middle"
                className="font-medium"
              >
                {data[index]?.name || ""}
              </text>
            )
          })}

          <path
            d={`M ${leftMargin},160 ${data
              .map((item, index) => `L ${getXPosition(index)},${getYPosition(item.visitors || 0)}`)
              .join(" ")} L ${viewBoxWidth - rightMargin},160 Z`}
            fill="url(#visitorsAreaGradient)"
            className={`transition-all duration-1500 ${isVisible ? "opacity-100" : "opacity-0"}`}
          />

          <path
            d={`M ${leftMargin},160 ${data
              .map((item, index) => `L ${getXPosition(index)},${getYPosition(item.downloads || 0)}`)
              .join(" ")} L ${viewBoxWidth - rightMargin},160 Z`}
            fill="url(#downloadsAreaGradient)"
            className={`transition-all duration-1500 ${isVisible ? "opacity-100" : "opacity-0"}`}
          />

          <path
            d={`M ${data.map((item, index) => `${getXPosition(index)},${getYPosition(item.visitors || 0)}`).join(" L ")}`}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-all duration-2000 ${isVisible ? "opacity-100" : "opacity-0"}`}
            style={{ strokeDasharray: isVisible ? "none" : "2000", strokeDashoffset: isVisible ? "0" : "2000" }}
          />

          <path
            d={`M ${data.map((item, index) => `${getXPosition(index)},${getYPosition(item.downloads || 0)}`).join(" L ")}`}
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-all duration-2000 ${isVisible ? "opacity-100" : "opacity-0"}`}
            style={{ strokeDasharray: isVisible ? "none" : "2000", strokeDashoffset: isVisible ? "0" : "2000" }}
          />

          {data.map((item, index) => {
            const x = getXPosition(index)
            const y = getYPosition(item.visitors || 0)
            const isHovered = hoveredPoint?.index === index && hoveredPoint?.type === "visitors"
            return (
              <g key={`visitors-${index}`}>
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? "5" : "3"}
                  fill="#3b82f6"
                  className={`transition-all duration-300 cursor-pointer ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-0"}`}
                  style={{ animationDelay: `${index * 50}ms` }}
                  onMouseEnter={() => setHoveredPoint({ index, type: "visitors" })}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
                {isHovered && (
                  <g>
                    <rect
                      x={x - 45}
                      y={y - 65}
                      width="90"
                      height="50"
                      rx="8"
                      fill="rgba(15, 23, 42, 0.95)"
                      stroke="rgba(59, 130, 246, 0.3)"
                      strokeWidth="1"
                      filter="drop-shadow(0 4px 12px rgba(0, 0, 0, 0.4))"
                    />
                    <text x={x} y={y - 50} fill="#94a3b8" fontSize="10" textAnchor="middle" className="font-medium">
                      {data[index]?.name || ""}
                    </text>
                    <text x={x} y={y - 38} fill="#3b82f6" fontSize="11" textAnchor="middle" className="font-medium">
                      Посещения: {(item.visitors || 0).toLocaleString()}
                    </text>
                    <text x={x} y={y - 26} fill="#10b981" fontSize="11" textAnchor="middle" className="font-medium">
                      Скачивания: {(item.downloads || 0).toLocaleString()}
                    </text>
                  </g>
                )}
              </g>
            )
          })}

          {data.map((item, index) => {
            const x = getXPosition(index)
            const y = getYPosition(item.downloads || 0)
            const isHovered = hoveredPoint?.index === index && hoveredPoint?.type === "downloads"
            return (
              <g key={`downloads-${index}`}>
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? "5" : "3"}
                  fill="#10b981"
                  className={`transition-all duration-300 cursor-pointer ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-0"}`}
                  style={{ animationDelay: `${index * 50 + 25}ms` }}
                  onMouseEnter={() => setHoveredPoint({ index, type: "downloads" })}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
                {isHovered && (
                  <g>
                    <rect
                      x={x - 45}
                      y={y - 65}
                      width="90"
                      height="50"
                      rx="8"
                      fill="rgba(15, 23, 42, 0.95)"
                      stroke="rgba(16, 185, 129, 0.3)"
                      strokeWidth="1"
                      filter="drop-shadow(0 4px 12px rgba(0, 0, 0, 0.4))"
                    />
                    <text x={x} y={y - 50} fill="#94a3b8" fontSize="10" textAnchor="middle" className="font-medium">
                      {data[index]?.name || ""}
                    </text>
                    <text x={x} y={y - 38} fill="#3b82f6" fontSize="11" textAnchor="middle" className="font-medium">
                      Посещения: {(item.visitors || 0).toLocaleString()}
                    </text>
                    <text x={x} y={y - 26} fill="#10b981" fontSize="11" textAnchor="middle" className="font-medium">
                      Скачивания: {(item.downloads || 0).toLocaleString()}
                    </text>
                  </g>
                )}
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

function ResetStatsDialog({ onReset }: { onReset: () => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const [isResetting, setIsResetting] = useState(false)
  const [step, setStep] = useState(1)

  const requiredText = "ОБНУЛИТЬ СТАТИСТИКУ"

  const handleReset = async () => {
    setIsResetting(true)
    try {
      await onReset()
      setIsOpen(false)
    } catch (error) {
      console.error("Error resetting stats:", error)
    } finally {
      setIsResetting(false)
      setStep(1)
      setConfirmText("")
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setTimeout(() => {
      setStep(1)
      setConfirmText("")
    }, 300)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="bg-red-900/20 border-red-500/30 text-red-400 hover:bg-red-900/40 hover:text-red-300 hover:border-red-500/50 transition-all duration-300 hover:scale-105"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Обнулить статистику
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-gray-700 max-w-md">
        {step === 1 && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-red-400">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Внимание!
              </DialogTitle>
              <DialogDescription className="text-gray-300 space-y-3 pt-4">
                <div>Вы собираетесь полностью обнулить всю статистику. Это действие необратимо!</div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-3">
              <Button variant="outline" onClick={handleClose} className="bg-gray-800 border-gray-600 text-gray-300">
                Отмена
              </Button>
              <Button
                onClick={() => setStep(2)}
                className="bg-red-600 hover:bg-red-700 text-white transition-all duration-300"
              >
                Продолжить
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 2 && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-yellow-400">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Подтверждение
              </DialogTitle>
              <DialogDescription className="text-gray-300 space-y-4 pt-4">
                <div>
                  Для подтверждения введите: <code className="text-red-400 font-mono">{requiredText}</code>
                </div>
                <Input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white"
                  autoFocus
                />
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="bg-gray-800 border-gray-600 text-gray-300"
              >
                Назад
              </Button>
              <Button
                onClick={handleReset}
                disabled={confirmText !== requiredText || isResetting}
                className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
              >
                {isResetting ? "Обнуление..." : "Обнулить"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default function Dashboard() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState("day")
  const [useKV, setUseKV] = useState(true) // Assume true initially to avoid flash of warning

  const [metrics, setMetrics] = useState({
    visitors: "0",
    visitorsChange: "+0%",
    users: "0",
    usersChange: "+0%",
    downloads: "0",
    downloadsChange: "+0%",
    conversion: "0%",
    conversionChange: "+0%",
  })
  const [chartData, setChartData] = useState([])
  const [visitsLog, setVisitsLog] = useState([])
  const [downloadsLog, setDownloadsLog] = useState([])

  const [expandedVisitors, setExpandedVisitors] = useState<Set<number>>(new Set())
  const [expandedDownloads, setExpandedDownloads] = useState<Set<number>>(new Set())

  const loadAllData = async (currentPeriod: string) => {
    setLoading(true)
    try {
      const [allDataRes, statusRes] = await Promise.all([
        fetch(`/api/analytics/all-data?period=${currentPeriod}`),
        fetch(`/api/analytics/status`),
      ])

      // Проверяем ответы ПЕРЕД парсингом JSON
      if (!allDataRes.ok) {
        const errorText = await allDataRes.text()
        throw new Error(`Failed to fetch analytics data (${allDataRes.status}): ${errorText}`)
      }
      if (!statusRes.ok) {
        const errorText = await statusRes.text()
        throw new Error(`Failed to fetch status (${statusRes.status}): ${errorText}`)
      }

      const allData = await allDataRes.json()
      const statusData = await statusRes.json()

      setMetrics(allData.metrics)
      setChartData(allData.chartData || [])
      setVisitsLog(allData.visitsLog || [])
      setDownloadsLog(allData.downloadsLog || [])
      setUseKV(statusData.useKV)
    } catch (error) {
      console.error("Failed to load analytics data:", error)
      // Устанавливаем пустые значения при ошибке, чтобы UI не ломался
      setMetrics({
        visitors: "0",
        visitorsChange: "+0%",
        users: "0",
        usersChange: "+0%",
        downloads: "0",
        downloadsChange: "+0%",
        conversion: "0%",
        conversionChange: "+0%",
      })
      setChartData([])
      setVisitsLog([])
      setDownloadsLog([])
    } finally {
      setLoading(false)
      setIsLoaded(true)
    }
  }

  useEffect(() => {
    loadAllData(period)
  }, [period])

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod)
  }

  const handleResetStats = async () => {
    try {
      await Promise.all([
        fetch("/api/analytics/visits", { method: "DELETE" }),
        fetch("/api/analytics/downloads", { method: "DELETE" }),
      ])
      await loadAllData(period)
      console.log("✅ Statistics reset successfully")
    } catch (error) {
      console.error("❌ Error resetting statistics:", error)
    }
  }

  const handleTestVisit = async () => {
    try {
      await fetch("/api/analytics/visits", { method: "POST" })
      await loadAllData(period)
    } catch (error) {
      console.error("❌ Test visit failed:", error)
    }
  }

  const toggleVisitorExpanded = (id: number) => {
    setExpandedVisitors((prev) => {
      const newSet = new Set(prev)
      newSet.has(id) ? newSet.delete(id) : newSet.add(id)
      return newSet
    })
  }

  const toggleDownloadExpanded = (id: number) => {
    setExpandedDownloads((prev) => {
      const newSet = new Set(prev)
      newSet.has(id) ? newSet.delete(id) : newSet.add(id)
      return newSet
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      {/* <AnalyticsTracker /> */}
      <div className="container mx-auto p-6 pt-20 space-y-8">
        {!useKV && isLoaded && (
          <div className="p-4 mb-6 bg-yellow-900/20 border border-yellow-500/30 rounded-lg text-yellow-300">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold">Режим Демонстрации</h3>
                <p className="text-sm text-yellow-400/80">
                  Хранилище Vercel KV не настроено. Данные хранятся в памяти и будут сброшены после перезагрузки. Для
                  полноценной работы и сохранения статистики, пожалуйста,{" "}
                  <a
                    href="https://vercel.com/docs/storage/vercel-kv/quickstart"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-medium hover:text-yellow-200"
                  >
                    подключите KV хранилище
                  </a>{" "}
                  в настройках вашего проекта Vercel.
                </p>
              </div>
            </div>
          </div>
        )}

        <div
          className={`flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 transition-all duration-1000 ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
          }`}
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              ExLoad Panel
            </h1>
            <p className="text-gray-400 mt-2 text-lg">Упрощенная версия панели</p>
          </div>
          <div className="flex items-center space-x-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="bg-gray-900/50 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  {periodLabels[period]}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-gray-900 border-gray-700">
                {Object.entries(periodLabels).map(([key, label]) => (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => handlePeriodChange(key)}
                    className="text-gray-300 hover:bg-gray-800"
                  >
                    {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <ResetStatsDialog onReset={handleResetStats} />
            <Button
              onClick={handleTestVisit}
              variant="outline"
              className="bg-blue-900/20 border-blue-500/30 text-blue-400 hover:bg-blue-900/40"
            >
              <Eye className="h-4 w-4 mr-2" />
              Тест посещения
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="bg-gray-900/50 border-gray-800 h-36">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="h-4 bg-gray-700 rounded w-24"></div>
                  <div className="h-10 w-10 rounded-xl bg-gray-700"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-gray-700 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-700 rounded w-1/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Посещения"
              value={metrics.visitors}
              change={metrics.visitorsChange}
              changeType={(metrics.visitorsChange || "").startsWith("+") ? "positive" : "negative"}
              icon={<Eye className="h-5 w-5" />}
              gradient="from-blue-500 to-cyan-500"
              delay={100}
            />
            <MetricCard
              title="Уникальные пользователи"
              value={metrics.users}
              change={metrics.usersChange}
              changeType={(metrics.usersChange || "").startsWith("+") ? "positive" : "negative"}
              icon={<Users className="h-5 w-5" />}
              gradient="from-purple-500 to-pink-500"
              delay={200}
            />
            <MetricCard
              title="Скачивания"
              value={metrics.downloads}
              change={metrics.downloadsChange}
              changeType={(metrics.downloadsChange || "").startsWith("+") ? "positive" : "negative"}
              icon={<Download className="h-5 w-5" />}
              gradient="from-emerald-500 to-teal-500"
              delay={300}
            />
            <MetricCard
              title="Конверсия"
              value={metrics.conversion}
              change={metrics.conversionChange}
              changeType={(metrics.conversionChange || "").startsWith("+") ? "positive" : "negative"}
              icon={<Target className="h-5 w-5" />}
              gradient="from-orange-500 to-red-500"
              delay={400}
            />
          </div>
        )}

        <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-white text-xl">
              <TrendingUp className="h-4 w-4 text-white" />
              Посещения и скачивания
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CombinedChart data={chartData} />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-8">
          <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white text-xl">
                <Activity className="h-4 w-4 text-white" />
                Лог Посещений
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-xl border border-gray-700/50">
                <div className="bg-gray-800/50 px-6 py-3 border-b border-gray-700/50 text-xs font-medium text-gray-400 uppercase">
                  <div className="grid grid-cols-5 gap-4">
                    <span>Дата/Время</span>
                    <span>IP/Страна</span>
                    <span>Статус</span>
                    <span>Браузер/ОС</span>
                    <span></span>
                  </div>
                </div>
                <div className="divide-y divide-gray-700/30 max-h-[32rem] overflow-y-auto scrollbar-thin">
                  {visitsLog.map((visitor: any) => (
                    <div key={visitor.id}>
                      <div className="px-6 py-4 grid grid-cols-5 gap-4 items-center">
                        <div className="space-y-1">
                          <div className="text-white font-medium text-sm">{visitor.date}</div>
                          <div className="text-gray-400 text-xs font-mono">{visitor.time}</div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <img
                            src={getCountryFlag(visitor.country) || "/placeholder.svg"}
                            alt={visitor.countryName}
                            className="w-6 h-6 rounded-full object-cover border-2 border-white/10"
                          />
                          <span className="font-mono text-sm text-blue-400">{visitor.ip}</span>
                        </div>
                        <div>
                          <span className="text-gray-300 text-sm font-medium">Посещение</span>
                        </div>
                        <div>
                          <div className="text-gray-200 text-sm">{visitor.browser}</div>
                          <div className="text-gray-400 text-xs">{visitor.os}</div>
                        </div>
                        <div className="flex justify-end">
                          <button
                            onClick={() => toggleVisitorExpanded(visitor.id)}
                            className="px-3 py-1 text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg"
                          >
                            {expandedVisitors.has(visitor.id) ? "Скрыть" : "Инфо"}
                          </button>
                        </div>
                      </div>
                      {expandedVisitors.has(visitor.id) && (
                        <div className="px-6 py-4 bg-gray-800/20 border-t border-gray-700/30 text-sm">
                          Детальная информация...
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white text-xl">
                <Download className="h-4 w-4 text-white" />
                Лог Скачиваний
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-xl border border-gray-700/50">
                <div className="bg-gray-800/50 px-6 py-3 border-b border-gray-700/50 text-xs font-medium text-gray-400 uppercase">
                  <div className="grid grid-cols-4 gap-4">
                    <span>Дата/Время</span>
                    <span>IP/Страна</span>
                    <span>Файл</span>
                    <span>Размер</span>
                  </div>
                </div>
                <div className="divide-y divide-gray-700/30 max-h-[32rem] overflow-y-auto scrollbar-downloads">
                  {downloadsLog.map((download: any) => (
                    <div key={download.id} className="px-6 py-4 grid grid-cols-4 gap-4 items-center">
                      <div className="space-y-1">
                        <div className="text-white font-medium text-sm">{download.date}</div>
                        <div className="text-gray-400 text-xs font-mono">{download.time}</div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <img
                          src={getCountryFlag(download.country) || "/placeholder.svg"}
                          alt={download.countryName}
                          className="w-6 h-6 rounded-full object-cover border-2 border-white/10"
                        />
                        <span className="font-mono text-sm text-blue-400">{download.ip}</span>
                      </div>
                      <div className="text-emerald-300 text-sm font-medium truncate">{download.fileName}</div>
                      <div className="text-gray-300 text-sm font-mono">{download.fileSize}</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="fixed bottom-4 right-4 text-xs font-mono text-gray-600 bg-gray-900/50 px-2 py-1 rounded-md border border-gray-700/50">
        v0.1.5
      </div>
    </div>
  )
}
