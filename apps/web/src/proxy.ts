import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { SESSION_COOKIE } from '@/modules/identity/core/model/session'

const PRIVATE_PREFIXES = ['/compte', '/bienvenue', '/admin', '/manage', '/habilitations', '/reservations']

const isPrivate = (pathname: string): boolean =>
  PRIVATE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))

export const proxy = (request: NextRequest) => {
  const { pathname, search } = request.nextUrl
  if (!isPrivate(pathname)) return NextResponse.next()
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next()

  const destination = request.nextUrl.clone()
  destination.pathname = '/connexion'
  destination.search = ''
  destination.searchParams.set('next', `${pathname}${search}`)

  return NextResponse.redirect(destination)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'],
}
