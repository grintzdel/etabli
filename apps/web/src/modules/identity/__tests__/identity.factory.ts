import type { AdminUser } from '@/modules/identity/core/model/admin-user'

let counter = 0

export const adminUserFixture = (overrides: Partial<AdminUser> = {}): AdminUser => {
  counter += 1
  return {
    id: `70000000-0000-4000-8000-${String(counter).padStart(12, '0')}`,
    email: `camille${counter}@etabli.test`,
    displayName: `Camille ${counter}`,
    platformRole: 'MEMBER',
    status: 'ACTIVE',
    practice: ['Bois'],
    onboardingCompletedAt: null,
    createdAt: '2026-01-15T09:00:00.000Z',
    ...overrides,
  }
}
