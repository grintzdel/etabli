import { PgClient } from '@effect/sql-pg'
import * as Config from 'effect/Config'

export const SqlClientLive = PgClient.layerConfig({
  url: Config.redacted('DATABASE_URL'),
})
