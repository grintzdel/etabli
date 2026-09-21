import { Surface } from '@etabli/ui'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { emptyOnboardingFormState } from '@/modules/atelier/core/model/onboarding-form'
import { OnboardingForm } from '@/modules/atelier/react/components/OnboardingForm'
import { atelierPort, identityPort } from '@/server/container'
import { completeOnboardingAction } from '@/server/onboarding.actions'
import { readSessionToken } from '@/server/session'

export const metadata: Metadata = {
  title: 'Bienvenue',
  robots: { index: false, follow: false },
}

const Onboarding = async () => {
  const token = await readSessionToken()
  if (token === null) redirect('/connexion?next=/bienvenue')

  const session = await identityPort.me(token)
  if (!session.ok) redirect('/connexion?next=/bienvenue')
  if (session.value.memberships.length > 0) redirect('/compte')

  const directory = await atelierPort.list({})
  if (!directory.ok) {
    return (
      <p role="alert" className="text-status-danger">
        {directory.error.message}
      </p>
    )
  }

  return (
    <OnboardingForm
      action={completeOnboardingAction}
      initialState={emptyOnboardingFormState}
      ateliers={directory.value}
    />
  )
}

const OnboardingFallback = () => (
  <Surface className="text-graphite-400" aria-busy="true">
    Chargement des ateliers…
  </Surface>
)

export const WelcomePage = () => (
  <main className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 py-20">
    <header className="flex flex-col gap-3">
      <h1 className="font-display text-4xl font-bold tracking-tight uppercase">Bienvenue</h1>
      <p className="text-graphite-200 max-w-2xl text-lg">
        Deux questions et c’est fini : où vous comptez travailler, et ce que vous savez faire.
      </p>
    </header>

    <Suspense fallback={<OnboardingFallback />}>
      <Onboarding />
    </Suspense>
  </main>
)
