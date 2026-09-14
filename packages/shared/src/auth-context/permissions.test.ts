import { describe, expect, it } from 'vitest'

import type { AtelierId, UserId } from '../schema/branded-ids'
import type { AuthContextService } from './auth-context'
import { isFabmanagerOf, isMemberOf, isPlatformAdmin } from './permissions'
import { MembershipRole, PlatformRole } from './roles.constant'

const MONTREUIL = '3f2504e0-4f89-41d3-9a0c-0305e82c3301' as AtelierId
const LYON = '9c858901-8a57-4791-81fe-4c455b099bc9' as AtelierId

const auth = (over: Partial<AuthContextService> = {}): AuthContextService => ({
  userId: '11111111-1111-4111-8111-111111111111' as UserId,
  platformRole: PlatformRole.MEMBER,
  memberships: [],
  ...over,
})

describe('isPlatformAdmin', () => {
  it('is true for a platform admin', () => {
    expect(isPlatformAdmin(auth({ platformRole: PlatformRole.PLATFORM_ADMIN }))).toBe(true)
  })

  it('is false for a plain member', () => {
    expect(isPlatformAdmin(auth())).toBe(false)
  })
})

describe('isMemberOf', () => {
  it('is true for an atelier the user belongs to', () => {
    const context = auth({ memberships: [{ atelierId: MONTREUIL, role: MembershipRole.MEMBER }] })
    expect(isMemberOf(context, MONTREUIL)).toBe(true)
  })

  it('is false for another atelier', () => {
    const context = auth({ memberships: [{ atelierId: MONTREUIL, role: MembershipRole.MEMBER }] })
    expect(isMemberOf(context, LYON)).toBe(false)
  })

  it('is false for a platform admin with no membership', () => {
    expect(isMemberOf(auth({ platformRole: PlatformRole.PLATFORM_ADMIN }), MONTREUIL)).toBe(false)
  })
})

describe('isFabmanagerOf', () => {
  it('is true in the atelier where the membership carries the role', () => {
    const context = auth({ memberships: [{ atelierId: MONTREUIL, role: MembershipRole.FABMANAGER }] })
    expect(isFabmanagerOf(context, MONTREUIL)).toBe(true)
  })

  it('is false in another atelier of the same user', () => {
    const context = auth({
      memberships: [
        { atelierId: MONTREUIL, role: MembershipRole.FABMANAGER },
        { atelierId: LYON, role: MembershipRole.MEMBER },
      ],
    })
    expect(isFabmanagerOf(context, LYON)).toBe(false)
  })

  it('is false for a plain member of that atelier', () => {
    const context = auth({ memberships: [{ atelierId: MONTREUIL, role: MembershipRole.MEMBER }] })
    expect(isFabmanagerOf(context, MONTREUIL)).toBe(false)
  })

  it('is not granted by the platform role', () => {
    expect(isFabmanagerOf(auth({ platformRole: PlatformRole.PLATFORM_ADMIN }), MONTREUIL)).toBe(false)
  })
})
