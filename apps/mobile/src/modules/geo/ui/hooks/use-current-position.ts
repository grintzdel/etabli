import { useQuery } from '@tanstack/react-query'

import { dependencies } from '../../../app/core/dependencies'
import type { GeoPoint } from '../../core/model/location'

export interface CurrentPosition {
  readonly point: GeoPoint | null
  readonly notice: string | null
  readonly isPending: boolean
  readonly retry: () => void
}

export const useCurrentPosition = (): CurrentPosition => {
  const query = useQuery({
    queryKey: ['geo', 'current'],
    queryFn: () => dependencies.location.current(),
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
  })

  const result = query.data

  return {
    point: result?.ok === true ? result.value : null,
    notice: result !== undefined && !result.ok ? result.error.message : null,
    isPending: query.isPending,
    retry: () => void query.refetch(),
  }
}
