'use client'

import { useActionState } from 'react'

import type { MembershipRole, PlatformRole, UserStatus } from '@/modules/identity/core/model/admin-user'
import type { SettingsFormAction } from '@/modules/identity/core/model/settings'
import { idleSettings, SettingsStatus } from '@/modules/identity/core/model/settings'
import { Button } from '@/ui/Button'

export type AdminUserRowActionProps = {
  readonly userId: string
  readonly label: string
  readonly pendingLabel: string
  readonly variant?: 'primary' | 'ghost' | 'danger'
  readonly platformRole?: PlatformRole
  readonly status?: UserStatus
  readonly atelierId?: string
  readonly role?: MembershipRole
  readonly action: SettingsFormAction
}

export const AdminUserRowAction = ({
  userId,
  label,
  pendingLabel,
  variant,
  platformRole,
  status,
  atelierId,
  role,
  action,
}: AdminUserRowActionProps) => {
  const [state, submit, pending] = useActionState(action, idleSettings)

  return (
    <form action={submit} className="flex flex-col items-start gap-2">
      <input type="hidden" name="userId" value={userId} />
      {platformRole === undefined ? null : <input type="hidden" name="platformRole" value={platformRole} />}
      {status === undefined ? null : <input type="hidden" name="status" value={status} />}
      {atelierId === undefined ? null : <input type="hidden" name="atelierId" value={atelierId} />}
      {role === undefined ? null : <input type="hidden" name="role" value={role} />}
      <Button type="submit" size="sm" variant={variant} disabled={pending}>
        {pending ? pendingLabel : label}
      </Button>
      {state.status === SettingsStatus.ERROR && state.message !== null ? (
        <p role="alert" className="text-status-danger text-sm">
          {state.message}
        </p>
      ) : null}
    </form>
  )
}
