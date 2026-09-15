import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { DEFAULT_THEME } from '@/modules/identity/core/model/preferences'
import { idleSettings } from '@/modules/identity/core/model/settings'
import { PreferencesForm } from '@/modules/identity/react/components/PreferencesForm'
import { readMyAteliers, readPreferences } from '@/server/preferences'
import { savePreferencesAction } from '@/server/preferences.actions'
import { readSessionToken } from '@/server/session'
import { Surface } from '@/ui/Surface'

export const metadata: Metadata = {
  title: 'Paramètres',
  robots: { index: false, follow: false },
}

const PreferencesSection = async () => {
  const token = await readSessionToken()
  if (token === null) redirect('/connexion?next=/parametres')

  const [preferences, ateliers] = await Promise.all([readPreferences(), readMyAteliers()])

  return (
    <PreferencesForm
      action={savePreferencesAction}
      initialState={idleSettings}
      theme={preferences?.theme ?? DEFAULT_THEME}
      defaultAtelierId={preferences?.defaultAtelierId ?? null}
      ateliers={ateliers.map((atelier) => ({ id: atelier.id, name: atelier.name }))}
    />
  )
}

const PreferencesFallback = () => (
  <output className="text-graphite-400" aria-busy="true">
    Chargement de vos préférences…
  </output>
)

export const SettingsPage = () => (
  <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-20">
    <header className="flex flex-col gap-2">
      <h1 className="font-display text-3xl font-bold tracking-tight uppercase">Paramètres</h1>
      <p className="text-graphite-400">Ces réglages vous suivent d’un appareil à l’autre.</p>
    </header>

    <section className="flex flex-col gap-4">
      <h2 className="font-display text-2xl font-semibold tracking-wide uppercase">Préférences</h2>
      <Surface>
        <Suspense fallback={<PreferencesFallback />}>
          <PreferencesSection />
        </Suspense>
      </Surface>
    </section>
  </main>
)
