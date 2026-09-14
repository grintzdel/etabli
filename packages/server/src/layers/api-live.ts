import { HttpApiBuilder } from '@effect/platform'
import { UserRepositorySqlLayer } from '@etabli/bc-identity'
import * as Layer from 'effect/Layer'

import { etabliApi } from '../http/api'
import { AtelierLive } from '../http/atelier.handlers'
import { HealthLive } from '../http/health.handlers'
import { IdentityLive } from '../http/identity.handlers'
import { OnboardingLive } from '../http/onboarding.handlers'
import { AtelierServicesLive } from './atelier.layer'
import { IdentityAuthLive, IdentityServicesLive } from './identity.layer'
import { MemberProfileLive } from './onboarding.layer'

export const ApiLive = HttpApiBuilder.api(etabliApi).pipe(
  Layer.provide(HealthLive),
  Layer.provide(IdentityLive),
  Layer.provide(AtelierLive),
  Layer.provide(OnboardingLive),
  Layer.provide(IdentityServicesLive),
  Layer.provide(AtelierServicesLive),
  Layer.provide(MemberProfileLive.pipe(Layer.provide(UserRepositorySqlLayer))),
  Layer.provide(IdentityAuthLive)
)
