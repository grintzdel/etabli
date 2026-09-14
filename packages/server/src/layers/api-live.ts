import { HttpApiBuilder } from '@effect/platform'
import { BookingRepositorySqlLayer } from '@etabli/bc-booking'
import { CertificationRepositorySqlLayer } from '@etabli/bc-certification'
import { UserRepositorySqlLayer } from '@etabli/bc-identity'
import * as Layer from 'effect/Layer'

import { AdminLive } from '../http/admin.handlers'
import { etabliApi } from '../http/api'
import { AtelierLive } from '../http/atelier.handlers'
import { BookingLive } from '../http/booking.handlers'
import { CertificationLive, CertificationReviewLive } from '../http/certification.handlers'
import { HealthLive } from '../http/health.handlers'
import { IdentityLive } from '../http/identity.handlers'
import { ManageLive } from '../http/manage.handlers'
import { OnboardingLive } from '../http/onboarding.handlers'
import { AtelierServicesLive } from './atelier.layer'
import { MachineCatalogLive } from './booking.layer'
import { MachineDirectoryLive, MemberDirectoryLive } from './certification.layer'
import { IdentityAuthLive, IdentityServicesLive } from './identity.layer'
import { MemberProfileLive } from './onboarding.layer'

export const ApiLive = HttpApiBuilder.api(etabliApi).pipe(
  Layer.provide(HealthLive),
  Layer.provide(IdentityLive),
  Layer.provide(AtelierLive),
  Layer.provide(OnboardingLive),
  Layer.provide(AdminLive),
  Layer.provide(ManageLive),
  Layer.provide(CertificationLive),
  Layer.provide(BookingLive),
  Layer.provide(CertificationReviewLive),
  Layer.provide(IdentityServicesLive),
  Layer.provide(AtelierServicesLive),
  Layer.provide(CertificationRepositorySqlLayer),
  Layer.provide(BookingRepositorySqlLayer),
  Layer.provide(MachineCatalogLive.pipe(Layer.provide(AtelierServicesLive))),
  Layer.provide(MachineDirectoryLive.pipe(Layer.provide(AtelierServicesLive))),
  Layer.provide(MemberDirectoryLive.pipe(Layer.provide(UserRepositorySqlLayer))),
  Layer.provide(MemberProfileLive.pipe(Layer.provide(UserRepositorySqlLayer))),
  Layer.provide(IdentityAuthLive)
)
