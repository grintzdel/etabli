'use client'

import { Button, Surface, TextField } from '@etabli/ui'
import { useActionState } from 'react'

import { MACHINE_KIND_LABELS, MACHINE_KINDS } from '@/modules/atelier/core/model/atelier'
import type { MachineFormAction, MachineFormState } from '@/modules/atelier/core/model/machine-form'
import { MAX_SLOT_MINUTES, MIN_SLOT_MINUTES } from '@/modules/atelier/core/model/machine-form'

export type MachineFormAtelier = {
  readonly id: string
  readonly name: string
}

export type MachineFormProps = {
  readonly action: MachineFormAction
  readonly initialState: MachineFormState
  readonly ateliers: ReadonlyArray<MachineFormAtelier>
}

const selectClassName =
  'border-graphite-700 bg-graphite-900 text-graphite-50 focus:border-signal-500 h-10 rounded-sm border px-3 outline-none'

const labelClassName = 'font-display text-graphite-200 text-sm font-semibold tracking-wide uppercase'

export const MachineForm = ({ action, initialState, ateliers }: MachineFormProps) => {
  const [state, submit, pending] = useActionState(action, initialState)

  return (
    <Surface>
      <form action={submit} className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="atelierId" className={labelClassName}>
              Atelier
            </label>
            <select
              id="atelierId"
              name="atelierId"
              defaultValue={state.values.atelierId === '' ? ateliers[0]?.id : state.values.atelierId}
              className={selectClassName}
            >
              {ateliers.map((atelier) => (
                <option key={atelier.id} value={atelier.id}>
                  {atelier.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="kind" className={labelClassName}>
              Type
            </label>
            <select id="kind" name="kind" defaultValue={state.values.kind} className={selectClassName}>
              {MACHINE_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {MACHINE_KIND_LABELS[kind]}
                </option>
              ))}
            </select>
          </div>

          <TextField label="Nom" name="name" defaultValue={state.values.name} required />
          <TextField
            label="Créneau (minutes)"
            name="slotDurationMinutes"
            type="number"
            min={MIN_SLOT_MINUTES}
            max={MAX_SLOT_MINUTES}
            defaultValue={state.values.slotDurationMinutes}
            required
          />
          <TextField
            label="Description"
            name="description"
            defaultValue={state.values.description}
            className="sm:col-span-2"
          />
        </div>

        <label className="text-graphite-300 flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            name="requiresCertification"
            defaultChecked={state.values.requiresCertification}
            className="accent-signal-500"
          />
          Une habilitation est requise pour réserver cette machine
        </label>

        {state.error === null ? null : (
          <p role="alert" className="text-status-danger text-sm">
            {state.error}
          </p>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={pending}>
            {pending ? 'Ajout…' : 'Ajouter la machine'}
          </Button>
        </div>
      </form>
    </Surface>
  )
}
