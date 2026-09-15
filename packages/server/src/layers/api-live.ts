import { HttpApiBuilder } from '@effect/platform'
import { BookingRepositorySqlLayer } from '@etabli/bc-booking'
import { CertificationRepositorySqlLayer } from '@etabli/bc-certification'
import { UserRepositorySqlLayer } from '@etabli/bc-identity'
import * as Layer from 'effect/Layer'

import { AdminUsersLive } from '../http/admin-users.handlers'
import { AdminLive } from '../http/admin.handlers'
import { etabliApi } from '../http/api'
import { AtelierLive } from '../http/atelier.handlers'
import { BookingLive, BookingManagementLive } from '../http/booking.handlers'
import { CertificationLive, CertificationReviewLive } from '../http/certification.handlers'
import { HealthLive } from '../http/health.handlers'
import { IdentityLive } from '../http/identity.handlers'
import { ManageLive } from '../http/manage.handlers'
import { OnboardingLive } from '../http/onboarding.handlers'
import { AtelierServicesLive } from './atelier.layer'
import { CertificationCheckerLive, MachineCatalogLive, MemberRosterLive } from './booking.layer'
import { MachineDirectoryLive, MemberDirectoryLive } from './certification.layer'
import { IdentityAuthLive, IdentityServicesLive } from './identity.layer'
import { MemberProfileLive } from './onboarding.layer'

const HandledApi = HttpApiBuilder.api(etabliApi).pipe(
  Layer.provide(HealthLive),
  Layer.provide(IdentityLive),
  Layer.provide(AtelierLive),
  Layer.provide(OnboardingLive),
  Layer.provide(AdminLive),
  Layer.provide(AdminUsersLive),
  Layer.provide(ManageLive),
  Layer.provide(CertificationLive),
  Layer.provide(BookingLive),
  Layer.provide(BookingManagementLive),
  Layer.provide(CertificationReviewLive)
)

export const ApiLive = HandledApi.pipe(
  Layer.provide(IdentityServicesLive),
  Layer.provide(AtelierServicesLive),
  Layer.provide(CertificationRepositorySqlLayer),
  Layer.provide(BookingRepositorySqlLayer),
  Layer.provide(MachineCatalogLive.pipe(Layer.provide(AtelierServicesLive))),
  Layer.provide(CertificationCheckerLive.pipe(Layer.provide(CertificationRepositorySqlLayer))),
  Layer.provide(MachineDirectoryLive.pipe(Layer.provide(AtelierServicesLive))),
  Layer.provide(MemberDirectoryLive.pipe(Layer.provide(UserRepositorySqlLayer))),
  Layer.provide(MemberRosterLive.pipe(Layer.provide(UserRepositorySqlLayer))),
  Layer.provide(MemberProfileLive.pipe(Layer.provide(UserRepositorySqlLayer))),
  Layer.provide(IdentityAuthLive)
)
