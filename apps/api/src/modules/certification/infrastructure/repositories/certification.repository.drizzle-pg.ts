import { Inject, Injectable } from '@nestjs/common'
import { and, asc, desc, eq, inArray } from 'drizzle-orm'

import { type Database, DATABASE_CONNECTION } from '../../../../infrastructure/database/database.token.ts'
import { certifications } from '../../../../infrastructure/database/schema/index.ts'
import { BaseRepository } from '../../../../shared/infrastructure/base.repository.ts'
import { CertificationStatus } from '../../domain/constants/certification.constant.ts'
import type { CertificationEntity } from '../../domain/entities/certification.entity.ts'
import type {
  ICertificationRepository,
  NewCertification,
} from '../../domain/repositories/certification.repository.interface.ts'

type CertificationRow = typeof certifications.$inferSelect

const toCertification = (row: CertificationRow): CertificationEntity => ({
  id: row.id,
  userId: row.userId,
  machineId: row.machineId,
  status: row.status as CertificationStatus,
  requestedAt: row.requestedAt,
  decidedAt: row.decidedAt,
  decidedBy: row.decidedBy,
})

@Injectable()
export class CertificationRepositoryDrizzlePg
  extends BaseRepository<CertificationRow>
  implements ICertificationRepository
{
  constructor(@Inject(DATABASE_CONNECTION) db: Database) {
    super(db, certifications, certifications.id)
  }

  async findById(id: string): Promise<CertificationEntity | null> {
    const row = await this.findRowById(id)
    return row === null ? null : toCertification(row)
  }

  async findForUserAndMachine(userId: string, machineId: string): Promise<CertificationEntity | null> {
    const row = await this.selectOne(
      and(eq(certifications.userId, userId), eq(certifications.machineId, machineId)) as never
    )
    return row === null ? null : toCertification(row)
  }

  async listForUser(userId: string): Promise<ReadonlyArray<CertificationEntity>> {
    const rows = await this.db
      .select()
      .from(certifications)
      .where(eq(certifications.userId, userId))
      .orderBy(desc(certifications.requestedAt))

    return rows.map(toCertification)
  }

  async listForMachines(machineIds: ReadonlyArray<string>): Promise<ReadonlyArray<CertificationEntity>> {
    const wanted = [...new Set(machineIds)]
    if (wanted.length === 0) return []

    const rows = await this.db
      .select()
      .from(certifications)
      .where(inArray(certifications.machineId, wanted))
      .orderBy(asc(certifications.requestedAt))

    return rows.map(toCertification)
  }

  async isCertified(userId: string, machineId: string): Promise<boolean> {
    const certification = await this.findForUserAndMachine(userId, machineId)
    return certification?.status === CertificationStatus.GRANTED
  }

  async insert(certification: NewCertification): Promise<CertificationEntity> {
    const [row] = await this.db
      .insert(certifications)
      .values({ ...certification })
      .returning()
    if (row === undefined) throw new Error('certifications.insert returned no row')
    return toCertification(row)
  }

  async reopen(id: string, at: Date): Promise<CertificationEntity | null> {
    const [row] = await this.db
      .update(certifications)
      .set({ status: CertificationStatus.PENDING, decidedAt: null, decidedBy: null, requestedAt: at })
      .where(eq(certifications.id, id))
      .returning()

    return row === undefined ? null : toCertification(row)
  }

  async decide(
    id: string,
    status: CertificationStatus,
    decidedBy: string,
    at: Date
  ): Promise<CertificationEntity | null> {
    const [row] = await this.db
      .update(certifications)
      .set({ status, decidedBy, decidedAt: at })
      .where(eq(certifications.id, id))
      .returning()

    return row === undefined ? null : toCertification(row)
  }
}
