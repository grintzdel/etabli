import { Stack, useRouter } from 'expo-router'

import { OnboardingForm } from '@/modules/atelier/ui/components/OnboardingForm'
import { useOnboarding } from '@/modules/atelier/ui/hooks/use-onboarding'
import { Loader } from '@/modules/shared/ui/components/Loader'
import { Notice } from '@/modules/shared/ui/components/Notice'
import { Screen } from '@/modules/shared/ui/components/Screen'
import { ScreenTitle } from '@/modules/shared/ui/components/ScreenTitle'

export const OnboardingPage = () => {
  const router = useRouter()
  const onboarding = useOnboarding(() => (router.canGoBack() ? router.back() : router.replace('/')))

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Rejoindre un atelier' }} />

      <ScreenTitle
        title="Bienvenue"
        subtitle="Deux questions et c’est fini : où vous comptez travailler, et ce que vous savez faire."
      />

      {onboarding.error === null ? null : <Notice tone="danger" title="Annuaire" message={onboarding.error} />}
      {onboarding.joinError === null ? null : <Notice tone="danger" title="Adhésion" message={onboarding.joinError} />}

      {onboarding.isPending ? (
        <Loader />
      ) : (
        <OnboardingForm
          ateliers={onboarding.ateliers}
          atelierId={onboarding.atelierId}
          onSelectAtelier={onboarding.selectAtelier}
          practice={onboarding.practice}
          onTogglePractice={onboarding.togglePractice}
          onJoin={onboarding.join}
          isJoining={onboarding.isJoining}
        />
      )}
    </Screen>
  )
}
