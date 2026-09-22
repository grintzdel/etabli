import { Stack } from 'expo-router'

import { CertificationList } from '@/modules/certification/ui/components/CertificationList'
import { useMyCertifications } from '@/modules/certification/ui/hooks/use-my-certifications'
import { Loader } from '@/modules/shared/ui/components/Loader'
import { Notice } from '@/modules/shared/ui/components/Notice'
import { Screen } from '@/modules/shared/ui/components/Screen'
import { ScreenTitle } from '@/modules/shared/ui/components/ScreenTitle'

export const HabilitationsPage = () => {
  const mine = useMyCertifications()

  return (
    <Screen onRefresh={mine.refresh} refreshing={mine.isRefreshing}>
      <Stack.Screen options={{ title: 'Habilitations' }} />

      <ScreenTitle
        title="Mes habilitations"
        subtitle="Rejoindre un atelier ne vous habilite à rien. Chaque machine se demande, et c’est un fabmanager qui accorde."
      />

      {mine.error === null ? null : <Notice tone="danger" title="Habilitations" message={mine.error} />}
      {mine.requestError === null ? null : <Notice tone="danger" title="Demande" message={mine.requestError} />}

      {mine.isPending ? (
        <Loader />
      ) : (
        <CertificationList
          certifications={mine.certifications}
          requestedMachineId={mine.requestedMachineId}
          onRequest={mine.request}
        />
      )}
    </Screen>
  )
}
