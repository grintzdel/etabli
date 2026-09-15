import { Inject, Injectable } from '@nestjs/common'
import { and, asc, eq, ne, sql, type SQL } from 'drizzle-orm'

import { type Database, DATABASE_CONNECTION } from '../../../../infrastructure/database/database.token.ts'
import { ateliers, machines } from '../../../../infrastructure/database/schema/index.ts'
import { BaseRepository } from '../../../../shared/infrastructure/base.repository.ts'
import type { MachineKind, MachineStatus } from '../../../machine/domain/constants/machine.constant.ts'
import { MachineStatus as MachineStatusValues } from '../../../machine/domain/constants/machine.constant.ts'
import { AtelierStatus, EARTH_RADIUS_KM } from '../../domain/constants/atelier.constant.ts'
import {
  type AdminAtelier,
  type AtelierEntity,
  type AtelierSummary,
  type PublicMachine,
  toAdminAtelier,
} from '../../domain/entities/atelier.entity.ts'
import type {
  DirectoryFilter,
  IAtelierRepository,
  NewAtelier,
} from '../../domain/repositories/atelier.repository.interface.ts'

type AtelierRow = typeof ateliers.$inferSelect

const toAtelier = (row: AtelierRow): AtelierEntity => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  description: row.description,
  street: row.street,
  postalCode: row.postalCode,
  city: row.city,
  country: row.country,
  latitude: Number(row.latitude),
  longitude: Number(row.longitude),
  status: row.status as AtelierStatus,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
})

const inService = () => ne(machines.status, MachineStatusValues.RETIRED)

const distanceExpression = (lat: number, lng: number): SQL<number> =>
  sql<number>`${EARTH_RADIUS_KM} * acos(least(1, greatest(-1,
    cos(radians(${lat})) * cos(radians(${ateliers.latitude}::double precision)) *
    cos(radians(${ateliers.longitude}::double precision) - radians(${lng})) +
    sin(radians(${lat})) * sin(radians(${ateliers.latitude}::double precision))
  )))`

@Injectable()
export class AtelierRepositoryDrizzlePg extends BaseRepository<AtelierRow> implements IAtelierRepository {
  constructor(@Inject(DATABASE_CONNECTION) db: Database) {
    super(db, ateliers, ateliers.id)
  }

  async listPublished(filter: DirectoryFilter): Promise<ReadonlyArray<AtelierSummary>> {
    const geo = filter.lat !== undefined && filter.lng !== undefined && filter.radiusKm !== undefined
    const distance = geo ? distanceExpression(filter.lat as number, filter.lng as number) : null

    const clauses: Array<SQL | undefined> = [eq(ateliers.status, AtelierStatus.PUBLISHED)]
    if (filter.city !== undefined) clauses.push(sql`lower(${ateliers.city}) = lower(${filter.city})`)
    if (filter.machineKind !== undefined) {
      clauses.push(
        sql`EXISTS (SELECT 1 FROM ${machines} mk WHERE mk.atelier_id = ${ateliers.id}
          AND mk.kind = ${filter.machineKind} AND mk.status <> ${MachineStatusValues.RETIRED})`
      )
    }
    if (distance !== null) clauses.push(sql`${distance} <= ${filter.radiusKm as number}`)

    const rows = await this.db
      .select({
        id: ateliers.id,
        slug: ateliers.slug,
        name: ateliers.name,
        description: ateliers.description,
        city: ateliers.city,
        country: ateliers.country,
        latitude: sql<number>`${ateliers.latitude}::double precision`,
        longitude: sql<number>`${ateliers.longitude}::double precision`,
        machineCount: sql<number>`count(${machines.id})::int`,
        machineKinds: sql<
          ReadonlyArray<string>
        >`coalesce(array_agg(DISTINCT ${machines.kind}) FILTER (WHERE ${machines.id} IS NOT NULL), '{}'::text[])`,
        distanceKm: distance ?? sql<number | null>`NULL::double precision`,
      })
      .from(ateliers)
      .leftJoin(machines, and(eq(machines.atelierId, ateliers.id), inService()))
      .where(BaseRepository.every(...clauses))
      .groupBy(ateliers.id)
      .orderBy(distance === null ? asc(ateliers.name) : asc(distance), asc(ateliers.slug))
      .limit(filter.limit)
      .offset(filter.offset)

    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description,
      city: row.city,
      country: row.country,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      machineCount: Number(row.machineCount),
      machineKinds: (row.machineKinds ?? []) as ReadonlyArray<MachineKind>,
      distanceKm: row.distanceKm === null ? null : Number(row.distanceKm),
    }))
  }

  async findPublishedBySlug(slug: string): Promise<AtelierEntity | null> {
    const row = await this.selectOne(and(eq(ateliers.slug, slug), eq(ateliers.status, AtelierStatus.PUBLISHED)) as SQL)
    return row === null ? null : toAtelier(row)
  }

  async findPublishedById(id: string): Promise<AtelierEntity | null> {
    const row = await this.selectOne(and(eq(ateliers.id, id), eq(ateliers.status, AtelierStatus.PUBLISHED)) as SQL)
    return row === null ? null : toAtelier(row)
  }

  async findAnyById(id: string): Promise<AtelierEntity | null> {
    const row = await this.findRowById(id)
    return row === null ? null : toAtelier(row)
  }

  async findAnyBySlug(slug: string): Promise<AtelierEntity | null> {
    const row = await this.selectOne(eq(ateliers.slug, slug))
    return row === null ? null : toAtelier(row)
  }

  async listPublicMachines(atelierId: string): Promise<ReadonlyArray<PublicMachine>> {
    const rows = await this.db
      .select()
      .from(machines)
      .where(and(eq(machines.atelierId, atelierId), inService()))
      .orderBy(asc(machines.name))

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      kind: row.kind as MachineKind,
      requiresCertification: row.requiresCertification,
      slotDurationMinutes: row.slotDurationMinutes,
      status: row.status as MachineStatus,
    }))
  }

  async listAll(): Promise<ReadonlyArray<AdminAtelier>> {
    const rows = await this.db
      .select({
        id: ateliers.id,
        slug: ateliers.slug,
        name: ateliers.name,
        city: ateliers.city,
        status: ateliers.status,
        machineCount: sql<number>`count(${machines.id})::int`,
        createdAt: ateliers.createdAt,
      })
      .from(ateliers)
      .leftJoin(machines, and(eq(machines.atelierId, ateliers.id), inService()))
      .groupBy(ateliers.id)
      .orderBy(asc(ateliers.name))

    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      city: row.city,
      status: row.status as AtelierStatus,
      machineCount: Number(row.machineCount),
      createdAt: row.createdAt,
    }))
  }

  async insert(atelier: NewAtelier): Promise<AtelierEntity> {
    const [row] = await this.db
      .insert(ateliers)
      .values({ ...atelier, updatedAt: atelier.createdAt })
      .returning()

    if (row === undefined) throw new Error('ateliers.insert returned no row')
    return toAtelier(row)
  }

  async updateStatus(id: string, status: AtelierStatus, at: Date): Promise<AdminAtelier | null> {
    const [row] = await this.db.update(ateliers).set({ status, updatedAt: at }).where(eq(ateliers.id, id)).returning()

    if (row === undefined) return null

    const [counted] = await this.db
      .select({ machineCount: sql<number>`count(${machines.id})::int` })
      .from(machines)
      .where(and(eq(machines.atelierId, id), inService()))

    return toAdminAtelier(toAtelier(row), Number(counted?.machineCount ?? 0))
  }
}
