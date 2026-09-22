import { SignedInShortcut, SignedOutLinks } from '@/ui/SiteHeader'

import { identityPort } from './container'
import { hasSession } from './session'

export const MarketingSessionNav = async () => {
  if (!(await hasSession())) return <SignedOutLinks />

  const result = await identityPort.me()
  if (!result.ok) return <SignedOutLinks />

  return <SignedInShortcut displayName={result.value.displayName} />
}
