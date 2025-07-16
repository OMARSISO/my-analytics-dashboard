import type React from "react"
import { AnalyticsTracker } from "../components/analytics-tracker"
import { Suspense } from "react"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      <Suspense fallback={<div>Loading...</div>}>
        <AnalyticsTracker />
        {children}
      </Suspense>
    </div>
  )
}


import './globals.css'

export const metadata = {
      generator: 'v0.dev'
    };
