import { HttpApiBuilder } from '@effect/platform'
import * as Layer from 'effect/Layer'

import { etabliApi } from '../http/api'
import { HealthLive } from '../http/health.handlers'
import { IdentityLive } from '../http/identity.handlers'
import { IdentityAuthLive, IdentityServicesLive } from './identity.layer'

export const ApiLive = HttpApiBuilder.api(etabliApi).pipe(
  Layer.provide(HealthLive),
  Layer.provide(IdentityLive),
  Layer.provide(IdentityServicesLive),
  Layer.provide(IdentityAuthLive)
)
