import { Surface, Text } from '@etabli/ui'
import { Stack, useRouter } from 'expo-router'
import { StyleSheet } from 'react-native'

import { AtelierPhoto } from '@/modules/atelier/ui/components/AtelierPhoto'
import { MachineList } from '@/modules/atelier/ui/components/MachineList'
import { useAtelier } from '@/modules/atelier/ui/hooks/use-atelier'
import { Loader } from '@/modules/shared/ui/components/Loader'
import { Notice } from '@/modules/shared/ui/components/Notice'
import { Screen } from '@/modules/shared/ui/components/Screen'
import { ScreenTitle } from '@/modules/shared/ui/components/ScreenTitle'

const PHOTO_HEIGHT = 200

export const AtelierPage = ({ slug }: { readonly slug: string }) => {
  const router = useRouter()
  const { atelier, isPending, error } = useAtelier(slug)

  return (
    <Screen>
      <Stack.Screen options={{ title: atelier?.name ?? 'Atelier' }} />

      {error === null ? null : <Notice tone="danger" title="Atelier" message={error} />}
      {isPending ? <Loader /> : null}

      {atelier === null ? null : (
        <>
          <Surface style={styles.photo}>
            <AtelierPhoto
              slug={atelier.slug}
              kinds={[...new Set(atelier.machines.map((machine) => machine.kind))].sort()}
              height={PHOTO_HEIGHT}
            />
          </Surface>
          <ScreenTitle title={atelier.name} subtitle={`${atelier.street} — ${atelier.postalCode} ${atelier.city}`} />
          <Text tone="muted">{atelier.description}</Text>
          <Text variant="label">Machines</Text>
          <MachineList machines={atelier.machines} onSelect={(id) => router.push(`/machines/${id}`)} />
        </>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  photo: { overflow: 'hidden', padding: 0 },
})
