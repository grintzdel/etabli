import { HttpApiEndpoint, HttpApiGroup } from '@effect/platform'
import type { AtelierDetail, AtelierSummary } from '@etabli/contract'
import { routes } from '@etabli/contract'
import type { AssertEquals } from '@etabli/shared/type-level'
import * as Schema from 'effect/Schema'

import { AtelierDetailSchema, AtelierSummarySchema, ListAteliersParamsSchema, Slug } from '../domain/atelier.schema'
import { AtelierNotFoundError } from '../domain/errors'

export const atelierSummaryContractParity: AssertEquals<
  Schema.Schema.Encoded<typeof AtelierSummarySchema>,
  AtelierSummary
> = true
export const atelierDetailContractParity: AssertEquals<
  Schema.Schema.Encoded<typeof AtelierDetailSchema>,
  AtelierDetail
> = true

export const atelierApiGroup = HttpApiGroup.make('atelier')
  .add(
    HttpApiEndpoint.get('list', routes.ateliers.list)
      .setUrlParams(ListAteliersParamsSchema)
      .addSuccess(Schema.Array(AtelierSummarySchema))
  )
  .add(
    HttpApiEndpoint.get('getBySlug', routes.ateliers.getBySlug)
      .setPath(Schema.Struct({ slug: Slug }))
      .addSuccess(AtelierDetailSchema)
      .addError(AtelierNotFoundError)
  )
