import { Controller, Get, Patch, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger'

import { Roles } from '../../../../infrastructure/decorators/roles.decorator.ts'
import { PlatformRole } from '../../../../shared/domain/roles.constant.ts'
import { UuidParam, ZodBody } from '../../../../shared/presentation/decorators/zod.decorator.ts'
import { jsonSchema, jsonSchemaArray } from '../../../../shared/presentation/json-schema.ts'
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard.ts'
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard.ts'
import { AtelierService } from '../../application/services/atelier.service.ts'
import {
  type AdminAtelierResponse,
  adminAtelierResponseSchema,
  toAdminAtelierResponse,
} from '../dtos/atelier.response.dto.ts'
import { type CreateAtelierBody, createAtelierBodySchema } from '../dtos/create-atelier.request.dto.ts'
import { type SetAtelierStatusBody, setAtelierStatusBodySchema } from '../dtos/set-atelier-status.request.dto.ts'

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(PlatformRole.PLATFORM_ADMIN)
@Controller('admin/ateliers')
export class AdminAtelierController {
  constructor(private readonly atelierService: AtelierService) {}

  @Get()
  @ApiOkResponse({ schema: jsonSchemaArray(adminAtelierResponseSchema) })
  async listAll(): Promise<ReadonlyArray<AdminAtelierResponse>> {
    const ateliers = await this.atelierService.listAll()
    return ateliers.map(toAdminAtelierResponse)
  }

  @Post()
  @ApiCreatedResponse({ schema: jsonSchema(adminAtelierResponseSchema) })
  async create(@ZodBody(createAtelierBodySchema) body: CreateAtelierBody): Promise<AdminAtelierResponse> {
    const atelier = await this.atelierService.create(body)
    return toAdminAtelierResponse(atelier)
  }

  @Patch(':atelierId')
  @ApiOkResponse({ schema: jsonSchema(adminAtelierResponseSchema) })
  async setStatus(
    @UuidParam('atelierId') atelierId: string,
    @ZodBody(setAtelierStatusBodySchema) body: SetAtelierStatusBody
  ): Promise<AdminAtelierResponse> {
    const atelier = await this.atelierService.setStatus(atelierId, body)
    return toAdminAtelierResponse(atelier)
  }
}
