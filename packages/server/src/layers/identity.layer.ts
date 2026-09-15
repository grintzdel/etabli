import { AtelierRepositorySqlLayer } from '@etabli/bc-atelier'
import {
  AuthMiddlewareLive,
  PasswordHasherBcryptLayer,
  PreferencesRepositorySqlLayer,
  TokenIssuerJoseLayer,
  UserRepositorySqlLayer,
} from '@etabli/bc-identity'
import { IdGeneratorCryptoLive } from '@etabli/shared/id'
import { ClockSystemLive } from '@etabli/shared/time'
import * as Layer from 'effect/Layer'

import { MemberAteliersLive, MembershipLookupLive } from './onboarding.layer'

const TokensLive = TokenIssuerJoseLayer.pipe(Layer.provide(ClockSystemLive))

const MembershipsLive = MembershipLookupLive.pipe(Layer.provide(AtelierRepositorySqlLayer))

const MemberAteliersServiceLive = MemberAteliersLive.pipe(Layer.provide(AtelierRepositorySqlLayer))

export const IdentityServicesLive = Layer.mergeAll(
  ClockSystemLive,
  IdGeneratorCryptoLive,
  PasswordHasherBcryptLayer,
  TokensLive,
  UserRepositorySqlLayer,
  PreferencesRepositorySqlLayer,
  MembershipsLive,
  MemberAteliersServiceLive
)

export const IdentityAuthLive = AuthMiddlewareLive.pipe(
  Layer.provide(TokensLive),
  Layer.provide(UserRepositorySqlLayer),
  Layer.provide(MembershipsLive)
)
