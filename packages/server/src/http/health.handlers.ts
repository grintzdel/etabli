import { HttpApiBuilder } from '@effect/platform'
import * as Effect from 'effect/Effect'

import { etabliApi } from './api'

const BOOT_TIME = Date.now()
const VERSION = process.env['npm_package_version'] ?? '0.0.0'

export const HealthLive = HttpApiBuilder.group(etabliApi, 'health', (handlers) =>
  handlers.handle('check', () => Effect.succeed({ ok: true, version: VERSION, uptimeMs: Date.now() - BOOT_TIME }))
)
