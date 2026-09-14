import { HttpApi } from '@effect/platform'

import { healthApiGroup } from './health.api'

export const etabliApi = HttpApi.make('etabli').add(healthApiGroup)
