import type { Result } from '@etabli/api-client'
import { useMutation, useQuery, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query'

import { useSession } from '../../../identity/ui/hooks/use-session'

const EXPIRED = 'UNAUTHORIZED'

const unwrap = async <A>(pending: Promise<Result<A, string>>, onExpired: () => void): Promise<A> => {
  const result = await pending
  if (result.ok) return result.value
  if (result.error.code === EXPIRED) onExpired()
  throw new Error(result.error.message)
}

export const usePublicQuery = <A>(
  queryKey: ReadonlyArray<unknown>,
  run: () => Promise<Result<A, string>>,
  enabled = true
): UseQueryResult<A, Error> => {
  const { signOut } = useSession()
  return useQuery({ queryKey, enabled, queryFn: () => unwrap(run(), signOut) })
}

export const useApiQuery = <A>(
  queryKey: ReadonlyArray<unknown>,
  run: () => Promise<Result<A, string>>,
  enabled = true
): UseQueryResult<A, Error> => {
  const { token, signOut } = useSession()

  return useQuery({
    queryKey,
    enabled: enabled && token !== null,
    queryFn: () => {
      if (token === null) throw new Error('Votre session a expiré.')
      return unwrap(run(), signOut)
    },
  })
}

export const useApiMutation = <A, V>(
  run: (variables: V) => Promise<Result<A, string>>,
  onSuccess?: (value: A) => void
): UseMutationResult<A, Error, V> => {
  const { token, signOut } = useSession()

  return useMutation({
    mutationFn: (variables: V) => {
      if (token === null) throw new Error('Votre session a expiré.')
      return unwrap(run(variables), signOut)
    },
    ...(onSuccess === undefined ? {} : { onSuccess }),
  })
}
