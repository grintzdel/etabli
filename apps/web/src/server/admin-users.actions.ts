'use server'

import { refresh } from 'next/cache'
import { redirect } from 'next/navigation'

import { AtelierFailureCode } from '@/modules/atelier/core/model/atelier'
import type { UpdateAdminUser } from '@/modules/identity/core/model/admin-user'
import { isMembershipRole, isPlatformRole, isUserStatus } from '@/modules/identity/core/model/admin-user'
import { IdentityFailureCode } from '@/modules/identity/core/model/session'
import type { SettingsFormState } from '@/modules/identity/core/model/settings'
import { settingsRefused, settingsSaved } from '@/modules/identity/core/model/settings'

import { adminAtelierPort, adminUserPort } from './container'
import { requireSession } from './session'

const ADMIN_PATH = '/admin/utilisateurs'

const readPatch = (formData: FormData): UpdateAdminUser => {
  const platformRole = formData.get('platformRole')
  const status = formData.get('status')

  return {
    ...(typeof platformRole === 'string' && isPlatformRole(platformRole) ? { platformRole } : {}),
    ...(typeof status === 'string' && isUserStatus(status) ? { status } : {}),
  }
}

export const updateAdminUserAction = async (
  _state: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> => {
  await requireSession(ADMIN_PATH)

  const userId = formData.get('userId')
  if (typeof userId !== 'string') return settingsRefused('Ce compte n’existe pas.')

  const patch = readPatch(formData)
  if (Object.keys(patch).length === 0) return settingsRefused('Rien à changer sur ce compte.')

  const result = await adminUserPort.update(userId, patch)
  if (!result.ok) {
    if (result.error.code === IdentityFailureCode.UNAUTHORIZED) redirect(`/connexion?next=${ADMIN_PATH}`)
    return settingsRefused(result.error.message)
  }

  refresh()
  return settingsSaved('Compte mis à jour.')
}

export const setMembershipRoleAction = async (
  _state: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> => {
  await requireSession(ADMIN_PATH)

  const userId = formData.get('userId')
  const atelierId = formData.get('atelierId')
  const role = formData.get('role')
  if (typeof userId !== 'string' || typeof atelierId !== 'string' || typeof role !== 'string') {
    return settingsRefused('Cette adhésion n’existe pas.')
  }
  if (!isMembershipRole(role)) return settingsRefused('Ce rôle n’existe pas.')

  const result = await adminAtelierPort.setMembershipRole(atelierId, userId, { role })
  if (!result.ok) {
    if (result.error.code === AtelierFailureCode.UNAUTHORIZED) redirect(`/connexion?next=${ADMIN_PATH}`)
    if (result.error.code === AtelierFailureCode.NOT_FOUND) {
      return settingsRefused('Ce compte n’est plus membre de cet atelier.')
    }
    return settingsRefused(result.error.message)
  }

  refresh()
  return settingsSaved('Rôle mis à jour.')
}
