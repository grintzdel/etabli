import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export const proxy = (_request: NextRequest) => NextResponse.next()

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'],
}
