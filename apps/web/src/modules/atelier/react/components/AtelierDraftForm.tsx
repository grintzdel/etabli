'use client'

import { Button, Surface, TextField } from '@etabli/ui'
import { useActionState } from 'react'

import type { AtelierDraftFormAction, AtelierDraftFormState } from '@/modules/atelier/core/model/atelier-draft-form'

export type AtelierDraftFormProps = {
  readonly action: AtelierDraftFormAction
  readonly initialState: AtelierDraftFormState
}

export const AtelierDraftForm = ({ action, initialState }: AtelierDraftFormProps) => {
  const [state, submit, pending] = useActionState(action, initialState)
  return (
    <Surface>
      <form action={submit} className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Nom" name="name" defaultValue={state.values.name} required />
          <TextField
            label="Identifiant d’URL"
            name="slug"
            defaultValue={state.values.slug}
            placeholder="la-forge"
            required
          />
          <TextField label="Ville" name="city" defaultValue={state.values.city} required />
          <TextField label="Code postal" name="postalCode" defaultValue={state.values.postalCode} />
          <TextField label="Rue" name="street" defaultValue={state.values.street} className="sm:col-span-2" />
          <TextField
            label="Description"
            name="description"
            defaultValue={state.values.description}
            className="sm:col-span-2"
          />
          <TextField
            label="Latitude"
            name="latitude"
            type="number"
            step="any"
            defaultValue={state.values.latitude}
            required
          />
          <TextField
            label="Longitude"
            name="longitude"
            type="number"
            step="any"
            defaultValue={state.values.longitude}
            required
          />
        </div>

        {state.error === null ? null : (
          <p role="alert" className="text-status-danger text-sm">
            {state.error}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-graphite-400 text-sm">
            L’atelier naît en brouillon. Il n’entre dans l’annuaire public qu’une fois publié.
          </p>
          <Button type="submit" disabled={pending}>
            {pending ? 'Création…' : 'Créer le brouillon'}
          </Button>
        </div>
      </form>
    </Surface>
  )
}
