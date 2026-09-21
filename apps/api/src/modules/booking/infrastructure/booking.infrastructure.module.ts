import { Module } from '@nestjs/common'

import { DatabaseModule } from '../../../infrastructure/database/database.module.ts'
import { BOOKING_REPOSITORY } from '../domain/repositories/booking.repository.token.ts'
import { BookingRepositoryDrizzlePg } from './repositories/booking.repository.drizzle-pg.ts'

@Module({
  imports: [DatabaseModule],
  providers: [{ provide: BOOKING_REPOSITORY, useClass: BookingRepositoryDrizzlePg }],
  exports: [BOOKING_REPOSITORY],
})
export class BookingInfrastructureModule {}
