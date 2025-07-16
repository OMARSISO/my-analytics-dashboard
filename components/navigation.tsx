"use client"

import { Home, Files, Settings } from "lucide-react"

const navItems = [
  { id: "/", icon: Home, label: "Главная" },
  { id: "/files", icon: Files, label: "Файлы" },
  { id: "/settings", icon: Settings, label: "Настройки" },
]

interface NavigationProps {
  currentPage: string
  onPageChange: (page: string) => void
}

export function Navigation({ currentPage, onPageChange }: NavigationProps) {
  return (
    <div className="fixed left-6 top-1/2 transform -translate-y-1/2 z-50 flex flex-col items-center space-y-2 bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-2">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = currentPage === item.id

        return (
          <button
            key={item.id}
            onClick={() => onPageChange(item.id)}
            className={`group relative p-3 rounded-lg transition-all duration-300 ${
              isActive
                ? "bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-lg"
                : "text-gray-400 hover:text-white hover:bg-gray-800/50"
            }`}
            title={item.label}
          >
            <Icon className="h-5 w-5" />

            {/* Tooltip */}
            <div className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded border border-gray-700 whitespace-nowrap">
                {item.label}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
