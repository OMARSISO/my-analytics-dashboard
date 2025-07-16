"use client"

import { useState } from "react"
import { Globe, Shield, AlertTriangle, CheckCircle, Bot, Skull, Eye, EyeOff, Info } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function SettingsPage() {
  const [siteStatus, setSiteStatus] = useState<"open" | "closed">("closed")
  const [isChanging, setIsChanging] = useState(false)

  const handleStatusChange = async () => {
    setIsChanging(true)
    // Имитация API запроса
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setSiteStatus(siteStatus === "open" ? "closed" : "open")
    setIsChanging(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      <div className="container mx-auto p-6 pt-20 space-y-8">
        {/* Header */}
        <div className="flex flex-col space-y-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Настройки сайта
            </h1>
            <p className="text-gray-400 mt-2 text-lg">Управление доступностью и безопасностью</p>
          </div>
        </div>

        {/* Site Status Card */}
        <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm hover:bg-gray-900/70 transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-white text-xl">
              <div
                className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                  siteStatus === "open"
                    ? "bg-gradient-to-br from-emerald-500 to-teal-500"
                    : "bg-gradient-to-br from-red-500 to-rose-500"
                }`}
              >
                <Globe className="h-4 w-4 text-white" />
              </div>
              Статус сайта
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Status */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-800/30 border border-gray-700/50">
              <div className="flex items-center space-x-4">
                <div className={`relative ${siteStatus === "open" ? "text-emerald-400" : "text-red-400"}`}>
                  {siteStatus === "open" ? <Eye className="h-6 w-6" /> : <EyeOff className="h-6 w-6" />}
                  <div
                    className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
                      siteStatus === "open" ? "bg-emerald-500" : "bg-red-500"
                    } animate-pulse`}
                  />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">
                    Сайт {siteStatus === "open" ? "открыт" : "закрыт"}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {siteStatus === "open"
                      ? "Доступен для всех пользователей и ботов"
                      : "Доступен только для администраторов и пользователям, прошедшим по рекламной ссылке. Прямой доступ - закрыт."}
                  </p>
                </div>
              </div>
              <Badge
                className={`px-4 py-2 text-sm font-medium ${
                  siteStatus === "open"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-red-500/10 text-red-400 border-red-500/20"
                } border`}
              >
                {siteStatus === "open" ? "ОТКРЫТ" : "ЗАКРЫТ"}
              </Badge>
            </div>

            {/* Toggle Button */}
            <div className="flex justify-center items-center space-x-4">
              <Button
                onClick={() => window.open("/", "_blank")}
                variant="outline"
                className="px-6 py-3 text-lg font-semibold bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-300 hover:scale-105"
              >
                <Globe className="h-5 w-5 mr-2" />
                Перейти на сайт
              </Button>

              <Button
                onClick={handleStatusChange}
                disabled={isChanging}
                className={`px-8 py-3 text-lg font-semibold transition-all duration-300 hover:scale-105 shadow-lg ${
                  siteStatus === "open"
                    ? "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
                    : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                }`}
              >
                {isChanging ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Изменение...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    {siteStatus === "open" ? (
                      <>
                        <Shield className="h-5 w-5" />
                        <span>Закрыть сайт</span>
                      </>
                    ) : (
                      <>
                        <Globe className="h-5 w-5" />
                        <span>Открыть сайт</span>
                      </>
                    )}
                  </div>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Warning Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Closed Site Info */}
          <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm hover:bg-gray-900/70 transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-white" />
                </div>
                Закрытый режим
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <Info className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-blue-300 font-medium mb-2">Преимущества:</h4>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>• Защита от поисковых ботов</li>
                    <li>• Файлы остаются в безопасности</li>
                    <li>• Домен не попадает в индексы</li>
                    <li>• Контролируемый доступ</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-800/50">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
                <span className="text-gray-300 text-sm">Рекомендуется для долгосрочного использования</span>
              </div>
            </CardContent>
          </Card>

          {/* Open Site Warning */}
          <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm hover:bg-gray-900/70 transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-white" />
                </div>
                Открытый режим
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-red-300 font-medium mb-2">Риски:</h4>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>• Доступ для поисковых ботов</li>
                    <li>• Быстрое обнаружение файлов</li>
                    <li>• Возможная блокировка домена</li>
                    <li>• Индексация в поисковиках</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-800/50">
                  <Bot className="h-5 w-5 text-yellow-400" />
                  <span className="text-gray-300 text-sm">Боты могут найти и скачать файлы</span>
                </div>

                <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-800/50">
                  <Skull className="h-5 w-5 text-red-400" />
                  <span className="text-gray-300 text-sm">Файл может быстро "умереть"</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status History */}
        <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm hover:bg-gray-900/70 transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-white">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Globe className="h-4 w-4 text-white" />
              </div>
              История изменений
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { time: "16.01.2024 14:23", action: "Сайт закрыт", status: "closed", user: "Администратор" },
                { time: "15.01.2024 09:15", action: "Сайт открыт", status: "open", user: "Администратор" },
                { time: "14.01.2024 16:45", action: "Сайт закрыт", status: "closed", user: "Администратор" },
              ].map((entry, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-800/30 border border-gray-700/30"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-2 h-2 rounded-full ${entry.status === "open" ? "bg-emerald-500" : "bg-red-500"}`}
                    />
                    <div>
                      <span className="text-white font-medium">{entry.action}</span>
                      <p className="text-gray-400 text-sm">{entry.user}</p>
                    </div>
                  </div>
                  <span className="text-gray-400 text-sm font-mono">{entry.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
