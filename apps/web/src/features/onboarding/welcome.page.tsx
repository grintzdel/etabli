import { Surface } from '@etabli/ui'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { onboardingAtelierOf, type OnboardingAtelier } from '@/modules/atelier/core/lib/onboarding-atelier'
import type { AtelierResult } from '@/modules/atelier/core/model/atelier'
import { emptyOnboardingFormState } from '@/modules/atelier/core/model/onboarding-form'
import { OnboardingForm } from '@/modules/atelier/react/components/OnboardingForm'
import { safeNext } from '@/modules/identity/core/lib/safe-next'
import { atelierPort, identityPort } from '@/server/container'
import { completeOnboardingAction } from '@/server/onboarding.actions'
import { requireSession } from '@/server/session'

export const metadata: Metadata = {
  title: 'Bienvenue',
  robots: { index: false, follow: false },
}

type WelcomeSearchParams = { readonly atelier?: string; readonly next?: string }

const ateliersToOffer = async (slug: string | undefined): Promise<AtelierResult<ReadonlyArray<OnboardingAtelier>>> => {
  if (slug === undefined) return atelierPort.list({})

  const atelier = await atelierPort.getBySlug(slug)
  return atelier.ok ? { ok: true, value: [onboardingAtelierOf(atelier.value)] } : atelier
}

const Onboarding = async ({ searchParams }: { readonly searchParams: Promise<WelcomeSearchParams> }) => {
  const { atelier: slug, next } = await searchParams
  await requireSession('/bienvenue')

  const session = await identityPort.me()
  if (!session.ok) redirect('/connexion?next=/bienvenue')

  const offered = await ateliersToOffer(slug)
  if (!offered.ok) {
    return (
      <p role="alert" className="text-status-danger">
        {offered.error.message}
      </p>
    )
  }

  const joined = session.value.memberships.map((membership) => membership.atelierId)
  if (slug === undefined ? joined.length > 0 : offered.value.every((atelier) => joined.includes(atelier.id))) {
    redirect(safeNext(next, '/compte'))
  }

  return (
    <OnboardingForm
      action={completeOnboardingAction}
      initialState={{ ...emptyOnboardingFormState, practice: session.value.practice }}
      ateliers={offered.value}
      next={next}
    />
  )
}

const OnboardingFallback = () => (
  <Surface className="text-graphite-400" aria-busy="true">
    Chargement des ateliers…
  </Surface>
)

export const WelcomePage = ({ searchParams }: { readonly searchParams: Promise<WelcomeSearchParams> }) => (
  <main className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 py-20">
    <header className="flex flex-col gap-3">
      <h1 className="font-display text-4xl font-bold tracking-tight uppercase">Bienvenue</h1>
      <p className="text-graphite-200 max-w-2xl text-lg">
        Deux questions et c’est fini : où vous comptez travailler, et ce que vous savez faire.
      </p>
    </header>

    <Suspense fallback={<OnboardingFallback />}>
      <Onboarding searchParams={searchParams} />
    </Suspense>
  </main>
)
