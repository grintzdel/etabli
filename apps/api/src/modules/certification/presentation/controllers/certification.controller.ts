import { Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger'

import { CurrentUser } from '../../../../infrastructure/decorators/current-user.decorator.ts'
import type { AuthUser } from '../../../../shared/domain/auth-user.ts'
import { UuidParam, ZodBody } from '../../../../shared/presentation/decorators/zod.decorator.ts'
import { jsonSchema, jsonSchemaArray } from '../../../../shared/presentation/json-schema.ts'
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard.ts'
import { CertificationService } from '../../application/services/certification.service.ts'
import {
  type CertificationRequestResponse,
  type CertificationResponse,
  type MyCertificationResponse,
  certificationRequestResponseSchema,
  certificationResponseSchema,
  myCertificationResponseSchema,
  toCertificationRequestResponse,
  toCertificationResponse,
  toMyCertificationResponse,
} from '../dtos/certification.response.dto.ts'
import {
  type RequestCertificationBody,
  requestCertificationBodySchema,
} from '../dtos/request-certification.request.dto.ts'

@ApiTags('certifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('certifications')
export class CertificationController {
  constructor(private readonly certificationService: CertificationService) {}

  @Post('request')
  @ApiCreatedResponse({ schema: jsonSchema(certificationResponseSchema) })
  async request(
    @CurrentUser() user: AuthUser,
    @ZodBody(requestCertificationBodySchema) body: RequestCertificationBody
  ): Promise<CertificationResponse> {
    const certification = await this.certificationService.request(user, body)
    return toCertificationResponse(certification)
  }

  @Get('mine')
  @ApiOkResponse({ schema: jsonSchemaArray(myCertificationResponseSchema) })
  async mine(@CurrentUser() user: AuthUser): Promise<ReadonlyArray<MyCertificationResponse>> {
    const certifications = await this.certificationService.mine(user)
    return certifications.map(toMyCertificationResponse)
  }
}

@ApiTags('manage')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('manage/certifications')
export class CertificationReviewController {
  constructor(private readonly certificationService: CertificationService) {}

  @Get()
  @ApiOkResponse({ schema: jsonSchemaArray(certificationRequestResponseSchema) })
  async queue(@CurrentUser() user: AuthUser): Promise<ReadonlyArray<CertificationRequestResponse>> {
    const requests = await this.certificationService.queue(user)
    return requests.map(toCertificationRequestResponse)
  }

  @Post(':certificationId/grant')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ schema: jsonSchema(certificationResponseSchema) })
  async grant(
    @CurrentUser() user: AuthUser,
    @UuidParam('certificationId') certificationId: string
  ): Promise<CertificationResponse> {
    const certification = await this.certificationService.grant(user, certificationId)
    return toCertificationResponse(certification)
  }

  @Post(':certificationId/revoke')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ schema: jsonSchema(certificationResponseSchema) })
  async revoke(
    @CurrentUser() user: AuthUser,
    @UuidParam('certificationId') certificationId: string
  ): Promise<CertificationResponse> {
    const certification = await this.certificationService.revoke(user, certificationId)
    return toCertificationResponse(certification)
  }
}
