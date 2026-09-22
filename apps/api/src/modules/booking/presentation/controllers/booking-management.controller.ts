import { Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger'

import { Roles } from '../../../../infrastructure/decorators/roles.decorator.ts'
import { PlatformRole } from '../../../../shared/domain/roles.constant.ts'
import { UuidParam, ZodQuery } from '../../../../shared/presentation/decorators/zod.decorator.ts'
import { jsonSchema, jsonSchemaArray } from '../../../../shared/presentation/json-schema.ts'
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard.ts'
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard.ts'
import { BookingService } from '../../application/services/booking.service.ts'
import {
  type AtelierBookingResponse,
  type AtelierStatsResponse,
  type NetworkStatsResponse,
  atelierBookingResponseSchema,
  atelierStatsResponseSchema,
  networkStatsResponseSchema,
  toAtelierBookingResponse,
  toAtelierStatsResponse,
  toNetworkStatsResponse,
} from '../dtos/booking.response.dto.ts'
import {
  type ListAtelierBookingsQuery,
  listAtelierBookingsQuerySchema,
} from '../dtos/list-atelier-bookings.request.dto.ts'
import { type StatsQuery, statsQuerySchema } from '../dtos/stats.request.dto.ts'

@ApiTags('manage')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('manage')
export class BookingManagementController {
  constructor(private readonly bookingService: BookingService) {}

  @Get('bookings')
  @ApiOkResponse({ schema: jsonSchemaArray(atelierBookingResponseSchema) })
  async list(
    @ZodQuery(listAtelierBookingsQuerySchema) query: ListAtelierBookingsQuery
  ): Promise<ReadonlyArray<AtelierBookingResponse>> {
    const bookings = await this.bookingService.listForAtelier(query)
    return bookings.map(toAtelierBookingResponse)
  }

  @Post('bookings/:bookingId/check-in')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ schema: jsonSchema(atelierBookingResponseSchema) })
  async checkIn(@UuidParam('bookingId') bookingId: string): Promise<AtelierBookingResponse> {
    const booking = await this.bookingService.manualCheckIn(bookingId)
    return toAtelierBookingResponse(booking)
  }

  @Post('bookings/:bookingId/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ schema: jsonSchema(atelierBookingResponseSchema) })
  async cancel(@UuidParam('bookingId') bookingId: string): Promise<AtelierBookingResponse> {
    const booking = await this.bookingService.cancelForAtelier(bookingId)
    return toAtelierBookingResponse(booking)
  }

  @Post('bookings/:bookingId/no-show')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ schema: jsonSchema(atelierBookingResponseSchema) })
  async markNoShow(@UuidParam('bookingId') bookingId: string): Promise<AtelierBookingResponse> {
    const booking = await this.bookingService.markNoShow(bookingId)
    return toAtelierBookingResponse(booking)
  }

  @Get('stats')
  @ApiOkResponse({ schema: jsonSchemaArray(atelierStatsResponseSchema) })
  async stats(@ZodQuery(statsQuerySchema) query: StatsQuery): Promise<ReadonlyArray<AtelierStatsResponse>> {
    const stats = await this.bookingService.atelierStats(query)
    return stats.map(toAtelierStatsResponse)
  }
}

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(PlatformRole.PLATFORM_ADMIN)
@Controller('admin/stats')
export class NetworkStatsController {
  constructor(private readonly bookingService: BookingService) {}

  @Get()
  @ApiOkResponse({ schema: jsonSchema(networkStatsResponseSchema) })
  async stats(@ZodQuery(statsQuerySchema) query: StatsQuery): Promise<NetworkStatsResponse> {
    const stats = await this.bookingService.networkStats(query)
    return toNetworkStatsResponse(stats)
  }
}
