import { Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger'

import { ZodBody } from '../../../../shared/presentation/decorators/zod.decorator.ts'
import { jsonSchema } from '../../../../shared/presentation/json-schema.ts'
import {
  type CurrentUserResponse,
  currentUserResponseSchema,
  toCurrentUserResponse,
} from '../../../user/presentation/dtos/user.response.dto.ts'
import { AuthService } from '../../application/services/auth.service.ts'
import { type ChangePasswordBody, changePasswordBodySchema } from '../dtos/change-password.request.dto.ts'
import { type LoginBody, loginBodySchema } from '../dtos/login.request.dto.ts'
import { type RegisterBody, registerBodySchema } from '../dtos/register.request.dto.ts'
import { type SessionResponse, sessionResponseSchema, toSessionResponse } from '../dtos/session.response.dto.ts'
import { JwtAuthGuard } from '../guards/jwt-auth.guard.ts'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiCreatedResponse({ schema: jsonSchema(sessionResponseSchema) })
  async register(@ZodBody(registerBodySchema) body: RegisterBody): Promise<SessionResponse> {
    const session = await this.authService.register(body)
    return toSessionResponse(session)
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ schema: jsonSchema(sessionResponseSchema) })
  async login(@ZodBody(loginBodySchema) body: LoginBody): Promise<SessionResponse> {
    const session = await this.authService.login(body)
    return toSessionResponse(session)
  }

  @Post('password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ schema: jsonSchema(sessionResponseSchema) })
  async changePassword(@ZodBody(changePasswordBodySchema) body: ChangePasswordBody): Promise<SessionResponse> {
    const session = await this.authService.changePassword(body)
    return toSessionResponse(session)
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ schema: jsonSchema(currentUserResponseSchema) })
  async me(): Promise<CurrentUserResponse> {
    const current = await this.authService.me()
    return toCurrentUserResponse(current)
  }
}
