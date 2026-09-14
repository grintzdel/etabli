'use server'

import { refresh } from 'next/cache'
import { redirect } from 'next/navigation'

import { certificationPort } from './container'
import { readSessionToken } from './session'

const requireToken = async (next: string): Promise<string> => {
  const token = await readSessionToken()
  if (token === null) redirect(`/connexion?next=${next}`)
  return token
}

const idOf = (formData: FormData, key: string): string | null => {
  const value = formData.get(key)
  return typeof value === 'string' && value.length > 0 ? value : null
}

export const requestCertificationAction = async (formData: FormData): Promise<void> => {
  const machineId = idOf(formData, 'machineId')
  if (machineId === null) return

  await certificationPort.request(await requireToken('/habilitations'), machineId)
  refresh()
}

export const grantCertificationAction = async (formData: FormData): Promise<void> => {
  const certificationId = idOf(formData, 'certificationId')
  if (certificationId === null) return

  await certificationPort.grant(await requireToken('/manage/certifications'), certificationId)
  refresh()
}

export const revokeCertificationAction = async (formData: FormData): Promise<void> => {
  const certificationId = idOf(formData, 'certificationId')
  if (certificationId === null) return

  await certificationPort.revoke(await requireToken('/manage/certifications'), certificationId)
  refresh()
}
