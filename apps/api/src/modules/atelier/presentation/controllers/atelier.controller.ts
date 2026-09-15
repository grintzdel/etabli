import { Controller, Get, Param } from '@nestjs/common'
import { ApiOkResponse, ApiTags } from '@nestjs/swagger'

import { ZodQuery } from '../../../../shared/presentation/decorators/zod.decorator.ts'
import { jsonSchema, jsonSchemaArray } from '../../../../shared/presentation/json-schema.ts'
import { AtelierService } from '../../application/services/atelier.service.ts'
import {
  type AtelierDetailResponse,
  type AtelierSummaryResponse,
  atelierDetailResponseSchema,
  atelierSummaryResponseSchema,
  toAtelierDetailResponse,
  toAtelierSummaryResponse,
} from '../dtos/atelier.response.dto.ts'
import { type ListAteliersQuery, listAteliersQuerySchema } from '../dtos/list-ateliers.request.dto.ts'

@ApiTags('ateliers')
@Controller('ateliers')
export class AtelierController {
  constructor(private readonly atelierService: AtelierService) {}

  @Get()
  @ApiOkResponse({ schema: jsonSchemaArray(atelierSummaryResponseSchema) })
  async list(
    @ZodQuery(listAteliersQuerySchema) query: ListAteliersQuery
  ): Promise<ReadonlyArray<AtelierSummaryResponse>> {
    const ateliers = await this.atelierService.list(query)
    return ateliers.map(toAtelierSummaryResponse)
  }

  @Get(':slug')
  @ApiOkResponse({ schema: jsonSchema(atelierDetailResponseSchema) })
  async getBySlug(@Param('slug') slug: string): Promise<AtelierDetailResponse> {
    const atelier = await this.atelierService.getBySlug(slug)
    return toAtelierDetailResponse(atelier)
  }
}
