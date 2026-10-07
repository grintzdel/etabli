import { Text } from '@etabli/ui'
import { useRouter } from 'expo-router'

import { AtelierDirectoryFilters } from '@/modules/atelier/ui/components/AtelierDirectoryFilters'
import { AtelierList } from '@/modules/atelier/ui/components/AtelierList'
import { AtelierMap } from '@/modules/atelier/ui/components/AtelierMap'
import { useAtelierDirectory } from '@/modules/atelier/ui/hooks/use-atelier-directory'
import { useSession } from '@/modules/identity/ui/hooks/use-session'
import { Loader } from '@/modules/shared/ui/components/Loader'
import { Notice } from '@/modules/shared/ui/components/Notice'
import { Screen } from '@/modules/shared/ui/components/Screen'
import { ScreenTitle } from '@/modules/shared/ui/components/ScreenTitle'

const countLabel = (visible: number, total: number): string =>
  visible === total
    ? `${total} atelier${total > 1 ? 's' : ''}`
    : `${visible} atelier${visible > 1 ? 's' : ''} sur ${total} dans la zone affichée`

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
          message="Les semaines des machines se consultent librement, mais seuls les membres d’un atelier y réservent un créneau."
          actionLabel="Rejoindre un atelier"
          onAction={() => router.push('/onboarding')}
        />
      ) : null}

      {directory.locationNotice === null ? null : (
        <Notice message={directory.locationNotice} actionLabel="Réessayer" onAction={directory.retryLocation} />
      )}

      <AtelierDirectoryFilters
        filters={directory.filters}
        hasFilters={directory.hasFilters}
        onSearchCity={directory.searchCity}
        onToggleMachineKind={directory.toggleMachineKind}
        onClear={directory.clearFilters}
      />

      {directory.error === null ? null : <Notice tone="danger" title="Annuaire" message={directory.error} />}

      {directory.isPending ? (
        <Loader />
      ) : (
        <>
          {directory.ateliers.length === 0 ? null : (
            <AtelierMap
              key={JSON.stringify([directory.filters, directory.hasPosition])}
              ateliers={directory.ateliers}
              showsUserLocation={directory.hasPosition}
              onBoundsChange={directory.onBoundsChange}
              onSelect={(slug) => router.push(`/ateliers/${slug}`)}
            />
          )}

          {directory.ateliers.length === 0 ? null : (
            <Text variant="caption" tone="muted" accessibilityLiveRegion="polite">
              {countLabel(directory.visibleAteliers.length, directory.ateliers.length)}
            </Text>
          )}

          <AtelierList
            ateliers={directory.visibleAteliers}
            filtered={directory.hasFilters}
            onSelect={(slug) => router.push(`/ateliers/${slug}`)}
            {...(directory.ateliers.length === 0
              ? {}
              : {
                  emptyMessage: 'Aucun atelier dans cette zone. Dézoomez ou déplacez la carte pour en voir d’autres.',
                })}
          />
        </>
      )}
    </Screen>
  )
}
