'use server'

import { redirect } from 'next/navigation'

import { FAILURE_MESSAGES, AtelierFailureCode } from '@/modules/atelier/core/model/atelier'
import type { OnboardingFormState } from '@/modules/atelier/core/model/onboarding-form'

import { atelierPort } from './container'
import { readSessionToken } from './session'

export const completeOnboardingAction = async (
  _previous: OnboardingFormState,
  formData: FormData
): Promise<OnboardingFormState> => {
  const atelierId = formData.get('atelierId')
  const practice = formData.getAll('practice').filter((value): value is string => typeof value === 'string')

  if (typeof atelierId !== 'string' || atelierId.length === 0) {
    return { error: 'Choisissez un atelier.', practice }
  }
  if (practice.length === 0) {
    return { error: 'Déclarez au moins une pratique.', practice }
  }

  const token = await readSessionToken()
  if (token === null) redirect('/connexion?next=/bienvenue')

  const result = await atelierPort.completeOnboarding(token, { atelierId, practice })
  if (!result.ok) {
    if (result.error.code === AtelierFailureCode.UNAUTHORIZED) redirect('/connexion?next=/bienvenue')
    return { error: FAILURE_MESSAGES[result.error.code], practice }
  }

  redirect('/compte')
}
