import { Controller, Get, Patch, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger'

import { CurrentUser } from '../../../../infrastructure/decorators/current-user.decorator.ts'
import { Roles } from '../../../../infrastructure/decorators/roles.decorator.ts'
import type { AuthUser } from '../../../../shared/domain/auth-user.ts'
import { PlatformRole } from '../../../../shared/domain/roles.constant.ts'
import { UuidParam, ZodBody } from '../../../../shared/presentation/decorators/zod.decorator.ts'
import { jsonSchema, jsonSchemaArray } from '../../../../shared/presentation/json-schema.ts'
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard.ts'
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard.ts'
import {
  type MemberAtelierResponse,
  memberAtelierResponseSchema,
  toMemberAtelierResponse,
} from '../../../user/presentation/dtos/user.response.dto.ts'
import { MembershipService } from '../../application/services/membership.service.ts'
import { type CompleteOnboardingBody, completeOnboardingBodySchema } from '../dtos/complete-onboarding.request.dto.ts'
import {
  type MembershipResponse,
  type OnboardingResultResponse,
  membershipResponseSchema,
  onboardingResultResponseSchema,
  toMembershipResponse,
  toOnboardingResultResponse,
} from '../dtos/membership.response.dto.ts'
import { type SetMembershipRoleBody, setMembershipRoleBodySchema } from '../dtos/set-membership-role.request.dto.ts'

@ApiTags('onboarding')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly membershipService: MembershipService) {}

  @Post('complete')
  @ApiCreatedResponse({ schema: jsonSchema(onboardingResultResponseSchema) })
  async complete(
    @CurrentUser() user: AuthUser,
    @ZodBody(completeOnboardingBodySchema) body: CompleteOnboardingBody
  ): Promise<OnboardingResultResponse> {
    const result = await this.membershipService.completeOnboarding(user, body)
    return toOnboardingResultResponse(result)
  }
}

@ApiTags('me')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('me/ateliers')
export class MyAteliersController {
  constructor(private readonly membershipService: MembershipService) {}

  @Get()
  @ApiOkResponse({ schema: jsonSchemaArray(memberAtelierResponseSchema) })
  async list(@CurrentUser() user: AuthUser): Promise<ReadonlyArray<MemberAtelierResponse>> {
    const ateliers = await this.membershipService.listMyAteliers(user)
    return ateliers.map(toMemberAtelierResponse)
  }
}

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(PlatformRole.PLATFORM_ADMIN)
@Controller('admin/ateliers')
export class AdminMembershipController {
  constructor(private readonly membershipService: MembershipService) {}

  @Patch(':atelierId/members/:userId')
  @ApiOkResponse({ schema: jsonSchema(membershipResponseSchema) })
  async setRole(
    @UuidParam('atelierId') atelierId: string,
    @UuidParam('userId') userId: string,
    @ZodBody(setMembershipRoleBodySchema) body: SetMembershipRoleBody
  ): Promise<MembershipResponse> {
    const membership = await this.membershipService.setRole(atelierId, userId, body)
    return toMembershipResponse(membership)
  }
}
