'use client'

import { ErrorPanel } from '@/ui/ErrorPanel'

const AppError = ({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) => (
  <ErrorPanel
    title="Cette page n’a pas pu s’afficher"
    body="Votre session est intacte et rien n’a été perdu. L’atelier, lui, n’a pas répondu comme prévu."
    digest={error.digest}
    onRetry={retry}
  />
)

export default AppError
