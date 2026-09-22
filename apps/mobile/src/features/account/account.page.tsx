import { Button, Text } from '@etabli/ui'
import { useRouter } from 'expo-router'

import { API_BASE_URL } from '@/modules/app/core/env'
import { AccountCard } from '@/modules/identity/ui/components/AccountCard'
import { useSession } from '@/modules/identity/ui/hooks/use-session'
import { Screen } from '@/modules/shared/ui/components/Screen'
import { ScreenTitle } from '@/modules/shared/ui/components/ScreenTitle'

export const AccountPage = () => {
  const router = useRouter()
  const { user, signOut } = useSession()

  return (
    <Screen>
      <ScreenTitle title="Compte" />
      {user === null ? null : <AccountCard user={user} />}
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
