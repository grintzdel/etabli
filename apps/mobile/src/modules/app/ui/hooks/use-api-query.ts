import { useMutation, useQuery, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query'

import { useSession } from '../../../identity/ui/hooks/use-session'
import type { Failure, Result } from '../../../shared/core/http/result'

const EXPIRED = 'UNAUTHORIZED'

const unwrap = async <A>(pending: Promise<Result<A, Failure>>, onExpired: () => void): Promise<A> => {
  const result = await pending
  if (result.ok) return result.value
  if (result.error.code === EXPIRED) onExpired()
  throw new Error(result.error.message)
}

export const usePublicQuery = <A>(
  queryKey: ReadonlyArray<unknown>,
  run: () => Promise<Result<A, Failure>>,
  enabled = true
): UseQueryResult<A, Error> => {
  const { signOut } = useSession()
  return useQuery({ queryKey, enabled, queryFn: () => unwrap(run(), signOut) })
}

export const useApiQuery = <A>(
  queryKey: ReadonlyArray<unknown>,
  run: (token: string) => Promise<Result<A, Failure>>,
  enabled = true
): UseQueryResult<A, Error> => {
  const { token, signOut } = useSession()

  return useQuery({
    queryKey,
    enabled: enabled && token !== null,
    queryFn: () => {
      if (token === null) throw new Error('Votre session a expiré.')
      return unwrap(run(token), signOut)
    },
  })
}

export const useApiMutation = <A, V>(
  run: (token: string, variables: V) => Promise<Result<A, Failure>>,
  onSuccess?: (value: A) => void
): UseMutationResult<A, Error, V> => {
  const { token, signOut } = useSession()

  return useMutation({
    mutationFn: (variables: V) => {
      if (token === null) throw new Error('Votre session a expiré.')
      return unwrap(run(token, variables), signOut)
    },
    ...(onSuccess === undefined ? {} : { onSuccess }),
  })
}
