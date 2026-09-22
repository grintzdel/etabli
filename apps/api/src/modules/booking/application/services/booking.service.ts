import { Injectable } from '@nestjs/common'

import type { AtelierStats, NetworkStats } from '../../domain/entities/atelier-stats.entity.ts'
import type { MachineAvailability } from '../../domain/entities/availability.entity.ts'
import type { AtelierBooking, BookingDetail } from '../../domain/entities/booking-read-model.ts'
import type { CheckInBookingBody } from '../../presentation/dtos/check-in-booking.request.dto.ts'
import type { CreateBookingBody } from '../../presentation/dtos/create-booking.request.dto.ts'
import type { ListAtelierBookingsQuery } from '../../presentation/dtos/list-atelier-bookings.request.dto.ts'
import type { MachineAvailabilityQuery } from '../../presentation/dtos/machine-availability.request.dto.ts'
import type { StatsQuery } from '../../presentation/dtos/stats.request.dto.ts'
import { CancelAtelierBookingUsecase } from '../use-cases/cancel-atelier-booking.usecase.ts'
import { CancelBookingUsecase } from '../use-cases/cancel-booking.usecase.ts'
import { CheckInBookingUsecase } from '../use-cases/check-in-booking.usecase.ts'
import { CreateBookingUsecase } from '../use-cases/create-booking.usecase.ts'
import { GetAtelierStatsUsecase } from '../use-cases/get-atelier-stats.usecase.ts'
import { GetBookingDetailUsecase } from '../use-cases/get-booking-detail.usecase.ts'
import { GetMachineAvailabilityUsecase } from '../use-cases/get-machine-availability.usecase.ts'
import { GetNetworkStatsUsecase } from '../use-cases/get-network-stats.usecase.ts'
import { ListAtelierBookingsUsecase } from '../use-cases/list-atelier-bookings.usecase.ts'
import { ListMyBookingsUsecase } from '../use-cases/list-my-bookings.usecase.ts'
import { ManualCheckInBookingUsecase } from '../use-cases/manual-check-in-booking.usecase.ts'
import { MarkNoShowUsecase } from '../use-cases/mark-no-show.usecase.ts'

@Injectable()
export class BookingService {
  constructor(
    private readonly getMachineAvailabilityUsecase: GetMachineAvailabilityUsecase,
    private readonly createBookingUsecase: CreateBookingUsecase,
    private readonly listMyBookingsUsecase: ListMyBookingsUsecase,
    private readonly getBookingDetailUsecase: GetBookingDetailUsecase,
    private readonly cancelBookingUsecase: CancelBookingUsecase,
    private readonly checkInBookingUsecase: CheckInBookingUsecase,
    private readonly listAtelierBookingsUsecase: ListAtelierBookingsUsecase,
    private readonly manualCheckInBookingUsecase: ManualCheckInBookingUsecase,
    private readonly cancelAtelierBookingUsecase: CancelAtelierBookingUsecase,
    private readonly markNoShowUsecase: MarkNoShowUsecase,
    private readonly getAtelierStatsUsecase: GetAtelierStatsUsecase,
    private readonly getNetworkStatsUsecase: GetNetworkStatsUsecase
  ) {}

  public async availability(machineId: string, query: MachineAvailabilityQuery): Promise<MachineAvailability> {
    return this.getMachineAvailabilityUsecase.execute(machineId, query)
  }

  public async create(body: CreateBookingBody): Promise<BookingDetail> {
    return this.createBookingUsecase.execute(body)
  }

  public async listMine(): Promise<ReadonlyArray<BookingDetail>> {
    return this.listMyBookingsUsecase.execute()
  }

  public async detail(bookingId: string): Promise<BookingDetail> {
    return this.getBookingDetailUsecase.execute(bookingId)
  }

  public async cancel(bookingId: string): Promise<BookingDetail> {
    return this.cancelBookingUsecase.execute(bookingId)
  }

  public async checkIn(bookingId: string, body: CheckInBookingBody): Promise<BookingDetail> {
    return this.checkInBookingUsecase.execute(bookingId, body)
  }

  public async listForAtelier(query: ListAtelierBookingsQuery): Promise<ReadonlyArray<AtelierBooking>> {
    return this.listAtelierBookingsUsecase.execute(query)
  }

  public async manualCheckIn(bookingId: string): Promise<AtelierBooking> {
    return this.manualCheckInBookingUsecase.execute(bookingId)
  }

  public async cancelForAtelier(bookingId: string): Promise<AtelierBooking> {
    return this.cancelAtelierBookingUsecase.execute(bookingId)
  }

  public async markNoShow(bookingId: string): Promise<AtelierBooking> {
    return this.markNoShowUsecase.execute(bookingId)
  }

  public async atelierStats(query: StatsQuery): Promise<ReadonlyArray<AtelierStats>> {
    return this.getAtelierStatsUsecase.execute(query)
  }

  public async networkStats(query: StatsQuery): Promise<NetworkStats> {
    return this.getNetworkStatsUsecase.execute(query)
  }
}
