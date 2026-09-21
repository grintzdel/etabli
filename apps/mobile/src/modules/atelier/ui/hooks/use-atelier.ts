import { dependencies } from '../../../app/core/dependencies'
import { usePublicQuery } from '../../../app/ui/hooks/use-api-query'
import type { AtelierDetail } from '../../core/model/atelier'

export const useAtelier = (slug: string) => {
  const query = usePublicQuery<AtelierDetail>(['atelier', slug], () => dependencies.atelier.getBySlug(slug))

  return {
    atelier: query.data ?? null,
    isPending: query.isPending,
    error: query.error?.message ?? null,
  }
}
