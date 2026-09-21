import { Injectable } from '@nestjs/common'

import type { AuthUser } from '../../../../shared/domain/auth-user.ts'
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

  public async availability(
    user: AuthUser,
    machineId: string,
    query: MachineAvailabilityQuery
  ): Promise<MachineAvailability> {
    return this.getMachineAvailabilityUsecase.execute(user, machineId, query)
  }

  public async create(user: AuthUser, body: CreateBookingBody): Promise<BookingDetail> {
    return this.createBookingUsecase.execute(user, body)
  }

  public async listMine(user: AuthUser): Promise<ReadonlyArray<BookingDetail>> {
    return this.listMyBookingsUsecase.execute(user)
  }

  public async detail(user: AuthUser, bookingId: string): Promise<BookingDetail> {
    return this.getBookingDetailUsecase.execute(user, bookingId)
  }

  public async cancel(user: AuthUser, bookingId: string): Promise<BookingDetail> {
    return this.cancelBookingUsecase.execute(user, bookingId)
  }

  public async checkIn(user: AuthUser, bookingId: string, body: CheckInBookingBody): Promise<BookingDetail> {
    return this.checkInBookingUsecase.execute(user, bookingId, body)
  }

  public async listForAtelier(user: AuthUser, query: ListAtelierBookingsQuery): Promise<ReadonlyArray<AtelierBooking>> {
    return this.listAtelierBookingsUsecase.execute(user, query)
  }

  public async manualCheckIn(user: AuthUser, bookingId: string): Promise<AtelierBooking> {
    return this.manualCheckInBookingUsecase.execute(user, bookingId)
  }

  public async cancelForAtelier(user: AuthUser, bookingId: string): Promise<AtelierBooking> {
    return this.cancelAtelierBookingUsecase.execute(user, bookingId)
  }

  public async markNoShow(user: AuthUser, bookingId: string): Promise<AtelierBooking> {
    return this.markNoShowUsecase.execute(user, bookingId)
  }

  public async atelierStats(user: AuthUser, query: StatsQuery): Promise<ReadonlyArray<AtelierStats>> {
    return this.getAtelierStatsUsecase.execute(user, query)
  }

  public async networkStats(query: StatsQuery): Promise<NetworkStats> {
    return this.getNetworkStatsUsecase.execute(query)
  }
}
