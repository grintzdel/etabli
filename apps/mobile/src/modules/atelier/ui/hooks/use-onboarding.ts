import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { dependencies } from '../../../app/core/dependencies'
import { useApiMutation, usePublicQuery } from '../../../app/ui/hooks/use-api-query'
import { useSession } from '../../../identity/ui/hooks/use-session'
import { onboardingAtelierOf } from '../../core/lib/onboarding-atelier'
import type { AtelierDetail, CompleteOnboardingInput, OnboardingResult } from '../../core/model/atelier'
import { useAtelierDirectory } from './use-atelier-directory'

export const useOnboarding = (slug: string | undefined, onJoined: () => void) => {
  const directory = useAtelierDirectory()
  const target = usePublicQuery<AtelierDetail>(
    ['atelier', slug],
    () => dependencies.atelier.getBySlug(slug ?? ''),
    slug !== undefined
  )
  const { user, refresh } = useSession()
  const queryClient = useQueryClient()
  const [chosen, setChosen] = useState<string | null>(null)
  const [practice, setPractice] = useState<ReadonlyArray<string>>(user?.practice ?? [])
  const atelierId = chosen ?? target.data?.id ?? null
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
    ateliers:
      slug === undefined ? directory.ateliers : target.data === undefined ? [] : [onboardingAtelierOf(target.data)],
    isPending: slug === undefined ? directory.isPending : target.isPending,
    error: slug === undefined ? directory.error : (target.error?.message ?? null),
    atelierId,
    selectAtelier: setChosen,
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
