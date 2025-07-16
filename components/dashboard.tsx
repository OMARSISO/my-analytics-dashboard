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
  RotateCcw,
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
import { AnalyticsTracker } from "./analytics-tracker"

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

// Функция для фильтрации логов по периодам
const getFilteredLogs = (logs: any[], period: string) => {
  const now = new Date()
  let startDate: Date

  switch (period) {
    case "day":
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000) // последние 24 часа
      break
    case "week":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // последние 7 дней
      break
    case "month":
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) // последние 30 дней
      break
    case "all":
    default:
      return logs // показать все записи
  }

  return logs.filter((log) => {
    const logDate = new Date(log.date + " " + log.time)
    return logDate >= startDate
  })
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
  title,
  height = "h-96",
  period,
  setPeriod,
}: {
  data: any[]
  title: string
  height?: string
  period: string
  setPeriod: (period: string) => void
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

  // Используем фиксированный viewBox, график растягивается на всю ширину контейнера
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

  // Определяем какие лейблы показывать на оси X в зависимости от количества точек
  const getVisibleLabels = () => {
    if (data.length <= 12) return data.map((_, i) => i) // Показываем все для года и меньше
    if (data.length <= 24) return data.map((_, i) => i) // Показываем все часы для суток
    if (data.length <= 31) return data.map((_, i) => i) // Показываем все дни для месяца
    return data.map((_, i) => i).filter((_, i) => i % 2 === 0) // Каждый второй только для очень длинных периодов
  }

  const visibleLabelIndices = getVisibleLabels()

  return (
    <div className="space-y-6">
      {/* Period selector and legend */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 rounded-sm bg-blue-500"></div>
            <span className="text-gray-300 font-medium">Посещения</span>
            <span className="text-blue-400 font-semibold">
              {data[data.length - 1]?.visitors?.toLocaleString() || "0"}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 rounded-sm bg-emerald-500"></div>
            <span className="text-gray-300 font-medium">Скачивания</span>
            <span className="text-emerald-400 font-semibold">
              {data[data.length - 1]?.downloads?.toLocaleString() || "0"}
            </span>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-300"
            >
              {periodLabels[period]}
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-gray-900 border-gray-700">
            {Object.entries(periodLabels).map(([key, label]) => (
              <DropdownMenuItem
                key={key}
                onClick={() => setPeriod(key)}
                className="text-gray-300 hover:bg-gray-800 hover:text-white focus:bg-gray-800 focus:text-white"
              >
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Chart container - теперь занимает всю ширину без прокрутки */}
      <div className={`w-full ${height} relative bg-gray-900/30 rounded-xl border border-gray-700/30 overflow-hidden`}>
        <svg className="w-full h-full" viewBox={`0 0 ${viewBoxWidth} 200`} preserveAspectRatio="xMidYMid meet">
          <defs>
            {/* Clean gradients without glow */}
            <linearGradient id="visitorsAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="downloadsAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Y-axis grid and labels */}
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

          {/* X-axis labels - показываем все */}
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

          {/* Visitors area fill */}
          <path
            d={`M ${leftMargin},160 ${data
              .map((item, index) => {
                const x = getXPosition(index)
                const y = getYPosition(item.visitors || 0)
                return `L ${x},${y}`
              })
              .join(" ")} L ${viewBoxWidth - rightMargin},160 Z`}
            fill="url(#visitorsAreaGradient)"
            className={`transition-all duration-1500 ${isVisible ? "opacity-100" : "opacity-0"}`}
          />

          {/* Downloads area fill */}
          <path
            d={`M ${leftMargin},160 ${data
              .map((item, index) => {
                const x = getXPosition(index)
                const y = getYPosition(item.downloads || 0)
                return `L ${x},${y}`
              })
              .join(" ")} L ${viewBoxWidth - rightMargin},160 Z`}
            fill="url(#downloadsAreaGradient)"
            className={`transition-all duration-1500 ${isVisible ? "opacity-100" : "opacity-0"}`}
          />

          {/* Visitors line */}
          <path
            d={`M ${data
              .map((item, index) => {
                const x = getXPosition(index)
                const y = getYPosition(item.visitors || 0)
                return `${x},${y}`
              })
              .join(" L ")}`}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-all duration-2000 ${isVisible ? "opacity-100" : "opacity-0"}`}
            style={{
              strokeDasharray: isVisible ? "none" : "2000",
              strokeDashoffset: isVisible ? "0" : "2000",
            }}
          />

          {/* Downloads line */}
          <path
            d={`M ${data
              .map((item, index) => {
                const x = getXPosition(index)
                const y = getYPosition(item.downloads || 0)
                return `${x},${y}`
              })
              .join(" L ")}`}
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-all duration-2000 ${isVisible ? "opacity-100" : "opacity-0"}`}
            style={{
              strokeDasharray: isVisible ? "none" : "2000",
              strokeDashoffset: isVisible ? "0" : "2000",
            }}
          />

          {/* Visitors data points */}
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

          {/* Downloads data points */}
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

// Компонент для подтверждения сброса статистики
function ResetStatsDialog({ onReset }: { onReset: () => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const [isResetting, setIsResetting] = useState(false)
  const [step, setStep] = useState(1) // 1 - предупреждение, 2 - ввод подтверждения, 3 - финальное подтверждение

  const requiredText = "ОБНУЛИТЬ СТАТИСТИКУ"

  const handleReset = async () => {
    setIsResetting(true)
    try {
      await onReset()
      setIsOpen(false)
      setStep(1)
      setConfirmText("")
    } catch (error) {
      console.error("Error resetting stats:", error)
    } finally {
      setIsResetting(false)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setStep(1)
    setConfirmText("")
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
                <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                Внимание!
              </DialogTitle>
              <DialogDescription className="text-gray-300 space-y-3 pt-4">
                <div>Вы собираетесь полностью обнулить всю статистику:</div>
                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50 space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span>Все посещения будут удалены</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span>Все скачивания будут удалены</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span>Список уникальных посетителей будет очищен</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span>Данные графиков будут сброшены</span>
                  </div>
                </div>
                <div className="text-red-400 font-medium">⚠️ Это действие необратимо!</div>
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
                <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                </div>
                Подтверждение
              </DialogTitle>
              <DialogDescription className="text-gray-300 space-y-4 pt-4">
                <div>Для подтверждения введите точно следующий текст:</div>
                <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/50">
                  <code className="text-red-400 font-mono font-bold text-lg">{requiredText}</code>
                </div>
                <Input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Введите текст подтверждения..."
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-red-500"
                  autoFocus
                />
                {confirmText && confirmText !== requiredText && (
                  <div className="text-red-400 text-sm">❌ Текст не совпадает</div>
                )}
                {confirmText === requiredText && (
                  <div className="text-green-400 text-sm">✅ Текст введен правильно</div>
                )}
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
                onClick={() => setStep(3)}
                disabled={confirmText !== requiredText}
                className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                Далее
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 3 && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-red-500">
                <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center animate-pulse">
                  <Trash2 className="h-5 w-5 text-red-500" />
                </div>
                Последнее предупреждение
              </DialogTitle>
              <DialogDescription className="text-gray-300 space-y-4 pt-4">
                <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/30">
                  <div className="text-red-300 font-medium text-center">
                    🚨 Вы действительно хотите безвозвратно удалить ВСЮ статистику?
                  </div>
                </div>
                <div className="text-center text-gray-400">
                  После нажатия кнопки "Обнулить" все данные будут потеряны навсегда.
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                className="bg-gray-800 border-gray-600 text-gray-300"
              >
                Назад
              </Button>
              <Button
                onClick={handleReset}
                disabled={isResetting}
                className="bg-red-600 hover:bg-red-700 text-white transition-all duration-300 hover:scale-105"
              >
                {isResetting ? (
                  <div className="flex items-center space-x-2">
                    <RotateCcw className="h-4 w-4 animate-spin" />
                    <span>Обнуление...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Trash2 className="h-4 w-4" />
                    <span>Обнулить</span>
                  </div>
                )}
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

  // Состояния для периодов
  const [metricsPeriod, setMetricsPeriod] = useState("day")
  const [chartPeriod, setChartPeriod] = useState("day")
  const [visitorsLogPeriod, setVisitorsLogPeriod] = useState("day")
  const [downloadsLogPeriod, setDownloadsLogPeriod] = useState("day")

  // Состояния для данных
  const [realMetrics, setRealMetrics] = useState({
    visitors: "0",
    visitorsChange: "+0%",
    users: "0",
    usersChange: "+0%",
    downloads: "0",
    downloadsChange: "+0%",
    conversion: "0%",
    conversionChange: "+0%",
  })
  const [realChartData, setRealChartData] = useState([])
  const [realVisitsLog, setRealVisitsLog] = useState([])
  const [realDownloadsLog, setRealDownloadsLog] = useState([])

  // Состояния для расширенных записей
  const [expandedVisitors, setExpandedVisitors] = useState<Set<number>>(new Set())
  const [expandedDownloads, setExpandedDownloads] = useState<Set<number>>(new Set())

  // Функции для загрузки данных
  const loadMetrics = async (period: string) => {
    try {
      const response = await fetch(`/api/analytics/metrics?period=${period}`)
      const data = await response.json()
      setRealMetrics(data)
    } catch (error) {
      console.error("Failed to load metrics:", error)
    }
  }

  const loadChartData = async (period: string) => {
    try {
      const response = await fetch(`/api/analytics/chart?period=${period}`)
      const data = await response.json()
      setRealChartData(data.data || [])
    } catch (error) {
      console.error("Failed to load chart data:", error)
    }
  }

  const loadVisitsLog = async (period: string) => {
    try {
      const response = await fetch(`/api/analytics/visits?period=${period}`)
      const data = await response.json()
      setRealVisitsLog(data.visits || [])
    } catch (error) {
      console.error("Failed to load visits:", error)
    }
  }

  const loadDownloadsLog = async (period: string) => {
    try {
      const response = await fetch(`/api/analytics/downloads?period=${period}`)
      const data = await response.json()
      setRealDownloadsLog(data.downloads || [])
    } catch (error) {
      console.error("Failed to load downloads:", error)
    }
  }

  const toggleVisitorExpanded = (id: number) => {
    setExpandedVisitors((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const toggleDownloadExpanded = (id: number) => {
    setExpandedDownloads((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  // Функция для сброса всей статистики
  const handleResetStats = async () => {
    try {
      // Очищаем данные через API
      await Promise.all([
        fetch("/api/analytics/visits", { method: "DELETE" }),
        fetch("/api/analytics/downloads", { method: "DELETE" }),
      ])

      // Перезагружаем все данные
      await Promise.all([
        loadMetrics(metricsPeriod),
        loadChartData(chartPeriod),
        loadVisitsLog(visitorsLogPeriod),
        loadDownloadsLog(downloadsLogPeriod),
      ])

      console.log("✅ Statistics reset successfully")
    } catch (error) {
      console.error("❌ Error resetting statistics:", error)
    }
  }

  // Загрузка данных при изменении периодов
  useEffect(() => {
    loadMetrics(metricsPeriod)
  }, [metricsPeriod])

  useEffect(() => {
    loadChartData(chartPeriod)
  }, [chartPeriod])

  useEffect(() => {
    loadVisitsLog(visitorsLogPeriod)
  }, [visitorsLogPeriod])

  useEffect(() => {
    loadDownloadsLog(downloadsLogPeriod)
  }, [downloadsLogPeriod])

  // Первоначальная загрузка
  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true)
      await Promise.all([
        loadMetrics(metricsPeriod),
        loadChartData(chartPeriod),
        loadVisitsLog(visitorsLogPeriod),
        loadDownloadsLog(downloadsLogPeriod),
      ])
      setLoading(false)
      setIsLoaded(true)
    }

    loadAllData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center">
        <div className="text-white text-xl">Загрузка статистики...</div>
      </div>
    )
  }

  // Всегда используем реальные данные из API
  const displayVisitsLog = realVisitsLog
  const displayDownloadsLog = realDownloadsLog

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      <AnalyticsTracker />
      <div className="container mx-auto p-6 pt-20 space-y-8">
        {/* Header */}
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
            {/* Селектор для метрик */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="bg-gray-900/50 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white transition-all duration-300 hover:scale-105"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Метрики: {periodLabels[metricsPeriod]}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-gray-900 border-gray-700">
                {Object.entries(periodLabels).map(([key, label]) => (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => setMetricsPeriod(key)}
                    className="text-gray-300 hover:bg-gray-800 hover:text-white focus:bg-gray-800 focus:text-white"
                  >
                    {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Кнопка сброса статистики */}
            <ResetStatsDialog onReset={handleResetStats} />

            {/* Кнопка для тестирования записи посещения */}
            <Button
              onClick={async () => {
                try {
                  const response = await fetch("/api/analytics/visits", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                  })
                  const result = await response.json()
                  console.log("🧪 Test visit result:", result)

                  // Перезагружаем данные
                  await loadVisitsLog(visitorsLogPeriod)
                  await loadMetrics(metricsPeriod)
                } catch (error) {
                  console.error("❌ Test visit failed:", error)
                }
              }}
              variant="outline"
              className="bg-blue-900/20 border-blue-500/30 text-blue-400 hover:bg-blue-900/40 hover:text-blue-300 hover:border-blue-500/50 transition-all duration-300 hover:scale-105"
            >
              <Eye className="h-4 w-4 mr-2" />
              Тест посещения
            </Button>

            <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all duration-300 hover:scale-105 shadow-lg">
              <Activity className="h-4 w-4 mr-2" />
              Экспорт
            </Button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Посещения"
            value={realMetrics.visitors}
            change={realMetrics.visitorsChange}
            changeType="positive"
            icon={<Eye className="h-5 w-5" />}
            gradient="from-blue-500 to-cyan-500"
            delay={100}
          />
          <MetricCard
            title="Уникальные пользователи"
            value={realMetrics.users}
            change={realMetrics.usersChange}
            changeType="positive"
            icon={<Users className="h-5 w-5" />}
            gradient="from-purple-500 to-pink-500"
            delay={200}
          />
          <MetricCard
            title="Скачивания"
            value={realMetrics.downloads}
            change={realMetrics.downloadsChange}
            changeType={realMetrics.downloadsChange.startsWith("+") ? "positive" : "negative"}
            icon={<Download className="h-5 w-5" />}
            gradient="from-emerald-500 to-teal-500"
            delay={300}
          />
          <MetricCard
            title="Конверсия"
            value={realMetrics.conversion}
            change={realMetrics.conversionChange}
            changeType="positive"
            icon={<Target className="h-5 w-5" />}
            gradient="from-orange-500 to-red-500"
            delay={400}
          />
        </div>

        {/* Combined Chart */}
        <Card
          className={`bg-gray-900/50 border-gray-800 backdrop-blur-sm transition-all duration-1000 hover:bg-gray-900/70 hover:shadow-2xl hover:shadow-blue-500/10 ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-3 text-white text-xl">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-white" />
                  </div>
                  Посещения и скачивания
                </CardTitle>
                <p className="text-gray-400 mt-1">Сравнение метрик за выбранный период</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <CombinedChart data={realChartData} title="combined" period={chartPeriod} setPeriod={setChartPeriod} />
          </CardContent>
        </Card>

        {/* Visitors Log */}
        <Card
          className={`bg-gray-900/50 border-gray-800 backdrop-blur-sm transition-all duration-1000 hover:bg-gray-900/70 hover:shadow-2xl hover:shadow-purple-500/10 ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-3 text-white text-xl">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Activity className="h-4 w-4 text-white" />
                  </div>
                  Лог Посещений
                </CardTitle>
                <p className="text-gray-400">Последние посетители сайта</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-300"
                  >
                    {periodLabels[visitorsLogPeriod]}
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-gray-900 border-gray-700">
                  {Object.entries(periodLabels).map(([key, label]) => (
                    <DropdownMenuItem
                      key={key}
                      onClick={() => setVisitorsLogPeriod(key)}
                      className="text-gray-300 hover:bg-gray-800 hover:text-white focus:bg-gray-800 focus:text-white"
                    >
                      {label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-xl border border-gray-700/50">
              <div className="bg-gray-800/50 px-6 py-3 border-b border-gray-700/50">
                <div className="grid grid-cols-7 gap-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  <div>Дата/Время</div>
                  <div>IP Адрес</div>
                  <div>Страна</div>
                  <div>Статус</div>
                  <div>Браузер</div>
                  <div>ОС</div>
                  <div>Действия</div>
                </div>
              </div>

              <div className="divide-y divide-gray-700/30 max-h-[32rem] overflow-y-auto scrollbar-thin">
                {getFilteredLogs(displayVisitsLog, visitorsLogPeriod).map((visitor, index) => (
                  <div
                    key={visitor.id}
                    className="group px-6 py-4 hover:bg-gray-800/30 transition-all duration-300 relative overflow-hidden"
                  >
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 ${
                        visitor.action === "downloaded"
                          ? "bg-gradient-to-b from-emerald-500 to-emerald-600"
                          : "bg-gradient-to-b from-red-500 to-red-600"
                      } opacity-0 group-hover:opacity-100`}
                    />

                    <div className="grid grid-cols-7 gap-4 items-center">
                      <div className="space-y-1">
                        <div className="text-white font-medium text-sm">{visitor.date}</div>
                        <div className="text-gray-400 text-xs font-mono">{visitor.time}</div>
                      </div>

                      <div className="font-mono text-sm text-blue-400 bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-500/20">
                        {visitor.ip}
                      </div>

                      <div className="flex items-center space-x-3">
                        <img
                          src={getCountryFlag(visitor.country) || "/placeholder.svg"}
                          alt={`${visitor.countryName} flag`}
                          className="w-8 h-8 rounded-full object-cover border-2 border-white/10 shadow-lg"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg?height=32&width=32"
                          }}
                        />
                        <div>
                          <div className="text-white text-sm font-medium">{visitor.countryName}</div>
                          <div className="text-gray-400 text-xs uppercase">{visitor.country}</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {Math.random() > 0.3 ? (
                          <>
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            <span className="text-emerald-400 text-sm font-medium">Скачал</span>
                          </>
                        ) : (
                          <>
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            <span className="text-red-400 text-sm font-medium">Ушел</span>
                          </>
                        )}
                      </div>

                      <div className="bg-gray-700/30 px-3 py-1.5 rounded-lg border border-gray-600/30">
                        <div className="text-gray-200 text-sm font-medium">{visitor.browser}</div>
                      </div>

                      <div className="bg-gray-700/30 px-3 py-1.5 rounded-lg border border-gray-600/30">
                        <div className="text-gray-200 text-sm font-medium">{visitor.os}</div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          onClick={() => toggleVisitorExpanded(visitor.id)}
                          className="px-3 py-1 text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-all duration-300"
                        >
                          {expandedVisitors.has(visitor.id) ? "Скрыть" : "Инфо"}
                        </button>
                      </div>
                    </div>

                    {expandedVisitors.has(visitor.id) && (
                      <div className="px-6 py-4 bg-gray-800/20 border-t border-gray-700/30">
                        <div className="grid grid-cols-3 gap-6 text-sm">
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <div>
                              <span className="text-gray-400">Провел на сайте:</span>
                              <div className="text-white font-medium">
                                {Math.floor(Math.random() * 5) + 1} мин {Math.floor(Math.random() * 60)} сек
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            <div>
                              <span className="text-gray-400">Нажал скачивать через:</span>
                              <div className="text-white font-medium">
                                {Math.floor(Math.random() * 3) + 1} мин {Math.floor(Math.random() * 60)} сек
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                            <div>
                              <span className="text-gray-400">Скорость скачивания:</span>
                              <div className="text-white font-medium">{(Math.random() * 10 + 0.5).toFixed(1)} МБ/с</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/2 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
                  </div>
                ))}
              </div>

              <div className="bg-gray-800/30 px-6 py-3 border-t border-gray-700/50">
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <div className="flex items-center space-x-4">
                    <span>Показано: {getFilteredLogs(displayVisitsLog, visitorsLogPeriod).length} записей</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <span className="text-xs">Скачивания</span>
                      <div className="w-2 h-2 rounded-full bg-red-500 ml-3"></div>
                      <span className="text-xs">Покинули сайт</span>
                    </div>
                  </div>
                  <div className="text-xs">Последнее обновление: {new Date().toLocaleTimeString("ru-RU")}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Downloads Log */}
        <Card
          className={`bg-gray-900/50 border-gray-800 backdrop-blur-sm transition-all duration-1000 hover:bg-gray-900/70 hover:shadow-2xl hover:shadow-emerald-500/10 ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-3 text-white text-xl">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                    <Download className="h-4 w-4 text-white" />
                  </div>
                  Лог Скачиваний
                </CardTitle>
                <p className="text-gray-400">Последние скачивания файлов</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-300"
                  >
                    {periodLabels[downloadsLogPeriod]}
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-gray-900 border-gray-700">
                  {Object.entries(periodLabels).map(([key, label]) => (
                    <DropdownMenuItem
                      key={key}
                      onClick={() => setDownloadsLogPeriod(key)}
                      className="text-gray-300 hover:bg-gray-800 hover:text-white focus:bg-gray-800 focus:text-white"
                    >
                      {label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-xl border border-gray-700/50">
              <div className="bg-gray-800/50 px-6 py-3 border-b border-gray-700/50">
                <div className="grid grid-cols-8 gap-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  <div>Дата/Время</div>
                  <div>IP Адрес</div>
                  <div>Страна</div>
                  <div>Файл</div>
                  <div>Размер</div>
                  <div>Браузер</div>
                  <div>ОС</div>
                  <div>Действия</div>
                </div>
              </div>

              <div className="divide-y divide-gray-700/30 max-h-[32rem] overflow-y-auto scrollbar-downloads">
                {getFilteredLogs(displayDownloadsLog, downloadsLogPeriod).map((download, index) => (
                  <div
                    key={download.id}
                    className="group px-6 py-4 hover:bg-gray-800/30 transition-all duration-300 relative overflow-hidden"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 bg-gradient-to-b from-emerald-500 to-emerald-600 opacity-0 group-hover:opacity-100" />

                    <div className="grid grid-cols-8 gap-4 items-center">
                      <div className="space-y-1">
                        <div className="text-white font-medium text-sm">{download.date}</div>
                        <div className="text-gray-400 text-xs font-mono">{download.time}</div>
                      </div>

                      <div className="font-mono text-sm text-blue-400 bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-500/20">
                        {download.ip}
                      </div>

                      <div className="flex items-center space-x-3">
                        <img
                          src={getCountryFlag(download.country) || "/placeholder.svg"}
                          alt={`${download.countryName} flag`}
                          className="w-8 h-8 rounded-full object-cover border-2 border-white/10 shadow-lg"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg?height=32&width=32"
                          }}
                        />
                        <div>
                          <div className="text-white text-sm font-medium">{download.countryName}</div>
                          <div className="text-gray-400 text-xs uppercase">{download.country}</div>
                        </div>
                      </div>

                      <div className="bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                        <div className="text-emerald-300 text-sm font-medium">{download.fileName}</div>
                      </div>

                      <div className="text-gray-300 text-sm font-mono">{download.fileSize}</div>

                      <div className="bg-gray-700/30 px-3 py-1.5 rounded-lg border border-gray-600/30">
                        <div className="text-gray-200 text-sm font-medium">{download.browser}</div>
                      </div>

                      <div className="bg-gray-700/30 px-3 py-1.5 rounded-lg border border-gray-600/30">
                        <div className="text-gray-200 text-sm font-medium">{download.os}</div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          onClick={() => toggleDownloadExpanded(download.id)}
                          className="px-3 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-all duration-300"
                        >
                          {expandedDownloads.has(download.id) ? "Скрыть" : "Инфо"}
                        </button>
                      </div>
                    </div>

                    {expandedDownloads.has(download.id) && (
                      <div className="px-6 py-4 bg-gray-800/20 border-t border-gray-700/30">
                        <div className="grid grid-cols-3 gap-6 text-sm">
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <div>
                              <span className="text-gray-400">Провел на сайте:</span>
                              <div className="text-white font-medium">
                                {Math.floor(Math.random() * 5) + 1} мин {Math.floor(Math.random() * 60)} сек
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            <div>
                              <span className="text-gray-400">Нажал скачивать через:</span>
                              <div className="text-white font-medium">
                                {Math.floor(Math.random() * 3) + 1} мин {Math.floor(Math.random() * 60)} сек
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                            <div>
                              <span className="text-gray-400">Скорость скачивания:</span>
                              <div className="text-white font-medium">{(Math.random() * 10 + 0.5).toFixed(1)} МБ/с</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/2 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
                  </div>
                ))}
              </div>

              <div className="bg-gray-800/30 px-6 py-3 border-t border-gray-700/50">
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <div className="flex items-center space-x-4">
                    <span>Показано: {getFilteredLogs(displayDownloadsLog, downloadsLogPeriod).length} записей</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <span className="text-xs">Успешные скачивания</span>
                    </div>
                  </div>
                  <div className="text-xs">Последнее обновление: {new Date().toLocaleTimeString("ru-RU")}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
