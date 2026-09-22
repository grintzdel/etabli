import { Button, Text } from '@etabli/ui'
import { useRouter } from 'expo-router'

import { API_BASE_URL } from '@/modules/app/core/env'
import { AccountCard } from '@/modules/identity/ui/components/AccountCard'
import { MembershipList } from '@/modules/identity/ui/components/MembershipList'
import { useMyAteliers } from '@/modules/identity/ui/hooks/use-my-ateliers'
import { useSession } from '@/modules/identity/ui/hooks/use-session'
import { Loader } from '@/modules/shared/ui/components/Loader'
import { Notice } from '@/modules/shared/ui/components/Notice'
import { Screen } from '@/modules/shared/ui/components/Screen'
import { ScreenTitle } from '@/modules/shared/ui/components/ScreenTitle'

export const AccountPage = () => {
  const router = useRouter()
  const { user, signOut } = useSession()
  const mine = useMyAteliers()

  return (
    <Screen>
      <ScreenTitle title="Compte" />
      {user === null ? null : <AccountCard user={user} />}

      <Text variant="label">Mes ateliers</Text>
      {mine.error === null ? null : <Notice tone="danger" title="Ateliers" message={mine.error} />}
      {mine.isPending ? (
        <Loader />
      ) : mine.ateliers.length === 0 ? (
        <Notice
          message="Vous n’avez rejoint aucun atelier."
          actionLabel="Rejoindre un atelier"
          onAction={() => router.push('/onboarding')}
        />
      ) : (
        <MembershipList ateliers={mine.ateliers} onSelect={(slug) => router.push(`/ateliers/${slug}`)} />
      )}

      <Button variant="ghost" onPress={() => router.push('/habilitations')}>
        Mes habilitations
      </Button>
      <Button variant="ghost" onPress={signOut}>
        Se déconnecter
      </Button>
      <Text variant="caption" tone="muted">{`API : ${API_BASE_URL}`}</Text>
    </Screen>
  )
}
