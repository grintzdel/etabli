import { Controller, Get, Patch, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger'

import { Roles } from '../../../../infrastructure/decorators/roles.decorator.ts'
import { PlatformRole } from '../../../../shared/domain/roles.constant.ts'
import { UuidParam, ZodBody, ZodQuery } from '../../../../shared/presentation/decorators/zod.decorator.ts'
import { jsonSchema, jsonSchemaArray } from '../../../../shared/presentation/json-schema.ts'
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard.ts'
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard.ts'
import { UserService } from '../../application/services/user.service.ts'
import { type ListAdminUsersQuery, listAdminUsersQuerySchema } from '../dtos/list-admin-users.request.dto.ts'
import { type UpdateAdminUserBody, updateAdminUserBodySchema } from '../dtos/update-admin-user.request.dto.ts'
import { type AdminUserResponse, adminUserResponseSchema, toAdminUserResponse } from '../dtos/user.response.dto.ts'

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(PlatformRole.PLATFORM_ADMIN)
@Controller('admin/users')
export class AdminUserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOkResponse({ schema: jsonSchemaArray(adminUserResponseSchema) })
  async list(
    @ZodQuery(listAdminUsersQuerySchema) query: ListAdminUsersQuery
  ): Promise<ReadonlyArray<AdminUserResponse>> {
    const users = await this.userService.listAdminUsers(query)
    return users.map(toAdminUserResponse)
  }

  @Patch(':userId')
  @ApiOkResponse({ schema: jsonSchema(adminUserResponseSchema) })
  async update(
    @UuidParam('userId') userId: string,
    @ZodBody(updateAdminUserBodySchema) body: UpdateAdminUserBody
  ): Promise<AdminUserResponse> {
    const account = await this.userService.updateAdminUser(userId, body)
    return toAdminUserResponse(account)
  }
}
