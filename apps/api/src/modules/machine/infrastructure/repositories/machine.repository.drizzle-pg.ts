import { Inject, Injectable } from '@nestjs/common'
import { and, asc, eq, inArray, ne } from 'drizzle-orm'

import { type Database, DATABASE_CONNECTION } from '../../../../infrastructure/database/database.token.ts'
import { ateliers, machines } from '../../../../infrastructure/database/schema/index.ts'
import { BaseRepository } from '../../../../shared/infrastructure/base.repository.ts'
import { AtelierStatus } from '../../../atelier/domain/constants/atelier.constant.ts'
import type { MachineKind, MachineStatus } from '../../domain/constants/machine.constant.ts'
import { MachineStatus as MachineStatusValues } from '../../domain/constants/machine.constant.ts'
import type { MachineEntity, MachineWithAtelier } from '../../domain/entities/machine.entity.ts'
import type {
  IMachineRepository,
  NewMachine,
  UpdateMachineInput,
} from '../../domain/repositories/machine.repository.interface.ts'

type MachineRow = typeof machines.$inferSelect

const toMachine = (row: MachineRow): MachineEntity => ({
  id: row.id,
  atelierId: row.atelierId,
  name: row.name,
  description: row.description,
  kind: row.kind as MachineKind,
  requiresCertification: row.requiresCertification,
  slotDurationMinutes: row.slotDurationMinutes,
  status: row.status as MachineStatus,
  checkInToken: row.checkInToken,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
})

const toMachineWithAtelier = (row: {
  readonly machine: MachineRow
  readonly atelierName: string
  readonly atelierSlug: string
}): MachineWithAtelier => ({
  ...toMachine(row.machine),
  atelierName: row.atelierName,
  atelierSlug: row.atelierSlug,
})

@Injectable()
export class MachineRepositoryDrizzlePg extends BaseRepository<MachineRow> implements IMachineRepository {
  constructor(@Inject(DATABASE_CONNECTION) db: Database) {
    super(db, machines, machines.id)
  }

  async findById(id: string): Promise<MachineWithAtelier | null> {
    const [found] = await this.joined().where(eq(machines.id, id)).limit(1)
    return found === undefined ? null : toMachineWithAtelier(found)
  }

  async findPublicById(id: string): Promise<MachineWithAtelier | null> {
    const [found] = await this.joined()
      .where(
        and(
          eq(machines.id, id),
          ne(machines.status, MachineStatusValues.RETIRED),
          eq(ateliers.status, AtelierStatus.PUBLISHED)
        )
      )
      .limit(1)

    return found === undefined ? null : toMachineWithAtelier(found)
  }

  async findMany(ids: ReadonlyArray<string>): Promise<ReadonlyArray<MachineWithAtelier>> {
    const wanted = [...new Set(ids)]
    if (wanted.length === 0) return []

    const rows = await this.joined().where(inArray(machines.id, wanted)).orderBy(asc(machines.name))
    return rows.map(toMachineWithAtelier)
  }

  async listForAtelier(atelierId: string): Promise<ReadonlyArray<MachineEntity>> {
    const rows = await this.db
      .select()
      .from(machines)
      .where(eq(machines.atelierId, atelierId))
      .orderBy(asc(machines.name))

    return rows.map(toMachine)
  }

  async listForAteliers(atelierIds: ReadonlyArray<string>): Promise<ReadonlyArray<MachineWithAtelier>> {
    const wanted = [...new Set(atelierIds)]
    if (wanted.length === 0) return []

    const rows = await this.joined().where(inArray(machines.atelierId, wanted)).orderBy(asc(machines.name))
    return rows.map(toMachineWithAtelier)
  }

  async listAll(): Promise<ReadonlyArray<MachineWithAtelier>> {
    const rows = await this.joined().orderBy(asc(machines.name))
    return rows.map(toMachineWithAtelier)
  }

  async insert(machine: NewMachine): Promise<MachineEntity> {
    const [row] = await this.db
      .insert(machines)
      .values({ ...machine, updatedAt: machine.createdAt })
      .returning()

    if (row === undefined) throw new Error('machines.insert returned no row')
    return toMachine(row)
  }

  async update(id: string, patch: UpdateMachineInput, at: Date): Promise<MachineEntity | null> {
    const [row] = await this.db
      .update(machines)
      .set({
        ...(patch.name === undefined ? {} : { name: patch.name }),
        ...(patch.description === undefined ? {} : { description: patch.description }),
        ...(patch.status === undefined ? {} : { status: patch.status }),
        ...(patch.requiresCertification === undefined ? {} : { requiresCertification: patch.requiresCertification }),
        ...(patch.slotDurationMinutes === undefined ? {} : { slotDurationMinutes: patch.slotDurationMinutes }),
        ...(patch.checkInToken === undefined ? {} : { checkInToken: patch.checkInToken }),
        updatedAt: at,
      })
      .where(eq(machines.id, id))
      .returning()

    return row === undefined ? null : toMachine(row)
  }

  private joined() {
    return this.db
      .select({ machine: machines, atelierName: ateliers.name, atelierSlug: ateliers.slug })
      .from(machines)
      .innerJoin(ateliers, eq(ateliers.id, machines.atelierId))
      .$dynamic()
  }
}
