import * as Context from 'effect/Context'
import type * as Effect from 'effect/Effect'

export interface PasswordHasherService {
  readonly hash: (plain: string) => Effect.Effect<string>
  readonly verify: (plain: string, hash: string) => Effect.Effect<boolean>
}

export class PasswordHasher extends Context.Tag('@etabli/PasswordHasher')<PasswordHasher, PasswordHasherService>() {}
