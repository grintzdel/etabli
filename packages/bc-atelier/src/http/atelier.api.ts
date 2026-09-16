import { HttpApiEndpoint, HttpApiGroup } from '@effect/platform'
import type { AtelierDetail, AtelierSummary, MachineDetail } from '@etabli/contract'
import { routes } from '@etabli/contract'
import { MachineId } from '@etabli/shared/schema'
import type { AssertEquals } from '@etabli/shared/type-level'
import * as Schema from 'effect/Schema'

import {
  AtelierDetailSchema,
  AtelierSummarySchema,
  ListAteliersParamsSchema,
  MachineDetailSchema,
  Slug,
} from '../domain/atelier.schema'
import { AtelierNotFoundError, MachineUnknownError } from '../domain/errors'

export const atelierSummaryContractParity: AssertEquals<
  Schema.Schema.Encoded<typeof AtelierSummarySchema>,
  AtelierSummary
> = true
export const atelierDetailContractParity: AssertEquals<
  Schema.Schema.Encoded<typeof AtelierDetailSchema>,
  AtelierDetail
> = true

export const machineDetailContractParity: AssertEquals<
  Schema.Schema.Encoded<typeof MachineDetailSchema>,
  MachineDetail
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
  .add(
    HttpApiEndpoint.get('getMachineById', routes.machines.getById)
      .setPath(Schema.Struct({ id: MachineId }))
      .addSuccess(MachineDetailSchema)
      .addError(MachineUnknownError)
  )
