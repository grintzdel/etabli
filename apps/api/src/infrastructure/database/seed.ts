import { hash } from 'bcryptjs'
import { inArray } from 'drizzle-orm'

import type { Database } from './database.token.ts'
import { ateliers, bookings, certifications, machines, memberships, users } from './schema/index.ts'
import { ATELIERS, BOOKINGS, CERTIFICATIONS, MEMBERSHIPS, SEED_PASSWORD, USERS } from './seed.data.ts'

export interface SeedReport {
  readonly ateliers: number
  readonly machines: number
  readonly users: number
  readonly memberships: number
}

export interface DemoReport {
  readonly certifications: number
  readonly bookings: number
}

const DAY_MS = 86_400_000

const parisOffsetMinutes = (instant: Date): number => {
  const label = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Paris', timeZoneName: 'longOffset' })
    .formatToParts(instant)
    .find((part) => part.type === 'timeZoneName')?.value
  const match = /GMT([+-])(\d{2}):(\d{2})/.exec(label ?? '')
  if (match === null) return 0

  return (match[1] === '-' ? -1 : 1) * (Number(match[2]) * 60 + Number(match[3]))
}

// Anchored on the clock rather than on the grid: the check-in window is 15 minutes before the
// slot and 30 after it starts, so only a slot placed relative to now is ever open to stamp.
const startingIn = (offsetMinutes: number, minutes: number): { start: Date; end: Date } => {
  const start = new Date(Date.now() + offsetMinutes * 60_000)
  return { start, end: new Date(start.getTime() + minutes * 60_000) }
}

const slotAt = (dayOffset: number, localHour: number, minutes: number): { start: Date; end: Date } => {
  const parts = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Europe/Paris',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).formatToParts(new Date(Date.now() + dayOffset * DAY_MS))
  const at = (type: string): number => Number(parts.find((part) => part.type === type)?.value ?? 0)

  const noon = Date.UTC(at('year'), at('month') - 1, at('day'), 12)
  const start = new Date(
    Date.UTC(at('year'), at('month') - 1, at('day'), localHour) - parisOffsetMinutes(new Date(noon)) * 60_000
  )

  return { start, end: new Date(start.getTime() + minutes * 60_000) }
}

export const seed = async (db: Database, now: Date = new Date()): Promise<SeedReport> => {
  const passwordHash = await hash(SEED_PASSWORD, 10)

  for (const atelier of ATELIERS) {
    await db
      .insert(ateliers)
      .values({
        id: atelier.id,
        slug: atelier.slug,
        name: atelier.name,
        description: atelier.description,
        street: atelier.street,
        postalCode: atelier.postalCode,
        city: atelier.city,
        country: 'FR',
        latitude: atelier.latitude,
        longitude: atelier.longitude,
        status: atelier.status,
      })
      .onConflictDoNothing({ target: ateliers.id })

    for (const machine of atelier.machines) {
      await db
        .insert(machines)
        .values({ ...machine, atelierId: atelier.id })
        .onConflictDoNothing({ target: machines.id })
    }
  }

  for (const user of USERS) {
    await db
      .insert(users)
      .values({
        id: user.id,
        email: user.email,
        passwordHash,
        displayName: user.displayName,
        platformRole: user.platformRole,
        practice: [...user.practice],
        onboardingCompletedAt: user.onboardingCompleted ? now : null,
        status: user.status,
      })
      .onConflictDoNothing({ target: users.id })
  }

  for (const membership of MEMBERSHIPS) {
    await db
      .insert(memberships)
      .values({ ...membership })
      .onConflictDoNothing({ target: memberships.id })
  }

  return {
    ateliers: ATELIERS.length,
    machines: ATELIERS.reduce((total, atelier) => total + atelier.machines.length, 0),
    users: USERS.length,
    memberships: MEMBERSHIPS.length,
  }
}

export const seedDemo = async (db: Database): Promise<DemoReport> => {
  // Re-asserted rather than left alone: the slots are relative to now, so a second run
  // has to move them forward instead of keeping yesterday's demo.
  await db.delete(bookings).where(
    inArray(
      bookings.id,
      BOOKINGS.map((booking) => booking.id)
    )
  )
  await db.delete(certifications).where(
    inArray(
      certifications.id,
      CERTIFICATIONS.map((row) => row.id)
    )
  )

  for (const certification of CERTIFICATIONS) {
    const requestedAt = new Date(Date.now() - certification.requestedDaysAgo * DAY_MS)

    await db
      .insert(certifications)
      .values({
        id: certification.id,
        userId: certification.userId,
        machineId: certification.machineId,
        status: certification.status,
        requestedAt,
        decidedAt: certification.decidedBy === null ? null : new Date(requestedAt.getTime() + DAY_MS),
        decidedBy: certification.decidedBy,
      })
      .onConflictDoNothing({ target: [certifications.userId, certifications.machineId] })
  }

  for (const booking of BOOKINGS) {
    const { start, end } =
      booking.startsInMinutes === undefined
        ? slotAt(booking.dayOffset, booking.localHour, booking.minutes)
        : startingIn(booking.startsInMinutes, booking.minutes)
    const cancelledAt = booking.status === 'CANCELLED' ? new Date(start.getTime() - 2 * 60 * 60_000) : null

    await db.insert(bookings).values({
      id: booking.id,
      machineId: booking.machineId,
      atelierId: booking.atelierId,
      userId: booking.userId,
      startAt: start,
      endAt: end,
      status: booking.status,
      checkedInAt: booking.checkedInVia === null ? null : new Date(start.getTime() + 4 * 60_000),
      checkedInVia: booking.checkedInVia,
      cancelledAt,
      cancelledBy: cancelledAt === null ? null : booking.userId,
    })
  }

  return { certifications: CERTIFICATIONS.length, bookings: BOOKINGS.length }
}
