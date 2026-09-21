import { Module } from '@nestjs/common'

import { ConfigModule } from './infrastructure/config/config.module.ts'
import { DatabaseModule } from './infrastructure/database/database.module.ts'
import { HealthModule } from './infrastructure/health/health.module.ts'
import { AtelierModule } from './modules/atelier/atelier.module.ts'
import { AuthModule } from './modules/auth/auth.module.ts'
import { BookingModule } from './modules/booking/booking.module.ts'
import { CertificationModule } from './modules/certification/certification.module.ts'
import { MachineModule } from './modules/machine/machine.module.ts'
import { MembershipModule } from './modules/membership/membership.module.ts'
import { UserModule } from './modules/user/user.module.ts'
import { SharedModule } from './shared/shared.module.ts'

@Module({
  imports: [
    ConfigModule,
    SharedModule,
    DatabaseModule,
    HealthModule,
    AuthModule,
    UserModule,
    AtelierModule,
    MembershipModule,
    MachineModule,
    CertificationModule,
    BookingModule,
  ],
})
export class AppModule {}
