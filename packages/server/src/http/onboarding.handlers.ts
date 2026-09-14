import { HttpApiBuilder } from '@effect/platform'
import { onboardingHandlers } from '@etabli/bc-atelier'

import { etabliApi } from './api'

export const OnboardingLive = HttpApiBuilder.group(etabliApi, 'onboarding', (handlers) =>
  handlers.handle('complete', onboardingHandlers.complete)
)
