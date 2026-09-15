import { Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger'

import { CurrentUser } from '../../../../infrastructure/decorators/current-user.decorator.ts'
import type { AuthUser } from '../../../../shared/domain/auth-user.ts'
import { UuidParam, ZodBody, ZodQuery } from '../../../../shared/presentation/decorators/zod.decorator.ts'
import { jsonSchema, jsonSchemaArray } from '../../../../shared/presentation/json-schema.ts'
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard.ts'
import { BookingService } from '../../application/services/booking.service.ts'
import {
  type BookingDetailResponse,
  type MachineAvailabilityResponse,
  bookingDetailResponseSchema,
  machineAvailabilityResponseSchema,
  toBookingDetailResponse,
  toMachineAvailabilityResponse,
} from '../dtos/booking.response.dto.ts'
import { type CheckInBookingBody, checkInBookingBodySchema } from '../dtos/check-in-booking.request.dto.ts'
import { type CreateBookingBody, createBookingBodySchema } from '../dtos/create-booking.request.dto.ts'
import {
  type MachineAvailabilityQuery,
  machineAvailabilityQuerySchema,
} from '../dtos/machine-availability.request.dto.ts'

@ApiTags('machines')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('machines')
export class MachineAvailabilityController {
  constructor(private readonly bookingService: BookingService) {}

  @Get(':machineId/availability')
  @ApiOkResponse({ schema: jsonSchema(machineAvailabilityResponseSchema) })
  async availability(
    @CurrentUser() user: AuthUser,
    @UuidParam('machineId') machineId: string,
    @ZodQuery(machineAvailabilityQuerySchema) query: MachineAvailabilityQuery
  ): Promise<MachineAvailabilityResponse> {
    const availability = await this.bookingService.availability(user, machineId, query)
    return toMachineAvailabilityResponse(availability)
  }
}

@ApiTags('bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  @ApiCreatedResponse({ schema: jsonSchema(bookingDetailResponseSchema) })
  async create(
    @CurrentUser() user: AuthUser,
    @ZodBody(createBookingBodySchema) body: CreateBookingBody
  ): Promise<BookingDetailResponse> {
    const booking = await this.bookingService.create(user, body)
    return toBookingDetailResponse(booking)
  }

  @Get()
  @ApiOkResponse({ schema: jsonSchemaArray(bookingDetailResponseSchema) })
  async list(@CurrentUser() user: AuthUser): Promise<ReadonlyArray<BookingDetailResponse>> {
    const bookings = await this.bookingService.listMine(user)
    return bookings.map(toBookingDetailResponse)
  }

  @Get(':bookingId')
  @ApiOkResponse({ schema: jsonSchema(bookingDetailResponseSchema) })
  async detail(
    @CurrentUser() user: AuthUser,
    @UuidParam('bookingId') bookingId: string
  ): Promise<BookingDetailResponse> {
    const booking = await this.bookingService.detail(user, bookingId)
    return toBookingDetailResponse(booking)
  }

  @Post(':bookingId/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ schema: jsonSchema(bookingDetailResponseSchema) })
  async cancel(
    @CurrentUser() user: AuthUser,
    @UuidParam('bookingId') bookingId: string
  ): Promise<BookingDetailResponse> {
    const booking = await this.bookingService.cancel(user, bookingId)
    return toBookingDetailResponse(booking)
  }

  @Post(':bookingId/check-in')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ schema: jsonSchema(bookingDetailResponseSchema) })
  async checkIn(
    @CurrentUser() user: AuthUser,
    @UuidParam('bookingId') bookingId: string,
    @ZodBody(checkInBookingBodySchema) body: CheckInBookingBody
  ): Promise<BookingDetailResponse> {
    const booking = await this.bookingService.checkIn(user, bookingId, body)
    return toBookingDetailResponse(booking)
  }
}
