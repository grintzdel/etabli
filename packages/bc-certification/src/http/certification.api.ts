import { HttpApiEndpoint, HttpApiGroup } from '@effect/platform'
import type {
  Certification as CertificationContract,
  CertificationRequest as CertificationRequestContract,
  MyCertification as MyCertificationContract,
} from '@etabli/contract'
import { routes } from '@etabli/contract'
import { AuthMiddleware } from '@etabli/shared/auth-context'
import { CertificationId } from '@etabli/shared/schema'
import type { AssertEquals } from '@etabli/shared/type-level'
import * as Schema from 'effect/Schema'

import {
  CertificationRequestSchema,
  CertificationSchema,
  MyCertificationSchema,
  RequestCertificationSchema,
} from '../domain/certification.schema'
import {
  CertificationAlreadyRequestedError,
  CertificationUnknownError,
  MachineNotCertifiableError,
} from '../domain/errors'

export const certificationContractParity: AssertEquals<
  Schema.Schema.Encoded<typeof CertificationSchema>,
  CertificationContract
> = true
export const myCertificationContractParity: AssertEquals<
  Schema.Schema.Encoded<typeof MyCertificationSchema>,
  MyCertificationContract
> = true
export const certificationRequestContractParity: AssertEquals<
  Schema.Schema.Encoded<typeof CertificationRequestSchema>,
  CertificationRequestContract
> = true

export const certificationApiGroup = HttpApiGroup.make('certification')
  .add(
    HttpApiEndpoint.post('request', routes.certifications.request)
      .setPayload(RequestCertificationSchema)
      .addSuccess(CertificationSchema, { status: 201 })
      .addError(MachineNotCertifiableError)
      .addError(CertificationAlreadyRequestedError)
  )
  .add(HttpApiEndpoint.get('mine', routes.certifications.mine).addSuccess(Schema.Array(MyCertificationSchema)))
  .middleware(AuthMiddleware)

export const certificationReviewApiGroup = HttpApiGroup.make('certificationReview')
  .add(HttpApiEndpoint.get('queue', routes.manage.certifications).addSuccess(Schema.Array(CertificationRequestSchema)))
  .add(
    HttpApiEndpoint.post('grant', routes.manage.grantCertification)
      .setPath(Schema.Struct({ id: CertificationId }))
      .addSuccess(CertificationSchema)
      .addError(CertificationUnknownError)
  )
  .add(
    HttpApiEndpoint.post('revoke', routes.manage.revokeCertification)
      .setPath(Schema.Struct({ id: CertificationId }))
      .addSuccess(CertificationSchema)
      .addError(CertificationUnknownError)
  )
  .middleware(AuthMiddleware)
