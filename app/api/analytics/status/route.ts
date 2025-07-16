export const revalidate = 0
import { NextResponse } from "next/server"
import { useKV } from "@/lib/analytics-data"

export async function GET() {
  return NextResponse.json({ useKV })
}
