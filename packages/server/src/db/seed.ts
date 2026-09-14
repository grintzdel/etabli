import { NodeRuntime } from '@effect/platform-node'
import { SqlClient } from '@effect/sql'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

import { MigratorLive } from '../layers/migrator.layer'
import { SqlClientLive } from '../layers/sql-client.layer'

interface SeedMachine {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly kind: string
  readonly requiresCertification: boolean
  readonly slotDurationMinutes: number
  readonly status: string
}

interface SeedAtelier {
  readonly id: string
  readonly slug: string
  readonly name: string
  readonly description: string
  readonly street: string
  readonly postalCode: string
  readonly city: string
  readonly latitude: number
  readonly longitude: number
  readonly status: string
  readonly machines: ReadonlyArray<SeedMachine>
}

const ATELIERS: ReadonlyArray<SeedAtelier> = [
  {
    id: '0a7e1f00-0000-4000-8000-000000000001',
    slug: 'la-forge-montreuil',
    name: 'La Forge',
    description: 'Atelier bois et métal ouvert sept jours sur sept, au pied du métro Croix-de-Chavaux.',
    street: '12 rue des Forges',
    postalCode: '93100',
    city: 'Montreuil',
    latitude: 48.8638,
    longitude: 2.4485,
    status: 'PUBLISHED',
    machines: [
      {
        id: '0a7e1f00-0000-4000-8000-000000000101',
        name: 'Trotec Speedy 400',
        description: 'Découpe laser CO2, plateau 1000 × 610 mm.',
        kind: 'LASER_CUTTER',
        requiresCertification: true,
        slotDurationMinutes: 60,
        status: 'AVAILABLE',
      },
      {
        id: '0a7e1f00-0000-4000-8000-000000000102',
        name: 'Prusa MK4',
        description: 'Impression 3D filament, buse 0,4 mm.',
        kind: 'PRINTER_3D',
        requiresCertification: false,
        slotDurationMinutes: 120,
        status: 'MAINTENANCE',
      },
      {
        id: '0a7e1f00-0000-4000-8000-000000000103',
        name: 'Tour Jet BDB-1340',
        description: 'Tour à bois entre-pointes 1000 mm.',
        kind: 'WOOD_LATHE',
        requiresCertification: true,
        slotDurationMinutes: 60,
        status: 'AVAILABLE',
      },
    ],
  },
  {
    id: '0a7e1f00-0000-4000-8000-000000000002',
    slug: 'fabrique-lyonnaise',
    name: 'Fabrique Lyonnaise',
    description: 'Textile et électronique, dans une ancienne teinturerie de la Guillotière.',
    street: '3 quai Claude Bernard',
    postalCode: '69007',
    city: 'Lyon',
    latitude: 45.764,
    longitude: 4.8357,
    status: 'PUBLISHED',
    machines: [
      {
        id: '0a7e1f00-0000-4000-8000-000000000201',
        name: 'Juki DDL-8700',
        description: 'Piqueuse industrielle point noué.',
        kind: 'SEWING',
        requiresCertification: false,
        slotDurationMinutes: 30,
        status: 'AVAILABLE',
      },
      {
        id: '0a7e1f00-0000-4000-8000-000000000202',
        name: 'Établi Weller',
        description: 'Poste de soudure, loupe binoculaire et alimentation de laboratoire.',
        kind: 'ELECTRONICS_BENCH',
        requiresCertification: false,
        slotDurationMinutes: 60,
        status: 'AVAILABLE',
      },
    ],
  },
  {
    id: '0a7e1f00-0000-4000-8000-000000000003',
    slug: 'atelier-en-preparation',
    name: 'Atelier en préparation',
    description: 'Ouvre au printemps. Ne doit apparaître nulle part.',
    street: '1 rue Inconnue',
    postalCode: '31000',
    city: 'Toulouse',
    latitude: 43.6047,
    longitude: 1.4442,
    status: 'DRAFT',
    machines: [],
  },
]

const program = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  for (const atelier of ATELIERS) {
    yield* sql`
      INSERT INTO ateliers (id, slug, name, description, street, postal_code, city, country, latitude, longitude, status)
      VALUES (
        ${atelier.id}, ${atelier.slug}, ${atelier.name}, ${atelier.description}, ${atelier.street},
        ${atelier.postalCode}, ${atelier.city}, 'FR', ${atelier.latitude}, ${atelier.longitude}, ${atelier.status}
      )
      ON CONFLICT (id) DO NOTHING
    `

    for (const machine of atelier.machines) {
      yield* sql`
        INSERT INTO machines (id, atelier_id, name, description, kind, requires_certification, slot_duration_minutes, status)
        VALUES (
          ${machine.id}, ${atelier.id}, ${machine.name}, ${machine.description}, ${machine.kind},
          ${machine.requiresCertification}, ${machine.slotDurationMinutes}, ${machine.status}
        )
        ON CONFLICT (id) DO NOTHING
      `
    }
  }

  yield* Effect.log(`Seeded ${ATELIERS.length} ateliers`)
}).pipe(Effect.provide(MigratorLive.pipe(Layer.provide(SqlClientLive))), Effect.provide(SqlClientLive))

NodeRuntime.runMain(program)
