'use server'

import { updateTag } from 'next/cache'
import { redirect } from 'next/navigation'

import { FAILURE_MESSAGES, isAtelierStatus } from '@/modules/atelier/core/model/atelier'
import type { AtelierDraftFormState } from '@/modules/atelier/core/model/atelier-draft-form'
import {
  atelierDraftValues,
  emptyAtelierDraftValues,
  parseAtelierDraft,
} from '@/modules/atelier/core/model/atelier-draft-form'

import { adminAtelierPort } from './container'
import { readSessionToken } from './session'

const ADMIN_PATH = '/admin/ateliers'

const requireToken = async (): Promise<string> => {
  const token = await readSessionToken()
  if (token === null) redirect(`/connexion?next=${ADMIN_PATH}`)
  return token
}

export const createAtelierAction = async (
  _previous: AtelierDraftFormState,
  formData: FormData
): Promise<AtelierDraftFormState> => {
  const parsed = parseAtelierDraft(formData)
  if (!parsed.ok) return { error: parsed.error, values: parsed.values }

  const result = await adminAtelierPort.create(await requireToken(), parsed.input)
  if (!result.ok) {
    return { error: FAILURE_MESSAGES[result.error.code], values: atelierDraftValues(formData) }
  }

  updateTag('ateliers')
  return { error: null, values: emptyAtelierDraftValues }
}

export const setAtelierStatusAction = async (formData: FormData): Promise<void> => {
  const atelierId = formData.get('atelierId')
  const status = formData.get('status')
  if (typeof atelierId !== 'string' || typeof status !== 'string' || !isAtelierStatus(status)) return

  const result = await adminAtelierPort.setStatus(await requireToken(), atelierId, { status })
  if (result.ok) updateTag('ateliers')
}
