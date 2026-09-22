import { dependencies } from '../../../app/core/dependencies'
import { useApiQuery } from '../../../app/ui/hooks/use-api-query'
import type { MemberAtelier } from '../../core/model/session'

export const useMyAteliers = () => {
  const query = useApiQuery<ReadonlyArray<MemberAtelier>>(['me', 'ateliers'], () => dependencies.identity.myAteliers())

  return {
    ateliers: query.data ?? [],
    isPending: query.isPending,
    error: query.error?.message ?? null,
  }
}
