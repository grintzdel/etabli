import { HttpApiBuilder } from '@effect/platform'
import * as Layer from 'effect/Layer'

import { etabliApi } from '../http/api'
import { HealthLive } from '../http/health.handlers'

export const ApiLive = HttpApiBuilder.api(etabliApi).pipe(Layer.provide(HealthLive))
