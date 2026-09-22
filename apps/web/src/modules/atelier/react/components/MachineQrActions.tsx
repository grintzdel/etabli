'use client'

import { Button } from '@etabli/ui'
import { buttonVariants } from '@etabli/ui/web'
import Link from 'next/link'
import { useActionState } from 'react'

import type { CheckInTokenFormAction } from '@/modules/atelier/core/model/check-in-token-form'
import { CheckInTokenStatus, idleCheckInToken } from '@/modules/atelier/core/model/check-in-token-form'

export type MachineQrActionsProps = {
  readonly machineId: string
  readonly machineName: string
  readonly action: CheckInTokenFormAction
}

export const MachineQrActions = ({ machineId, machineName, action }: MachineQrActionsProps) => {
  const [state, submit, pending] = useActionState(action, idleCheckInToken)

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Link href={`/manage/machines/${machineId}/qr`} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
          {`Imprimer le QR — ${machineName}`}
        </Link>
        <form action={submit}>
          <input type="hidden" name="machineId" value={machineId} />
          <Button type="submit" variant="ghost" size="sm" disabled={pending}>
            {pending ? 'Régénération…' : `Régénérer — ${machineName}`}
          </Button>
        </form>
      </div>
      {state.message === null ? null : (
        <p
          role={state.status === CheckInTokenStatus.ERROR ? 'alert' : 'status'}
          className={
            state.status === CheckInTokenStatus.ERROR ? 'text-status-danger text-sm' : 'text-status-ok text-sm'
          }
        >
          {state.message}
        </p>
      )}
    </div>
  )
}
