import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const subject = req.nextUrl.searchParams.get('subject') || 'all'
  const res = await fetch(`http://localhost:8000/api/content/videos?subject=${subject}`)
  const data = await res.json()
  return NextResponse.json(data)
}
