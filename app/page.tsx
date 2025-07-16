"use client"

import { useState } from "react"
import Dashboard from "../components/dashboard"
import FilesPage from "../files-page"
import SettingsPage from "../components/settings-page"
import { Navigation } from "../components/navigation"

export default function Page() {
  const [currentPage, setCurrentPage] = useState("/")

  const renderPage = () => {
    switch (currentPage) {
      case "/":
        return <Dashboard />
      case "/files":
        return <FilesPage />
      case "/settings":
        return <SettingsPage />
      default:
        return <Dashboard />
    }
  }

  return (
    <>
      <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
      <div className="w-full">{renderPage()}</div>
    </>
  )
}
