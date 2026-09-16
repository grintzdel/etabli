'use client'

import { ErrorPanel } from '@/ui/ErrorPanel'

const MarketingError = ({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) => (
  <ErrorPanel
    title="L’annuaire n’a pas répondu"
    body="Le réseau d’ateliers est momentanément injoignable. Rien de ce que vous avez fait n’est en cause."
    digest={error.digest}
    onRetry={retry}
  />
)

export default MarketingError
