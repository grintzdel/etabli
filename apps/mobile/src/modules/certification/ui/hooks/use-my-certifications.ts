import { useQueryClient } from '@tanstack/react-query'

import { dependencies } from '../../../app/core/dependencies'
import { useApiMutation, useApiQuery } from '../../../app/ui/hooks/use-api-query'
import type { MyCertification } from '../../core/model/certification'

const KEY: ReadonlyArray<unknown> = ['certifications', 'mine']

export const useMyCertifications = () => {
  const queryClient = useQueryClient()
  const query = useApiQuery<ReadonlyArray<MyCertification>>(KEY, () => dependencies.certification.mine())

  const asked = useApiMutation<void, string>(
    (machineId) => dependencies.certification.request(machineId),
    () => void queryClient.invalidateQueries({ queryKey: KEY })
  )

  return {
    certifications: query.data ?? [],
    isPending: query.isPending,
    error: query.error?.message ?? null,
    refresh: () => void query.refetch(),
    isRefreshing: query.isFetching && !query.isPending,
    request: (machineId: string) => asked.mutate(machineId),
    requestedMachineId: asked.isPending ? (asked.variables ?? null) : null,
    requestError: asked.error?.message ?? null,
  }
}
