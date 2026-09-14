import type { CertificationId } from '@etabli/shared/schema'
import * as Effect from 'effect/Effect'

import {
  grantCertification,
  revokeCertification,
} from '../application/commands/decide-certification/decide-certification.command'
import { requestCertification } from '../application/commands/request-certification/request-certification.command'
import { listCertificationRequests } from '../application/queries/list-certification-requests/list-certification-requests.query'
import { listMyCertifications } from '../application/queries/list-my-certifications/list-my-certifications.query'
import type { RequestCertification } from '../domain/certification.schema'

export const certificationHandlers = {
  request: ({ payload }: { readonly payload: RequestCertification }) =>
    requestCertification(payload).pipe(Effect.catchTag('RepoError', (error) => Effect.die(error))),
  mine: () => listMyCertifications().pipe(Effect.catchTag('RepoError', (error) => Effect.die(error))),
}

export const certificationReviewHandlers = {
  queue: () => listCertificationRequests().pipe(Effect.catchTag('RepoError', (error) => Effect.die(error))),
  grant: ({ path }: { readonly path: { readonly id: CertificationId } }) =>
    grantCertification(path.id).pipe(Effect.catchTag('RepoError', (error) => Effect.die(error))),
  revoke: ({ path }: { readonly path: { readonly id: CertificationId } }) =>
    revokeCertification(path.id).pipe(Effect.catchTag('RepoError', (error) => Effect.die(error))),
}
