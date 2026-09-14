import { HttpApiBuilder } from '@effect/platform'
import { certificationHandlers, certificationReviewHandlers } from '@etabli/bc-certification'

import { etabliApi } from './api'

export const CertificationLive = HttpApiBuilder.group(etabliApi, 'certification', (handlers) =>
  handlers.handle('request', certificationHandlers.request).handle('mine', certificationHandlers.mine)
)

export const CertificationReviewLive = HttpApiBuilder.group(etabliApi, 'certificationReview', (handlers) =>
  handlers
    .handle('queue', certificationReviewHandlers.queue)
    .handle('grant', certificationReviewHandlers.grant)
    .handle('revoke', certificationReviewHandlers.revoke)
)
