import { Surface } from '@etabli/ui'
import type { Metadata } from 'next'
import Link from 'next/link'

import { emptyAuthFormState } from '@/modules/identity/core/model/session'
import { RegisterForm } from '@/modules/identity/react/components/RegisterForm'
import { registerAction } from '@/server/identity.actions'

export const metadata: Metadata = {
  title: 'Créer un compte',
  description: "Créez votre compte Établi pour demander vos habilitations et réserver vos créneaux d'atelier.",
}

export const RegisterPage = () => (
  <main className="mx-auto flex w-full max-w-md flex-col gap-8 px-6 py-20">
    <header className="flex flex-col gap-2">
      <h1 className="font-display text-3xl font-bold tracking-tight uppercase">Créer un compte</h1>
      <p className="text-graphite-400">Votre compte vous suit d'un atelier à l'autre.</p>
    </header>

    <Surface>
      <RegisterForm action={registerAction} initialState={emptyAuthFormState} />
    </Surface>

    <p className="text-graphite-400 text-sm">
      Vous avez déjà un compte ?{' '}
      <Link href="/connexion" className="text-signal-500 underline">
        Se connecter
      </Link>
    </p>
  </main>
)
