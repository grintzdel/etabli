import { HttpApi } from '@effect/platform'
import { adminApiGroup, atelierApiGroup, onboardingApiGroup } from '@etabli/bc-atelier'
import { identityApiGroup } from '@etabli/bc-identity'

import { healthApiGroup } from './health.api'

export const etabliApi = HttpApi.make('etabli')
  .add(healthApiGroup)
  .add(identityApiGroup)
  .add(atelierApiGroup)
  .add(onboardingApiGroup)
  .add(adminApiGroup)
