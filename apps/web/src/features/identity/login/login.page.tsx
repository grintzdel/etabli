import { Surface } from '@etabli/ui'
import type { Metadata } from 'next'
import Link from 'next/link'

import { emptyAuthFormState } from '@/modules/identity/core/model/session'
import { LoginForm } from '@/modules/identity/react/components/LoginForm'
import { loginAction } from '@/server/identity.actions'

export const metadata: Metadata = {
  title: 'Se connecter',
  description: 'Connectez-vous à Établi pour accéder à vos habilitations et à vos réservations.',
}

// The page is one form whose hidden `next` comes from the query string: there is no shell worth
// prerendering, and a Suspense fallback would mount the form twice.
export const instant = false

export const LoginPage = async ({ searchParams }: { readonly searchParams: Promise<{ readonly next?: string }> }) => {
  const { next } = await searchParams

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-8 px-6 py-20">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-bold tracking-tight uppercase">Se connecter</h1>
        <p className="text-graphite-400">Reprenez là où vous en étiez.</p>
      </header>

      <Surface>
        <LoginForm action={loginAction} initialState={emptyAuthFormState} next={next} />
      </Surface>

      <p className="text-graphite-400 text-sm">
        Pas encore de compte ?{' '}
        <Link href="/inscription" className="text-signal-500 underline">
          Créer un compte
        </Link>
      </p>
    </main>
  )
}
