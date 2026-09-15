import { Controller, Get, Patch, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger'

import { CurrentUser } from '../../../../infrastructure/decorators/current-user.decorator.ts'
import type { AuthUser } from '../../../../shared/domain/auth-user.ts'
import { UuidParam, ZodBody } from '../../../../shared/presentation/decorators/zod.decorator.ts'
import { jsonSchema, jsonSchemaArray } from '../../../../shared/presentation/json-schema.ts'
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard.ts'
import { MachineService } from '../../application/services/machine.service.ts'
import { type CreateMachineBody, createMachineBodySchema } from '../dtos/create-machine.request.dto.ts'
import {
  type MachineResponse,
  type ManagedParcResponse,
  machineResponseSchema,
  managedParcResponseSchema,
  toMachineResponse,
  toManagedParcResponse,
} from '../dtos/machine.response.dto.ts'
import { type UpdateMachineBody, updateMachineBodySchema } from '../dtos/update-machine.request.dto.ts'

@ApiTags('manage')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('manage/machines')
export class MachineController {
  constructor(private readonly machineService: MachineService) {}

  @Get()
  @ApiOkResponse({ schema: jsonSchemaArray(managedParcResponseSchema) })
  async listParcs(@CurrentUser() user: AuthUser): Promise<ReadonlyArray<ManagedParcResponse>> {
    const parcs = await this.machineService.listManagedParcs(user)
    return parcs.map(toManagedParcResponse)
  }

  @Post()
  @ApiCreatedResponse({ schema: jsonSchema(machineResponseSchema) })
  async create(
    @CurrentUser() user: AuthUser,
    @ZodBody(createMachineBodySchema) body: CreateMachineBody
  ): Promise<MachineResponse> {
    const machine = await this.machineService.create(user, body)
    return toMachineResponse(machine)
  }

  @Patch(':machineId')
  @ApiOkResponse({ schema: jsonSchema(machineResponseSchema) })
  async update(
    @CurrentUser() user: AuthUser,
    @UuidParam('machineId') machineId: string,
    @ZodBody(updateMachineBodySchema) body: UpdateMachineBody
  ): Promise<MachineResponse> {
    const machine = await this.machineService.update(user, machineId, body)
    return toMachineResponse(machine)
  }
}
