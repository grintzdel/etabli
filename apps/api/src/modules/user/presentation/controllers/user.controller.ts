import { Controller, Get, Patch, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger'

import { ZodBody } from '../../../../shared/presentation/decorators/zod.decorator.ts'
import { jsonSchema } from '../../../../shared/presentation/json-schema.ts'
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard.ts'
import { UserService } from '../../application/services/user.service.ts'
import { type UpdatePreferencesBody, updatePreferencesBodySchema } from '../dtos/update-preferences.request.dto.ts'
import { type UpdateProfileBody, updateProfileBodySchema } from '../dtos/update-profile.request.dto.ts'
import {
  type CurrentUserResponse,
  type UserPreferencesResponse,
  currentUserResponseSchema,
  toCurrentUserResponse,
  toUserPreferencesResponse,
  userPreferencesResponseSchema,
} from '../dtos/user.response.dto.ts'

@ApiTags('me')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('me')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Patch('profile')
  @ApiOkResponse({ schema: jsonSchema(currentUserResponseSchema) })
  async updateProfile(@ZodBody(updateProfileBodySchema) body: UpdateProfileBody): Promise<CurrentUserResponse> {
    const current = await this.userService.updateProfile(body)
    return toCurrentUserResponse(current)
  }

  @Get('preferences')
  @ApiOkResponse({ schema: jsonSchema(userPreferencesResponseSchema) })
  async getPreferences(): Promise<UserPreferencesResponse> {
    const preferences = await this.userService.getPreferences()
    return toUserPreferencesResponse(preferences)
  }

  @Patch('preferences')
  @ApiOkResponse({ schema: jsonSchema(userPreferencesResponseSchema) })
  async updatePreferences(
    @ZodBody(updatePreferencesBodySchema) body: UpdatePreferencesBody
  ): Promise<UserPreferencesResponse> {
    const preferences = await this.userService.updatePreferences(body)
    return toUserPreferencesResponse(preferences)
  }
}
