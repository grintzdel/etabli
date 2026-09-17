'use client'

import { Button } from '@etabli/ui'
import { useActionState } from 'react'

import type { Theme } from '@/modules/identity/core/model/preferences'
import { THEME_OPTIONS } from '@/modules/identity/core/model/preferences'
import type { SettingsFormAction, SettingsFormState } from '@/modules/identity/core/model/settings'

import { SettingsFeedback } from './SettingsFeedback'

export type JoinedAtelier = {
  readonly id: string
  readonly name: string
}

export type PreferencesFormProps = {
  readonly action: SettingsFormAction
  readonly initialState: SettingsFormState
  readonly theme: Theme
  readonly defaultAtelierId: string | null
  readonly ateliers: ReadonlyArray<JoinedAtelier>
}

export const PreferencesForm = ({ action, initialState, theme, defaultAtelierId, ateliers }: PreferencesFormProps) => {
  const [state, submit, pending] = useActionState(action, initialState)

  return (
    <form action={submit} className="flex flex-col gap-8">
      <fieldset className="flex flex-col gap-4">
        <legend className="font-display text-graphite-200 mb-3 text-sm font-semibold tracking-wide uppercase">
          Thème
        </legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {THEME_OPTIONS.map((option) => (
            <label
              key={option.value}
              aria-label={option.label}
              className="has-checked:border-signal-500 border-graphite-800 bg-graphite-900 flex cursor-pointer gap-3 rounded-sm border p-4"
            >
              <input
                type="radio"
                name="theme"
                value={option.value}
                defaultChecked={option.value === theme}
                className="accent-signal-500 mt-1"
              />
              <span className="flex flex-col gap-1">
                <span className="font-display font-semibold tracking-wide uppercase">{option.label}</span>
                <span className="text-graphite-400 text-sm">{option.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="defaultAtelierId"
          className="font-display text-graphite-200 text-sm font-semibold tracking-wide uppercase"
        >
          Atelier par défaut
        </label>
        {ateliers.length === 0 ? (
          <p className="text-graphite-400 text-sm">Rejoignez un atelier pour en choisir un par défaut.</p>
        ) : (
          <>
            <select
              id="defaultAtelierId"
              name="defaultAtelierId"
              defaultValue={defaultAtelierId ?? ''}
              className="border-graphite-700 bg-graphite-900 text-graphite-50 focus:border-signal-500 h-10 rounded-sm border px-3 outline-none"
            >
              <option value="">Aucun</option>
              {ateliers.map((atelier) => (
                <option key={atelier.id} value={atelier.id}>
                  {atelier.name}
                </option>
              ))}
            </select>
            <p className="text-graphite-400 text-sm">Ajoute un raccourci vers cet atelier dans la barre du haut.</p>
          </>
        )}
      </div>

      <SettingsFeedback state={state} />

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </div>
    </form>
  )
}
