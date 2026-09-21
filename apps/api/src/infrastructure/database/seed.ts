import { hash } from 'bcryptjs'

import type { Database } from './database.token.ts'
import { ateliers, machines, memberships, users } from './schema/index.ts'
import { ATELIERS, MEMBERSHIPS, SEED_PASSWORD, USERS } from './seed.data.ts'

export interface SeedReport {
  readonly ateliers: number
  readonly machines: number
  readonly users: number
  readonly memberships: number
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
