import { dependencies } from '../../../app/core/dependencies'
import { usePublicQuery } from '../../../app/ui/hooks/use-api-query'
import type { MachineDetail } from '../../core/model/atelier'

export const useMachine = (id: string) => {
  const query = usePublicQuery<MachineDetail>(['machine', id], () => dependencies.atelier.getMachineById(id))

  return {
    machine: query.data ?? null,
    isPending: query.isPending,
    error: query.error?.message ?? null,
  }
}
