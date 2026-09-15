'use client'

import { useActionState } from 'react'

import type { SettingsFormAction, SettingsFormState } from '@/modules/identity/core/model/settings'
import { Button } from '@/ui/Button'
import { TextField } from '@/ui/TextField'

import { SettingsFeedback } from './SettingsFeedback'

export type ProfileFormProps = {
  readonly action: SettingsFormAction
  readonly initialState: SettingsFormState
  readonly displayName: string
  readonly practice: ReadonlyArray<string>
  readonly practices: ReadonlyArray<string>
}

export const ProfileForm = ({ action, initialState, displayName, practice, practices }: ProfileFormProps) => {
  const [state, submit, pending] = useActionState(action, initialState)

  return (
    <form action={submit} className="flex flex-col gap-8">
      <TextField
        label="Nom affiché"
        name="displayName"
        defaultValue={displayName}
        autoComplete="name"
        required
        maxLength={80}
      />

      <fieldset className="flex flex-col gap-4">
        <legend className="font-display text-graphite-200 mb-3 text-sm font-semibold tracking-wide uppercase">
          Pratiques déclarées
        </legend>
        <div className="flex flex-wrap gap-3">
          {practices.map((candidate) => (
            <label
              key={candidate}
              className="has-checked:border-signal-500 has-checked:text-graphite-50 border-graphite-800 text-graphite-300 flex cursor-pointer items-center gap-2 rounded-sm border px-4 py-2"
            >
              <input
                type="checkbox"
                name="practice"
                value={candidate}
                defaultChecked={practice.includes(candidate)}
                className="accent-signal-500"
              />
              {candidate}
            </label>
          ))}
        </div>
        <p className="text-graphite-400 text-sm">Déclarez-en au moins une, comme à l’inscription.</p>
      </fieldset>

      <SettingsFeedback state={state} />

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </div>
    </form>
  )
}
