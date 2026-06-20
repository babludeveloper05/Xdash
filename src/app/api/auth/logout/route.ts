import { NextResponse } from 'next/server'

/**
 * POST /api/auth/logout
 * Clears the JWT cookie.
 */
export async function POST() {
  const response = NextResponse.json({ ok: true })
  response.cookies.delete('delta-token')
  return response
}
