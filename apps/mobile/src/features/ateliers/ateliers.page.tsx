import { useRouter } from 'expo-router'

import { AtelierList } from '@/modules/atelier/ui/components/AtelierList'
import { useAtelierDirectory } from '@/modules/atelier/ui/hooks/use-atelier-directory'
import { useSession } from '@/modules/identity/ui/hooks/use-session'
import { Loader } from '@/modules/shared/ui/components/Loader'
import { Notice } from '@/modules/shared/ui/components/Notice'
import { Screen } from '@/modules/shared/ui/components/Screen'
import { ScreenTitle } from '@/modules/shared/ui/components/ScreenTitle'

export const AteliersPage = () => {
  const router = useRouter()
  const directory = useAtelierDirectory()
  const { user } = useSession()

  return (
    <Screen onRefresh={directory.refresh} refreshing={directory.isRefreshing}>
      <ScreenTitle
        title="Ateliers"
        subtitle={directory.locationNotice === null ? 'Les plus proches d’abord.' : undefined}
      />

      {user !== null && user.memberships.length === 0 ? (
        <Notice
          title="Aucune adhésion"
          message="Les créneaux d’un atelier sont ouverts à ses membres. Tant que vous n’en avez rejoint aucun, la semaine reste fermée."
          actionLabel="Rejoindre un atelier"
          onAction={() => router.push('/onboarding')}
        />
      ) : null}

      {directory.locationNotice === null ? null : (
        <Notice message={directory.locationNotice} actionLabel="Réessayer" onAction={directory.retryLocation} />
      )}

      {directory.error === null ? null : <Notice tone="danger" title="Annuaire" message={directory.error} />}

      {directory.isPending ? (
        <Loader />
      ) : (
        <AtelierList ateliers={directory.ateliers} onSelect={(slug) => router.push(`/ateliers/${slug}`)} />
      )}
    </Screen>
  )
}
