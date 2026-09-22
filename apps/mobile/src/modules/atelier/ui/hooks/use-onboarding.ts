import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { dependencies } from '../../../app/core/dependencies'
import { useApiMutation } from '../../../app/ui/hooks/use-api-query'
import { useSession } from '../../../identity/ui/hooks/use-session'
import type { CompleteOnboardingInput, OnboardingResult } from '../../core/model/atelier'
import { useAtelierDirectory } from './use-atelier-directory'

export const useOnboarding = (onJoined: () => void) => {
  const directory = useAtelierDirectory()
  const { refresh } = useSession()
  const queryClient = useQueryClient()
  const [atelierId, setAtelierId] = useState<string | null>(null)
  const [practice, setPractice] = useState<ReadonlyArray<string>>([])
  const [invalid, setInvalid] = useState<string | null>(null)

  const joined = useApiMutation<OnboardingResult, CompleteOnboardingInput>(
    (input) => dependencies.atelier.completeOnboarding(input),
    () => {
      void refresh()
      void queryClient.invalidateQueries()
      onJoined()
    }
  )

  return {
    ateliers: directory.ateliers,
    isPending: directory.isPending,
    error: directory.error,
    atelierId,
    selectAtelier: setAtelierId,
    practice,
    togglePractice: (value: string) =>
      setPractice((previous) =>
        previous.includes(value) ? previous.filter((kept) => kept !== value) : [...previous, value]
      ),
    isJoining: joined.isPending,
    joinError: invalid ?? joined.error?.message ?? null,
    join: () => {
      if (atelierId === null) return setInvalid('Choisissez un atelier.')
      if (practice.length === 0) return setInvalid('Déclarez au moins une pratique.')
      setInvalid(null)
      return joined.mutate({ atelierId, practice })
    },
  }
}
