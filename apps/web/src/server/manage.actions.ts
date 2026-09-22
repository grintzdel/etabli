'use server'

import { updateTag } from 'next/cache'
import { redirect } from 'next/navigation'

import { AtelierFailureCode, FAILURE_MESSAGES, isMachineStatus } from '@/modules/atelier/core/model/atelier'
import type { CheckInTokenFormState } from '@/modules/atelier/core/model/check-in-token-form'
import { checkInTokenRefused, checkInTokenRotated } from '@/modules/atelier/core/model/check-in-token-form'
import type { MachineFormState } from '@/modules/atelier/core/model/machine-form'
import { emptyMachineFormValues, machineFormValues, parseMachineForm } from '@/modules/atelier/core/model/machine-form'

import { manageMachinePort } from './container'
import { readSessionToken } from './session'

const MANAGE_PATH = '/manage/machines'

const requireToken = async (): Promise<string> => {
  const token = await readSessionToken()
  if (token === null) redirect(`/connexion?next=${MANAGE_PATH}`)
  return token
}

export const createMachineAction = async (
  _previous: MachineFormState,
  formData: FormData
): Promise<MachineFormState> => {
  const parsed = parseMachineForm(formData)
  if (!parsed.ok) return { error: parsed.error, values: parsed.values }

  const result = await manageMachinePort.create(await requireToken(), parsed.input)
  if (!result.ok) return { error: FAILURE_MESSAGES[result.error.code], values: machineFormValues(formData) }

  updateTag('ateliers')
  return { error: null, values: emptyMachineFormValues }
}

export const setMachineStatusAction = async (formData: FormData): Promise<void> => {
  const machineId = formData.get('machineId')
  const status = formData.get('status')
  if (typeof machineId !== 'string' || typeof status !== 'string' || !isMachineStatus(status)) return

  const result = await manageMachinePort.update(await requireToken(), machineId, { status })
  if (result.ok) updateTag('ateliers')
}

export const regenerateCheckInTokenAction = async (
  _state: CheckInTokenFormState,
  formData: FormData
): Promise<CheckInTokenFormState> => {
  const machineId = formData.get('machineId')
  if (typeof machineId !== 'string') return checkInTokenRefused('Cette machine n’existe pas.')

  const result = await manageMachinePort.regenerateCheckInToken(await requireToken(), machineId)
  if (!result.ok) {
    if (result.error.code === AtelierFailureCode.NOT_FOUND) return checkInTokenRefused('Cette machine n’existe pas.')
    return checkInTokenRefused(result.error.message)
  }

  updateTag('ateliers')
  return checkInTokenRotated('Nouveau QR généré. L’ancien autocollant ne pointe plus : réimprimez-le.')
}
