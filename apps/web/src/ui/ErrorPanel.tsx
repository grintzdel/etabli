'use client'

import { Button, Surface } from '@etabli/ui'

export type ErrorPanelProps = {
  readonly title: string
  readonly body: string
  readonly digest?: string
  readonly onRetry: () => void
}

export const ErrorPanel = ({ title, body, digest, onRetry }: ErrorPanelProps) => (
  <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-20">
    <header className="flex flex-col gap-3">
      <h1 className="font-display text-4xl font-bold tracking-tight uppercase">{title}</h1>
      <p className="text-graphite-200 max-w-2xl text-lg">{body}</p>
    </header>

    <Surface className="flex flex-wrap items-center justify-between gap-4">
      <p className="text-graphite-400 text-sm">
        {digest === undefined ? 'Aucun identifiant technique associé.' : `Identifiant technique : ${digest}`}
      </p>
      <Button onClick={onRetry}>Réessayer</Button>
    </Surface>
  </main>
)
