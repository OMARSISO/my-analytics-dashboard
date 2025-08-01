export const revalidate = 0
import { NextResponse } from "next/server"

export async function GET() {
  const isKvConfigured = !!process.env.REDIS_URL
  return NextResponse.json({ useKV: isKvConfigured })
}
