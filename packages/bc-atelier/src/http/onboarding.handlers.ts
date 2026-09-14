import * as Effect from 'effect/Effect'

import { completeOnboarding } from '../application/commands/complete-onboarding/complete-onboarding.command'
import type { CompleteOnboarding } from '../domain/atelier.schema'

export const onboardingHandlers = {
  complete: ({ payload }: { readonly payload: CompleteOnboarding }) =>
    completeOnboarding(payload).pipe(Effect.catchTag('RepoError', (error) => Effect.die(error))),
}
