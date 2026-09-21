import { dependencies } from '../../../app/core/dependencies'
import { usePublicQuery } from '../../../app/ui/hooks/use-api-query'
import { useCurrentPosition } from '../../../geo/ui/hooks/use-current-position'
import type { AtelierSummary } from '../../core/model/atelier'

export const useAtelierDirectory = () => {
  const position = useCurrentPosition()
  const point = position.point

  const query = usePublicQuery<ReadonlyArray<AtelierSummary>>(
    ['ateliers', point?.latitude ?? null, point?.longitude ?? null],
    () => dependencies.atelier.list(point),
    !position.isPending
  )

  return {
    ateliers: query.data ?? [],
    isPending: position.isPending || query.isPending,
    error: query.error?.message ?? null,
    locationNotice: position.notice,
    retryLocation: position.retry,
    refresh: () => void query.refetch(),
    isRefreshing: query.isFetching && !query.isPending,
  }
}
