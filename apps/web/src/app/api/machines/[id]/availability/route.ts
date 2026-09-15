import { NextResponse } from 'next/server'

import type { BookingFailure } from '@/modules/booking/core/model/booking'
import { BookingFailureCode, FAILURE_MESSAGES } from '@/modules/booking/core/model/booking'
import { bookingPort } from '@/server/container'
import { readSessionToken } from '@/server/session'

type RouteContext = { readonly params: Promise<{ readonly id: string }> }

const STATUS_BY_CODE: Partial<Readonly<Record<BookingFailureCode, number>>> = {
  UNAUTHORIZED: 401,
  MACHINE_NOT_BOOKABLE: 404,
}

const refuse = (failure: BookingFailure) => NextResponse.json(failure, { status: STATUS_BY_CODE[failure.code] ?? 502 })

export const GET = async (request: Request, { params }: RouteContext) => {
  const token = await readSessionToken()
  if (token === null) {
    return refuse({ code: BookingFailureCode.UNAUTHORIZED, message: FAILURE_MESSAGES.UNAUTHORIZED })
  }

  const { id } = await params
  const from = new URL(request.url).searchParams.get('from') ?? undefined
  const result = await bookingPort.availability(token, id, from)

  return result.ok ? NextResponse.json(result.value) : refuse(result.error)
}
