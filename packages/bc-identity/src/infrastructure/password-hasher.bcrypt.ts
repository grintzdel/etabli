import { compare, hash } from 'bcryptjs'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

import { PasswordHasher } from '../application/ports/password-hasher'

const COST = 10

export const makePasswordHasherBcrypt = () =>
  PasswordHasher.of({
    hash: (plain) => Effect.promise(() => hash(plain, COST)),
    verify: (plain, digest) => Effect.promise(() => compare(plain, digest)),
  })

export const PasswordHasherBcryptLayer = Layer.succeed(PasswordHasher, makePasswordHasherBcrypt())
