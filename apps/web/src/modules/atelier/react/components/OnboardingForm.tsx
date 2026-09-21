'use client'

import { Button, Surface } from '@etabli/ui'
import { useActionState } from 'react'

import type { AtelierSummary } from '@/modules/atelier/core/model/atelier'
import { MACHINE_KIND_LABELS, PRACTICES } from '@/modules/atelier/core/model/atelier'
import type { OnboardingFormAction, OnboardingFormState } from '@/modules/atelier/core/model/onboarding-form'

export type OnboardingFormProps = {
  readonly action: OnboardingFormAction
  readonly initialState: OnboardingFormState
  readonly ateliers: ReadonlyArray<AtelierSummary>
}

export const OnboardingForm = ({ action, initialState, ateliers }: OnboardingFormProps) => {
  const [state, submit, pending] = useActionState(action, initialState)

  if (ateliers.length === 0) {
    return <output className="text-graphite-400">Aucun atelier n’est encore publié. Revenez bientôt.</output>
  }

  return (
    <form action={submit} className="flex flex-col gap-10">
      <fieldset className="flex flex-col gap-4">
        <legend className="font-display mb-2 text-xl font-semibold tracking-wide uppercase">1 · Votre atelier</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {ateliers.map((atelier, index) => (
            <label
              key={atelier.id}
              aria-label={atelier.name}
              className="has-checked:border-signal-500 border-graphite-800 bg-graphite-900 flex cursor-pointer gap-3 rounded-sm border p-4"
            >
              <input
                type="radio"
                name="atelierId"
                value={atelier.id}
                defaultChecked={index === 0}
                className="accent-signal-500 mt-1"
              />
              <span className="flex flex-col gap-1">
                <span className="font-display font-semibold tracking-wide uppercase">{atelier.name}</span>
                <span className="text-graphite-400 text-sm">
                  {atelier.city} · {atelier.machineCount} machine{atelier.machineCount > 1 ? 's' : ''}
                </span>
                <span className="text-graphite-500 text-sm">
                  {atelier.machineKinds.map((kind) => MACHINE_KIND_LABELS[kind]).join(', ')}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="font-display mb-2 text-xl font-semibold tracking-wide uppercase">2 · Vos pratiques</legend>
        <div className="flex flex-wrap gap-3">
          {PRACTICES.map((practice) => (
            <label
              key={practice}
              className="has-checked:border-signal-500 has-checked:text-graphite-50 border-graphite-800 text-graphite-300 flex cursor-pointer items-center gap-2 rounded-sm border px-4 py-2"
            >
              <input
                type="checkbox"
                name="practice"
                value={practice}
                defaultChecked={state.practice.includes(practice)}
                className="accent-signal-500"
              />
              {practice}
            </label>
          ))}
        </div>
      </fieldset>

      {state.error === null ? null : (
        <p role="alert" className="text-status-danger text-sm">
          {state.error}
        </p>
      )}

      <Surface className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-graphite-400 text-sm">
          Rejoindre un atelier ne vous habilite à rien. Les habilitations se demandent machine par machine.
        </p>
        <Button type="submit" disabled={pending}>
          {pending ? 'Enregistrement…' : 'Rejoindre cet atelier'}
        </Button>
      </Surface>
    </form>
  )
}
