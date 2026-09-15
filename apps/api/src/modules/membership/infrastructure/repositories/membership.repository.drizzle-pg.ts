import { Inject, Injectable } from '@nestjs/common'
import { and, asc, eq } from 'drizzle-orm'

import {
  type Database,
  DATABASE_CONNECTION,
  type Transactable,
} from '../../../../infrastructure/database/database.token.ts'
import { ateliers, memberships } from '../../../../infrastructure/database/schema/index.ts'
import type { AuthMembership } from '../../../../shared/domain/auth-user.ts'
import type { MembershipRole, MembershipStatus } from '../../../../shared/domain/roles.constant.ts'
import { BaseRepository } from '../../../../shared/infrastructure/base.repository.ts'
import type { MemberAtelier, MembershipEntity } from '../../domain/entities/membership.entity.ts'
import type { IMembershipRepository, NewMembership } from '../../domain/repositories/membership.repository.interface.ts'

type MembershipRow = typeof memberships.$inferSelect

const toMembership = (row: MembershipRow): MembershipEntity => ({
  id: row.id,
  userId: row.userId,
  atelierId: row.atelierId,
  role: row.role as MembershipRole,
  status: row.status as MembershipStatus,
  joinedAt: row.joinedAt,
})

@Injectable()
export class MembershipRepositoryDrizzlePg extends BaseRepository<MembershipRow> implements IMembershipRepository {
  constructor(@Inject(DATABASE_CONNECTION) db: Database) {
    super(db, memberships, memberships.id)
  }

  async find(userId: string, atelierId: string, tx?: Transactable): Promise<MembershipEntity | null> {
    const [row] = await this.conn(tx)
      .select()
      .from(memberships)
      .where(and(eq(memberships.userId, userId), eq(memberships.atelierId, atelierId)))
      .limit(1)

    return row === undefined ? null : toMembership(row)
  }

  async insert(membership: NewMembership, tx?: Transactable): Promise<MembershipEntity> {
    const [row] = await this.conn(tx)
      .insert(memberships)
      .values({ ...membership })
      .returning()
    if (row === undefined) throw new Error('memberships.insert returned no row')
    return toMembership(row)
  }

  async listAuthMemberships(userId: string): Promise<ReadonlyArray<AuthMembership>> {
    const rows = await this.db
      .select({ atelierId: memberships.atelierId, role: memberships.role })
      .from(memberships)
      .where(eq(memberships.userId, userId))
      .orderBy(asc(memberships.joinedAt))

    return rows.map((row) => ({ atelierId: row.atelierId, role: row.role as MembershipRole }))
  }

  async listMemberAteliers(userId: string): Promise<ReadonlyArray<MemberAtelier>> {
    const rows = await this.db
      .select({
        id: ateliers.id,
        slug: ateliers.slug,
        name: ateliers.name,
        role: memberships.role,
      })
      .from(memberships)
      .innerJoin(ateliers, eq(ateliers.id, memberships.atelierId))
      .where(eq(memberships.userId, userId))
      .orderBy(asc(memberships.joinedAt))

    return rows.map((row) => ({ id: row.id, slug: row.slug, name: row.name, role: row.role as MembershipRole }))
  }

  async updateRole(userId: string, atelierId: string, role: MembershipRole): Promise<MembershipEntity | null> {
    const [row] = await this.db
      .update(memberships)
      .set({ role })
      .where(and(eq(memberships.userId, userId), eq(memberships.atelierId, atelierId)))
      .returning()

    return row === undefined ? null : toMembership(row)
  }
}
