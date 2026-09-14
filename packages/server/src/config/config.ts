import * as Config from 'effect/Config'

export const AppConfig = Config.all({
  port: Config.integer('PORT').pipe(Config.withDefault(3001)),
  env: Config.literal('development', 'test', 'production')('NODE_ENV').pipe(Config.withDefault('development' as const)),
  databaseUrl: Config.redacted('DATABASE_URL'),
  jwtSecret: Config.redacted('JWT_SECRET'),
  cookieSecure: Config.boolean('COOKIE_SECURE').pipe(Config.withDefault(false)),
  cookieDomain: Config.string('COOKIE_DOMAIN').pipe(Config.withDefault('localhost')),
})

export type AppConfig = Config.Config.Success<typeof AppConfig>
