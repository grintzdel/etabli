import type { DefaultAtelier } from '@/modules/identity/react/components/SessionNav'
import { SessionNav } from '@/modules/identity/react/components/SessionNav'
import { SignedOutLinks } from '@/ui/SiteHeader'

import { identityPort } from './container'
import { logoutAction } from './identity.actions'
import { readMyAteliers, readPreferences } from './preferences'
import { hasSession } from './session'

const resolveDefaultAtelier = async (atelierId: string | null): Promise<DefaultAtelier | null> => {
  if (atelierId === null) return null

  const atelier = (await readMyAteliers()).find((candidate) => candidate.id === atelierId)
  return atelier === undefined ? null : { slug: atelier.slug, name: atelier.name }
}

export const CurrentSessionNav = async () => {
  if (!(await hasSession())) return <SignedOutLinks />

  const result = await identityPort.me()
  if (!result.ok) return <SignedOutLinks />

  const preferences = await readPreferences()

  return (
    <SessionNav
      displayName={result.value.displayName}
      isPlatformAdmin={result.value.platformRole === 'PLATFORM_ADMIN'}
      isFabmanager={result.value.memberships.some((membership) => membership.role === 'FABMANAGER')}
      defaultAtelier={await resolveDefaultAtelier(preferences?.defaultAtelierId ?? null)}
      signOut={logoutAction}
    />
  )
}
