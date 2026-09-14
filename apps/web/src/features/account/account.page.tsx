import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { AccountCard } from '@/modules/identity/react/components/AccountCard'
import { LogoutButton } from '@/modules/identity/react/components/LogoutButton'
import { identityPort } from '@/server/container'
import { logoutAction } from '@/server/identity.actions'
import { readSessionToken } from '@/server/session'
import { Surface } from '@/ui/Surface'

export const metadata: Metadata = {
  title: 'Mon compte',
  robots: { index: false, follow: false },
}

const AccountDetails = async () => {
  const token = await readSessionToken()
  if (token === null) redirect('/connexion?next=/compte')

  const result = await identityPort.me(token)
  if (!result.ok) redirect('/connexion?next=/compte')

  return <AccountCard user={result.value} />
}

const AccountDetailsFallback = () => (
  <Surface className="text-graphite-400" aria-busy="true">
    Chargement de votre compte…
  </Surface>
)

export const AccountPage = () => (
  <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-20">
    <header className="flex flex-wrap items-center justify-between gap-4">
      <h1 className="font-display text-3xl font-bold tracking-tight uppercase">Mon compte</h1>
      <LogoutButton action={logoutAction} />
    </header>

    <Suspense fallback={<AccountDetailsFallback />}>
      <AccountDetails />
    </Suspense>
  </main>
)
