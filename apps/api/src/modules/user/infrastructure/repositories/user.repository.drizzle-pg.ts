import { Inject, Injectable } from '@nestjs/common'
import { desc, eq, ilike, inArray, or, type SQL } from 'drizzle-orm'

import {
  type Database,
  DATABASE_CONNECTION,
  type Transactable,
} from '../../../../infrastructure/database/database.token.ts'
import { ateliers, memberships, userPreferences, users } from '../../../../infrastructure/database/schema/index.ts'
import type { PlatformRole } from '../../../../shared/domain/roles.constant.ts'
import type { MembershipRole } from '../../../../shared/domain/roles.constant.ts'
import { BaseRepository } from '../../../../shared/infrastructure/base.repository.ts'
import type { Theme } from '../../domain/constants/preferences.constant.ts'
import { ADMIN_USERS_LIMIT, type UserStatus } from '../../domain/constants/user.constant.ts'
import type {
  AdminUserEntity,
  MemberAtelier,
  UserEntity,
  UserPreferencesEntity,
} from '../../domain/entities/user.entity.ts'
import type {
  AdminUsersFilter,
  IUserRepository,
  NewUser,
  UpdateAdminUserInput,
  UpdatePreferencesInput,
  UpdateProfileInput,
} from '../../domain/repositories/user.repository.interface.ts'

type UserRow = typeof users.$inferSelect

const toUser = (row: UserRow): UserEntity => ({
  id: row.id,
  email: row.email,
  passwordHash: row.passwordHash,
  displayName: row.displayName,
  platformRole: row.platformRole as PlatformRole,
  practice: row.practice,
  onboardingCompletedAt: row.onboardingCompletedAt,
  status: row.status as UserStatus,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
})

const escapeLike = (search: string): string =>
  `%${search.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_')}%`

@Injectable()
export class UserRepositoryDrizzlePg extends BaseRepository<UserRow> implements IUserRepository {
  constructor(@Inject(DATABASE_CONNECTION) db: Database) {
    super(db, users, users.id)
  }

  async findById(id: string): Promise<UserEntity | null> {
    const row = await this.findRowById(id)
    return row === null ? null : toUser(row)
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const row = await this.selectOne(eq(users.email, email))
    return row === null ? null : toUser(row)
  }

  async insert(user: NewUser): Promise<UserEntity> {
    const [row] = await this.db
      .insert(users)
      .values({
        id: user.id,
        email: user.email,
        passwordHash: user.passwordHash,
        displayName: user.displayName,
        platformRole: user.platformRole,
        practice: [...user.practice],
        onboardingCompletedAt: null,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.createdAt,
      })
      .returning()

    if (row === undefined) throw new Error('users.insert returned no row')
    return toUser(row)
  }

  async updateProfile(id: string, patch: UpdateProfileInput, at: Date): Promise<UserEntity | null> {
    return this.patch(id, {
      ...(patch.displayName === undefined ? {} : { displayName: patch.displayName }),
      ...(patch.practice === undefined ? {} : { practice: [...patch.practice] }),
      updatedAt: at,
    })
  }

  async updatePasswordHash(id: string, passwordHash: string, at: Date): Promise<UserEntity | null> {
    return this.patch(id, { passwordHash, updatedAt: at })
  }

  async markOnboarded(
    id: string,
    practice: ReadonlyArray<string>,
    at: Date,
    tx?: Transactable
  ): Promise<UserEntity | null> {
    const [row] = await this.conn(tx)
      .update(users)
      .set({ practice: [...practice], onboardingCompletedAt: at, updatedAt: at })
      .where(eq(users.id, id))
      .returning()

    return row === undefined ? null : toUser(row)
  }

  async updateAdminState(id: string, patch: UpdateAdminUserInput, at: Date): Promise<UserEntity | null> {
    return this.patch(id, {
      ...(patch.platformRole === undefined ? {} : { platformRole: patch.platformRole }),
      ...(patch.status === undefined ? {} : { status: patch.status }),
      updatedAt: at,
    })
  }

