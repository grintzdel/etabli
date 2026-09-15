import { Controller, Get } from '@nestjs/common'
import { ApiOkResponse } from '@nestjs/swagger'

import { jsonSchema } from '../../shared/presentation/json-schema.ts'
import { type HealthResponse, healthResponseSchema } from './health.response.dto.ts'

@Controller('health')
export class HealthController {
  @Get()
  @ApiOkResponse({ schema: jsonSchema(healthResponseSchema) })
  check(): HealthResponse {
    return { status: 'ok' }
  }
}
