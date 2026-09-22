'use server'

import { refresh } from 'next/cache'

import { certificationPort } from './container'
import { requireSession } from './session'

const idOf = (formData: FormData, key: string): string | null => {
  const value = formData.get(key)
  return typeof value === 'string' && value.length > 0 ? value : null
}

export const requestCertificationAction = async (formData: FormData): Promise<void> => {
  const machineId = idOf(formData, 'machineId')
  if (machineId === null) return

  await requireSession('/habilitations')
  await certificationPort.request(machineId)
  refresh()
}

export const grantCertificationAction = async (formData: FormData): Promise<void> => {
  const certificationId = idOf(formData, 'certificationId')
  if (certificationId === null) return

  await requireSession('/manage/certifications')
  await certificationPort.grant(certificationId)
  refresh()
}

export const revokeCertificationAction = async (formData: FormData): Promise<void> => {
  const certificationId = idOf(formData, 'certificationId')
  if (certificationId === null) return

  await requireSession('/manage/certifications')
  await certificationPort.revoke(certificationId)
  refresh()
}
