import { describe, expect, it, vi } from 'vitest'

import { PlatformRole } from '../../../../shared/domain/roles.constant.ts'
import { FixedAuthContext } from '../../../../shared/testing/fixed.auth-context.ts'
import { FixedClock } from '../../../../shared/testing/fixed.clock.ts'
import { authUserFixture, memberOf } from '../../../../shared/testing/fixtures.ts'
import { stub } from '../../../../shared/testing/stub.ts'
import { UserStatus } from '../../domain/constants/user.constant.ts'
import type { AdminUserEntity, UserEntity } from '../../domain/entities/user.entity.ts'
import {
  AdminSelfLockoutError,
  PreferredAtelierNotJoinedError,
  UserUnknownError,
} from '../../domain/errors/user.errors.ts'
import type { IUserRepository } from '../../domain/repositories/user.repository.interface.ts'
import { GetPreferencesUsecase } from './get-preferences.usecase.ts'
import { UpdateAdminUserUsecase } from './update-admin-user.usecase.ts'
import { UpdatePreferencesUsecase } from './update-preferences.usecase.ts'

const CLOCK = new FixedClock('2026-09-15T10:00:00Z')

const userEntity = (overrides: Partial<UserEntity> = {}): UserEntity => ({
  id: 'user-1',
  email: 'membre@etabli.test',
  passwordHash: 'hash',
  displayName: 'Camille Roux',
  platformRole: PlatformRole.MEMBER,
  practice: [],
  onboardingCompletedAt: null,
  status: UserStatus.ACTIVE,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  ...overrides,
})

const adminEntity: AdminUserEntity = {
  id: 'user-1',
  email: 'membre@etabli.test',
  displayName: 'Camille Roux',
  platformRole: PlatformRole.MEMBER,
  practice: [],
  onboardingCompletedAt: null,
  status: UserStatus.SUSPENDED,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  ateliers: [],
}

describe('UpdateAdminUserUsecase', () => {
  it('suspends another account', async () => {
    const admin = authUserFixture({ id: 'admin-1', platformRole: PlatformRole.PLATFORM_ADMIN })
    const usecase = new UpdateAdminUserUsecase(
      stub<IUserRepository>({
        updateAdminState: vi.fn().mockResolvedValue(userEntity({ status: UserStatus.SUSPENDED })),
        findAdminById: vi.fn().mockResolvedValue(adminEntity),
      }),
      CLOCK,
      new FixedAuthContext(admin)
    )

    expect((await usecase.execute('user-1', { status: UserStatus.SUSPENDED })).status).toBe('SUSPENDED')
  })

  it('refuses an admin who takes their own role away', async () => {
    const admin = authUserFixture({ platformRole: PlatformRole.PLATFORM_ADMIN })
    const usecase = new UpdateAdminUserUsecase(stub<IUserRepository>({}), CLOCK, new FixedAuthContext(admin))

    await expect(usecase.execute(admin.id, { platformRole: PlatformRole.MEMBER })).rejects.toThrow(
      AdminSelfLockoutError
    )
  })

  it('refuses an admin who suspends themselves', async () => {
    const admin = authUserFixture({ platformRole: PlatformRole.PLATFORM_ADMIN })
    const usecase = new UpdateAdminUserUsecase(stub<IUserRepository>({}), CLOCK, new FixedAuthContext(admin))

    await expect(usecase.execute(admin.id, { status: UserStatus.SUSPENDED })).rejects.toThrow(AdminSelfLockoutError)
  })

  it('lets an admin keep their own role', async () => {
    const admin = authUserFixture({ platformRole: PlatformRole.PLATFORM_ADMIN })
    const usecase = new UpdateAdminUserUsecase(
      stub<IUserRepository>({
        updateAdminState: vi.fn().mockResolvedValue(userEntity()),
        findAdminById: vi.fn().mockResolvedValue(adminEntity),
      }),
      CLOCK,
      new FixedAuthContext(admin)
    )

    await expect(usecase.execute(admin.id, { platformRole: PlatformRole.PLATFORM_ADMIN })).resolves.toBeDefined()
  })

  it('answers 404 on an account that does not exist', async () => {
    const admin = authUserFixture({ id: 'admin-2', platformRole: PlatformRole.PLATFORM_ADMIN })
    const usecase = new UpdateAdminUserUsecase(
      stub<IUserRepository>({ updateAdminState: vi.fn().mockResolvedValue(null) }),
      CLOCK,
      new FixedAuthContext(admin)
    )

    await expect(usecase.execute('ghost', { status: UserStatus.ACTIVE })).rejects.toThrow(UserUnknownError)
  })
})

describe('UpdatePreferencesUsecase', () => {
  it('refuses a default atelier the member has not joined', async () => {
    const usecase = new UpdatePreferencesUsecase(
      stub<IUserRepository>({}),
      CLOCK,
      new FixedAuthContext(authUserFixture())
    )

    await expect(usecase.execute({ defaultAtelierId: 'atelier-x' })).rejects.toThrow(PreferredAtelierNotJoinedError)
  })

  it('accepts an explicit null, which clears the default atelier', async () => {
    const upsert = vi.fn().mockResolvedValue({
      userId: 'user-1',
      theme: 'system',
      defaultAtelierId: null,
      updatedAt: CLOCK.now(),
    })
    const usecase = new UpdatePreferencesUsecase(
      stub<IUserRepository>({ upsertPreferences: upsert }),
      CLOCK,
      new FixedAuthContext(authUserFixture({ memberships: [memberOf('atelier-1')] }))
    )

    await usecase.execute({ defaultAtelierId: null })

    expect(upsert).toHaveBeenCalledWith(expect.any(String), { defaultAtelierId: null }, CLOCK.now())
  })
})

describe('GetPreferencesUsecase', () => {
  it('falls back to the system theme when nothing has been stored', async () => {
    const usecase = new GetPreferencesUsecase(
      stub<IUserRepository>({ findPreferences: vi.fn().mockResolvedValue(null) }),
      new FixedAuthContext(authUserFixture({ id: 'user-1' }))
    )

    const preferences = await usecase.execute()

    expect(preferences).toEqual({ userId: 'user-1', theme: 'system', defaultAtelierId: null, updatedAt: null })
  })
})
