import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { MembershipList } from '@/modules/atelier/react/components/MembershipList'
import { AccountCard } from '@/modules/identity/react/components/AccountCard'
import { atelierPort, identityPort } from '@/server/container'
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

  const directory = await atelierPort.list({})

  return (
    <>
      <AccountCard user={result.value} />

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-2xl font-semibold tracking-wide uppercase">Mes ateliers</h2>
        <MembershipList memberships={result.value.memberships} ateliers={directory.ok ? directory.value : []} />
      </section>
    </>
  )
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
    </header>

    <Suspense fallback={<AccountDetailsFallback />}>
      <AccountDetails />
    </Suspense>
  </main>
)
