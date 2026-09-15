'use client'

import { useActionState } from 'react'

import type { NfcTagFormAction } from '@/modules/atelier/core/model/nfc-tag-form'
import { idleNfcTag, NfcTagStatus } from '@/modules/atelier/core/model/nfc-tag-form'
import { Button } from '@/ui/Button'

export type MachineNfcTagFormProps = {
  readonly machineId: string
  readonly machineName: string
  readonly nfcTagId: string | null
  readonly action: NfcTagFormAction
}

export const MachineNfcTagForm = ({ machineId, machineName, nfcTagId, action }: MachineNfcTagFormProps) => {
  const [state, submit, pending] = useActionState(action, idleNfcTag)
  const fieldId = `nfc-${machineId}`

  return (
    <form action={submit} className="flex flex-col items-start gap-2">
      <input type="hidden" name="machineId" value={machineId} />
      <label htmlFor={fieldId} className="sr-only">{`Tag NFC — ${machineName}`}</label>
      <div className="flex flex-wrap items-center gap-2">
        <input
          id={fieldId}
          name="nfcTagId"
          type="text"
          defaultValue={nfcTagId ?? ''}
          placeholder="Aucun tag"
          className="border-graphite-700 bg-graphite-950 text-graphite-50 focus:border-signal-500 h-9 w-40 rounded-sm border px-2 outline-none"
        />
        <Button type="submit" variant="ghost" size="sm" disabled={pending}>
          {pending ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </div>
      {state.message === null ? null : (
        <p
          role={state.status === NfcTagStatus.ERROR ? 'alert' : 'status'}
          className={state.status === NfcTagStatus.ERROR ? 'text-status-danger text-sm' : 'text-status-ok text-sm'}
        >
          {state.message}
        </p>
      )}
    </form>
  )
}
