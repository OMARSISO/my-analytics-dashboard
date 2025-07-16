"use client"

import type React from "react"

import { useState, useRef } from "react"
import {
  Upload,
  Download,
  Trash2,
  Edit3,
  Star,
  StarOff,
  File,
  FileText,
  Archive,
  Settings,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Copy,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

// Mock data для файлов
import { recordDownload } from "./components/analytics-tracker"

const mockFiles = [
  {
    id: 1,
    name: "ExLoad_Setup_v2.1.exe",
    originalName: "ExLoad_Setup_v2.1.exe",
    size: "45.2 MB",
    type: "exe",
    uploadDate: "2024-01-16 14:23:45",
    downloads: 1247,
    isMain: true,
    status: "active",
  },
  {
    id: 2,
    name: "ExLoad_Portable.zip",
    originalName: "ExLoad_Portable.zip",
    size: "38.7 MB",
    type: "zip",
    uploadDate: "2024-01-15 09:15:22",
    downloads: 892,
    isMain: false,
    status: "active",
  },
  {
    id: 3,
    name: "ExLoad_Update_v2.0.msi",
    originalName: "ExLoad_Update_v2.0.msi",
    size: "52.1 MB",
    type: "msi",
    uploadDate: "2024-01-14 16:45:33",
    downloads: 634,
    isMain: false,
    status: "active",
  },
  {
    id: 4,
    name: "ExLoad_Beta_v2.2.exe",
    originalName: "ExLoad_Beta_v2.2.exe",
    size: "47.8 MB",
    type: "exe",
    uploadDate: "2024-01-13 11:30:15",
    downloads: 156,
    isMain: false,
    status: "inactive",
  },
  {
    id: 5,
    name: "ExLoad_Docs.zip",
    originalName: "ExLoad_Documentation.zip",
    size: "12.4 MB",
    type: "zip",
    uploadDate: "2024-01-12 08:20:44",
    downloads: 89,
    isMain: false,
    status: "active",
  },
]

const getFileIcon = (type: string) => {
  switch (type) {
    case "exe":
      return <Settings className="h-5 w-5 text-blue-400" />
    case "msi":
      return <File className="h-5 w-5 text-green-400" />
    case "zip":
      return <Archive className="h-5 w-5 text-yellow-400" />
    default:
      return <FileText className="h-5 w-5 text-gray-400" />
  }
}

const getFileTypeColor = (type: string) => {
  switch (type) {
    case "exe":
      return "bg-blue-500/10 text-blue-400 border-blue-500/20"
    case "msi":
      return "bg-green-500/10 text-green-400 border-green-500/20"
    case "zip":
      return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
    default:
      return "bg-gray-500/10 text-gray-400 border-gray-500/20"
  }
}

export default function FilesPage() {
  const [files, setFiles] = useState(mockFiles)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [editingFile, setEditingFile] = useState<number | null>(null)
  const [editName, setEditName] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filteredFiles = files.filter((file) => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === "all" || file.type === filterType
    return matchesSearch && matchesType
  })

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files
    if (uploadedFiles) {
      Array.from(uploadedFiles).forEach((file) => {
        const fileExtension = file.name.split(".").pop()?.toLowerCase()
        if (fileExtension && ["exe", "msi", "zip"].includes(fileExtension)) {
          const newFile = {
            id: Date.now() + Math.random(),
            name: file.name,
            originalName: file.name,
            size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
            type: fileExtension,
            uploadDate: new Date().toLocaleString("ru-RU"),
            downloads: 0,
            isMain: false,
            status: "active" as const,
          }
          setFiles((prev) => [newFile, ...prev])
        }
      })
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleDeleteFile = (id: number) => {
    setFiles((prev) => prev.filter((file) => file.id !== id))
  }

  const handleSetMain = (id: number) => {
    setFiles((prev) =>
      prev.map((file) => ({
        ...file,
        isMain: file.id === id,
      })),
    )
  }

  const handleEditName = (id: number, newName: string) => {
    setFiles((prev) => prev.map((file) => (file.id === id ? { ...file, name: newName } : file)))
    setEditingFile(null)
    setEditName("")
  }

  const startEdit = (file: any) => {
    setEditingFile(file.id)
    setEditName(file.name)
  }

  const totalFiles = files.length
  const totalSize = files.reduce((acc, file) => acc + Number.parseFloat(file.size), 0)
  const totalDownloads = files.reduce((acc, file) => acc + file.downloads, 0)

  const handleDownloadFile = async (file: any) => {
    // Записываем скачивание в аналитику
    await recordDownload(file.name, file.size)

    // Увеличиваем счетчик скачиваний
    setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, downloads: f.downloads + 1 } : f)))

    // Здесь должна быть логика реального скачивания файла
    console.log("Downloading file:", file.name)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Управление файлами
            </h1>
            <p className="text-gray-400 mt-2 text-lg">Загрузка и управление файлами для скачивания</p>
          </div>
          <div className="flex items-center space-x-3">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".exe,.msi,.zip"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all duration-300 hover:scale-105 shadow-lg"
            >
              <Upload className="h-4 w-4 mr-2" />
              Загрузить файл
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm hover:bg-gray-900/70 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Всего файлов</CardTitle>
              <File className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalFiles}</div>
              <p className="text-xs text-gray-500">активных файлов</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm hover:bg-gray-900/70 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Общий размер</CardTitle>
              <Archive className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalSize.toFixed(1)} MB</div>
              <p className="text-xs text-gray-500">на сервере</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm hover:bg-gray-900/70 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Скачивания</CardTitle>
              <Download className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalDownloads.toLocaleString()}</div>
              <p className="text-xs text-gray-500">всего скачиваний</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Поиск файлов..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    {filterType === "all" ? "Все типы" : filterType.toUpperCase()}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-gray-900 border-gray-700">
                  <DropdownMenuItem onClick={() => setFilterType("all")} className="text-gray-300 hover:bg-gray-800">
                    Все типы
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType("exe")} className="text-gray-300 hover:bg-gray-800">
                    EXE файлы
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType("msi")} className="text-gray-300 hover:bg-gray-800">
                    MSI файлы
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType("zip")} className="text-gray-300 hover:bg-gray-800">
                    ZIP архивы
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>

        {/* Files List */}
        <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-white text-xl">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <File className="h-4 w-4 text-white" />
              </div>
              Файлы ({filteredFiles.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-xl border border-gray-700/50">
              {/* Table Header */}
              <div className="bg-gray-800/50 px-6 py-3 border-b border-gray-700/50">
                <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  <div className="col-span-4">Файл</div>
                  <div className="col-span-1">Тип</div>
                  <div className="col-span-1">Размер</div>
                  <div className="col-span-2">Дата загрузки</div>
                  <div className="col-span-1">Скачивания</div>
                  <div className="col-span-1">Статус</div>
                  <div className="col-span-2">Действия</div>
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-700/30 max-h-[600px] overflow-y-auto">
                {filteredFiles.map((file) => (
                  <div
                    key={file.id}
                    className="group px-6 py-4 hover:bg-gray-800/30 transition-all duration-300 relative overflow-hidden"
                  >
                    {/* Gradient line for main file */}
                    {file.isMain && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-yellow-500 to-orange-500" />
                    )}

                    <div className="grid grid-cols-12 gap-4 items-center">
                      {/* File Name */}
                      <div className="col-span-4 flex items-center space-x-3">
                        {getFileIcon(file.type)}
                        <div className="flex-1 min-w-0">
                          {editingFile === file.id ? (
                            <div className="flex items-center space-x-2">
                              <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="h-8 bg-gray-800 border-gray-600 text-white text-sm"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handleEditName(file.id, editName)
                                  } else if (e.key === "Escape") {
                                    setEditingFile(null)
                                    setEditName("")
                                  }
                                }}
                                autoFocus
                              />
                              <Button size="sm" onClick={() => handleEditName(file.id, editName)} className="h-8 px-2">
                                ✓
                              </Button>
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-center space-x-2">
                                <p className="text-white font-medium text-sm truncate">{file.name}</p>
                                {file.isMain && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                              </div>
                              <p className="text-gray-400 text-xs truncate">{file.originalName}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* File Type */}
                      <div className="col-span-1">
                        <Badge className={`${getFileTypeColor(file.type)} border`}>{file.type.toUpperCase()}</Badge>
                      </div>

                      {/* File Size */}
                      <div className="col-span-1">
                        <span className="text-gray-300 text-sm font-mono">{file.size}</span>
                      </div>

                      {/* Upload Date */}
                      <div className="col-span-2">
                        <div className="text-gray-300 text-sm">{file.uploadDate}</div>
                      </div>

                      {/* Downloads */}
                      <div className="col-span-1">
                        <div className="flex items-center space-x-1">
                          <Download className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-300 text-sm">{file.downloads}</span>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="col-span-1">
                        <Badge
                          className={
                            file.status === "active"
                              ? "bg-green-500/10 text-green-400 border-green-500/20"
                              : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                          }
                        >
                          {file.status === "active" ? "Активен" : "Неактивен"}
                        </Badge>
                      </div>

                      {/* Actions */}
                      <div className="col-span-2 flex items-center justify-end space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEdit(file)}
                          className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSetMain(file.id)}
                          className={`h-8 w-8 p-0 hover:bg-gray-700 ${
                            file.isMain ? "text-yellow-500" : "text-gray-400 hover:text-yellow-400"
                          }`}
                        >
                          {file.isMain ? <Star className="h-4 w-4 fill-current" /> : <StarOff className="h-4 w-4" />}
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-gray-900 border-gray-700" align="end">
                            <DropdownMenuItem
                              onClick={() => handleDownloadFile(file)}
                              className="text-gray-300 hover:bg-gray-800"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Скачать
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-gray-300 hover:bg-gray-800">
                              <Copy className="h-4 w-4 mr-2" />
                              Копировать ссылку
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-gray-300 hover:bg-gray-800">
                              <Eye className="h-4 w-4 mr-2" />
                              Просмотр статистики
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-gray-700" />
                            <DropdownMenuItem
                              onClick={() => handleDeleteFile(file.id)}
                              className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Удалить
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Animated background on hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/2 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
                  </div>
                ))}
              </div>

              {filteredFiles.length === 0 && (
                <div className="p-12 text-center">
                  <File className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-400 mb-2">Файлы не найдены</h3>
                  <p className="text-gray-500">
                    {searchQuery ? "Попробуйте изменить поисковый запрос" : "Загрузите первый файл для начала работы"}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
