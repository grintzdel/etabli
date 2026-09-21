import { Module } from '@nestjs/common'

import { CertificationInfrastructureModule } from '../certification/infrastructure/certification.infrastructure.module.ts'
import { MachineInfrastructureModule } from '../machine/infrastructure/machine.infrastructure.module.ts'
import { UserInfrastructureModule } from '../user/infrastructure/user.infrastructure.module.ts'
import { BookingService } from './application/services/booking.service.ts'
import { CancelAtelierBookingUsecase } from './application/use-cases/cancel-atelier-booking.usecase.ts'
import { CancelBookingUsecase } from './application/use-cases/cancel-booking.usecase.ts'
import { CheckInBookingUsecase } from './application/use-cases/check-in-booking.usecase.ts'
import { CreateBookingUsecase } from './application/use-cases/create-booking.usecase.ts'
import { GetAtelierStatsUsecase } from './application/use-cases/get-atelier-stats.usecase.ts'
import { GetBookingDetailUsecase } from './application/use-cases/get-booking-detail.usecase.ts'
import { GetMachineAvailabilityUsecase } from './application/use-cases/get-machine-availability.usecase.ts'
import { GetNetworkStatsUsecase } from './application/use-cases/get-network-stats.usecase.ts'
import { ListAtelierBookingsUsecase } from './application/use-cases/list-atelier-bookings.usecase.ts'
import { ListMyBookingsUsecase } from './application/use-cases/list-my-bookings.usecase.ts'
import { ManualCheckInBookingUsecase } from './application/use-cases/manual-check-in-booking.usecase.ts'
import { MarkNoShowUsecase } from './application/use-cases/mark-no-show.usecase.ts'
import { BookingInfrastructureModule } from './infrastructure/booking.infrastructure.module.ts'
import {
  BookingManagementController,
  NetworkStatsController,
} from './presentation/controllers/booking-management.controller.ts'
import { BookingController, MachineAvailabilityController } from './presentation/controllers/booking.controller.ts'

@Module({
  imports: [
    BookingInfrastructureModule,
    MachineInfrastructureModule,
    CertificationInfrastructureModule,
    UserInfrastructureModule,
  ],
  controllers: [MachineAvailabilityController, BookingController, BookingManagementController, NetworkStatsController],
  providers: [
    BookingService,
    GetMachineAvailabilityUsecase,
    CreateBookingUsecase,
    ListMyBookingsUsecase,
    GetBookingDetailUsecase,
    CancelBookingUsecase,
    CheckInBookingUsecase,
    ListAtelierBookingsUsecase,
    ManualCheckInBookingUsecase,
    CancelAtelierBookingUsecase,
    MarkNoShowUsecase,
    GetAtelierStatsUsecase,
    GetNetworkStatsUsecase,
  ],
})
export class BookingModule {}
