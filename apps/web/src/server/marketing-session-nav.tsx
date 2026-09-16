import { SignedInShortcut, SignedOutLinks } from '@/ui/SiteHeader'

import { identityPort } from './container'
import { readSessionToken } from './session'

export const MarketingSessionNav = async () => {
  const token = await readSessionToken()
  if (token === null) return <SignedOutLinks />

  const result = await identityPort.me(token)
  if (!result.ok) return <SignedOutLinks />

  return <SignedInShortcut displayName={result.value.displayName} />
}
