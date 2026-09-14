import { SessionNav } from '@/modules/identity/react/components/SessionNav'
import { SignedOutLinks } from '@/ui/SiteHeader'

import { identityPort } from './container'
import { logoutAction } from './identity.actions'
import { readSessionToken } from './session'

export const CurrentSessionNav = async () => {
  const token = await readSessionToken()
  if (token === null) return <SignedOutLinks />

  const result = await identityPort.me(token)
  if (!result.ok) return <SignedOutLinks />

  return <SessionNav displayName={result.value.displayName} signOut={logoutAction} />
}