  async listForAdmin(filter: AdminUsersFilter): Promise<ReadonlyArray<AdminUserEntity>> {
    const clauses: Array<SQL | undefined> = []
    if (filter.search !== undefined) {
      const pattern = escapeLike(filter.search)
      clauses.push(or(ilike(users.email, pattern), ilike(users.displayName, pattern)))
    }
    if (filter.platformRole !== undefined) clauses.push(eq(users.platformRole, filter.platformRole))
    if (filter.status !== undefined) clauses.push(eq(users.status, filter.status))

    const where = BaseRepository.every(...clauses)
    const rows = await this.db.select().from(users).where(where).orderBy(desc(users.createdAt)).limit(ADMIN_USERS_LIMIT)

    return this.withAteliers(rows)
  }

  async findAdminById(id: string): Promise<AdminUserEntity | null> {
    const row = await this.findRowById(id)
    if (row === null) return null
    const [admin] = await this.withAteliers([row])
    return admin ?? null
  }

  async namesOf(userIds: ReadonlyArray<string>): Promise<ReadonlyMap<string, string>> {
    const wanted = [...new Set(userIds)]
    if (wanted.length === 0) return new Map()

    const rows = await this.db
      .select({ id: users.id, displayName: users.displayName })
      .from(users)
      .where(inArray(users.id, wanted))

    return new Map(rows.map((row) => [row.id, row.displayName]))
  }

  async findPreferences(userId: string): Promise<UserPreferencesEntity | null> {
    const [row] = await this.db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1)

    return row === undefined
      ? null
      : {
          userId: row.userId,
          theme: row.theme as Theme,
          defaultAtelierId: row.defaultAtelierId,
          updatedAt: row.updatedAt,
        }
  }

  async upsertPreferences(userId: string, patch: UpdatePreferencesInput, at: Date): Promise<UserPreferencesEntity> {
    const [row] = await this.db
      .insert(userPreferences)
      .values({
        userId,
        ...(patch.theme === undefined ? {} : { theme: patch.theme }),
        defaultAtelierId: patch.defaultAtelierId ?? null,
        updatedAt: at,
      })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: {
          ...(patch.theme === undefined ? {} : { theme: patch.theme }),
          ...(patch.defaultAtelierId === undefined ? {} : { defaultAtelierId: patch.defaultAtelierId }),
          updatedAt: at,
        },
      })
      .returning()

    if (row === undefined) throw new Error('user_preferences.upsert returned no row')
    return {
      userId: row.userId,
      theme: row.theme as Theme,
      defaultAtelierId: row.defaultAtelierId,
      updatedAt: row.updatedAt,
    }
  }

  private async patch(id: string, values: Partial<typeof users.$inferInsert>): Promise<UserEntity | null> {
    const [row] = await this.db.update(users).set(values).where(eq(users.id, id)).returning()
    return row === undefined ? null : toUser(row)
  }

  private async withAteliers(rows: ReadonlyArray<UserRow>): Promise<ReadonlyArray<AdminUserEntity>> {
    if (rows.length === 0) return []

    const joined = await this.db
      .select({
        userId: memberships.userId,
        id: ateliers.id,
        slug: ateliers.slug,
        name: ateliers.name,
        role: memberships.role,
      })
      .from(memberships)
      .innerJoin(ateliers, eq(ateliers.id, memberships.atelierId))
      .where(
        inArray(
          memberships.userId,
          rows.map((row) => row.id)
        )
      )
      .orderBy(memberships.joinedAt)

    const byUser = new Map<string, Array<MemberAtelier>>()
    for (const row of joined) {
      const entry = { id: row.id, slug: row.slug, name: row.name, role: row.role as MembershipRole }
      byUser.set(row.userId, [...(byUser.get(row.userId) ?? []), entry])
    }

    return rows.map((row) => {
      const user = toUser(row)
      return {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        platformRole: user.platformRole,
        practice: user.practice,
        onboardingCompletedAt: user.onboardingCompletedAt,
        status: user.status,
        createdAt: user.createdAt,
        ateliers: byUser.get(user.id) ?? [],
      }
    })
  }
}
