import { Controller, Get } from '@nestjs/common'
import { ApiOkResponse, ApiTags } from '@nestjs/swagger'

import { UuidParam } from '../../../../shared/presentation/decorators/zod.decorator.ts'
import { jsonSchema } from '../../../../shared/presentation/json-schema.ts'
import { MachineService } from '../../application/services/machine.service.ts'
import {
  type MachineDetailResponse,
  machineDetailResponseSchema,
  toMachineDetailResponse,
} from '../dtos/machine.response.dto.ts'

@ApiTags('machines')
@Controller('machines')
export class PublicMachineController {
  constructor(private readonly machineService: MachineService) {}

  @Get(':machineId')
  @ApiOkResponse({ schema: jsonSchema(machineDetailResponseSchema) })
  async getById(@UuidParam('machineId') machineId: string): Promise<MachineDetailResponse> {
    return toMachineDetailResponse(await this.machineService.getDetail(machineId))
  }
}
