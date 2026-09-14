import { AtelierRepositorySqlLayer } from '@etabli/bc-atelier'
import {
  AuthMiddlewareLive,
  PasswordHasherBcryptLayer,
  TokenIssuerJoseLayer,
  UserRepositorySqlLayer,
} from '@etabli/bc-identity'
import { IdGeneratorCryptoLive } from '@etabli/shared/id'
import { ClockSystemLive } from '@etabli/shared/time'
import * as Layer from 'effect/Layer'

import { MembershipLookupLive } from './onboarding.layer'

const TokensLive = TokenIssuerJoseLayer.pipe(Layer.provide(ClockSystemLive))

const MembershipsLive = MembershipLookupLive.pipe(Layer.provide(AtelierRepositorySqlLayer))

export const IdentityServicesLive = Layer.mergeAll(
  ClockSystemLive,
  IdGeneratorCryptoLive,
  PasswordHasherBcryptLayer,
  TokensLive,
  UserRepositorySqlLayer,
  MembershipsLive
)

export const IdentityAuthLive = AuthMiddlewareLive.pipe(
  Layer.provide(TokensLive),
  Layer.provide(UserRepositorySqlLayer),
  Layer.provide(MembershipsLive)
)
