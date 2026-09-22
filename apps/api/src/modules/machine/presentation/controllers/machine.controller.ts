import { Controller, Get, Patch, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger'

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
  async listParcs(): Promise<ReadonlyArray<ManagedParcResponse>> {
    const parcs = await this.machineService.listManagedParcs()
    return parcs.map(toManagedParcResponse)
  }

  @Post()
  @ApiCreatedResponse({ schema: jsonSchema(machineResponseSchema) })
  async create(@ZodBody(createMachineBodySchema) body: CreateMachineBody): Promise<MachineResponse> {
    const machine = await this.machineService.create(body)
    return toMachineResponse(machine)
  }

  @Patch(':machineId')
  @ApiOkResponse({ schema: jsonSchema(machineResponseSchema) })
  async update(
    @UuidParam('machineId') machineId: string,
    @ZodBody(updateMachineBodySchema) body: UpdateMachineBody
  ): Promise<MachineResponse> {
    const machine = await this.machineService.update(machineId, body)
    return toMachineResponse(machine)
  }

  @Post(':machineId/check-in-token')
  @ApiOkResponse({ schema: jsonSchema(machineResponseSchema) })
  async regenerateCheckInToken(@UuidParam('machineId') machineId: string): Promise<MachineResponse> {
    const machine = await this.machineService.regenerateCheckInToken(machineId)
    return toMachineResponse(machine)
  }
}
