import {
  AuthMiddlewareLive,
  PasswordHasherBcryptLayer,
  TokenIssuerJoseLayer,
  UserRepositorySqlLayer,
} from '@etabli/bc-identity'
import { IdGeneratorCryptoLive } from '@etabli/shared/id'
import { ClockSystemLive } from '@etabli/shared/time'
import * as Layer from 'effect/Layer'

const TokensLive = TokenIssuerJoseLayer.pipe(Layer.provide(ClockSystemLive))

export const IdentityServicesLive = Layer.mergeAll(
  ClockSystemLive,
  IdGeneratorCryptoLive,
  PasswordHasherBcryptLayer,
  TokensLive,
  UserRepositorySqlLayer
)

export const IdentityAuthLive = AuthMiddlewareLive.pipe(
  Layer.provide(TokensLive),
  Layer.provide(UserRepositorySqlLayer)
)
