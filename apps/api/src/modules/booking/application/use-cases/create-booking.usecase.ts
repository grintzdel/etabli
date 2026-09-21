import { randomUUID } from 'node:crypto'

import { Inject, Injectable } from '@nestjs/common'

import type { AuthUser } from '../../../../shared/domain/auth-user.ts'
import type { IClock } from '../../../../shared/domain/clock.interface.ts'
import { CLOCK } from '../../../../shared/domain/clock.token.ts'
import { isMemberOf } from '../../../../shared/domain/permissions.ts'
import type { ICertificationRepository } from '../../../certification/domain/repositories/certification.repository.interface.ts'
import { CERTIFICATION_REPOSITORY } from '../../../certification/domain/repositories/certification.repository.token.ts'
import { MachineStatus } from '../../../machine/domain/constants/machine.constant.ts'
import type { IMachineRepository } from '../../../machine/domain/repositories/machine.repository.interface.ts'
import { MACHINE_REPOSITORY } from '../../../machine/domain/repositories/machine.repository.token.ts'
import { type BookingDetail, toBookingDetail } from '../../domain/entities/booking-read-model.ts'
import { BookingEntity } from '../../domain/entities/booking.entity.ts'
import {
  MachineNotBookableError,
  MachineUnavailableError,
  MissingCertificationError,
  SlotInThePastError,
} from '../../domain/errors/booking.errors.ts'
import type { IBookingRepository } from '../../domain/repositories/booking.repository.interface.ts'
import { BOOKING_REPOSITORY } from '../../domain/repositories/booking.repository.token.ts'
import type { CreateBookingBody } from '../../presentation/dtos/create-booking.request.dto.ts'

@Injectable()
export class CreateBookingUsecase {
  constructor(
    @Inject(BOOKING_REPOSITORY) private readonly bookingRepository: IBookingRepository,
    @Inject(MACHINE_REPOSITORY) private readonly machineRepository: IMachineRepository,
    @Inject(CERTIFICATION_REPOSITORY) private readonly certificationRepository: ICertificationRepository,
    @Inject(CLOCK) private readonly clock: IClock
  ) {}

  async execute(user: AuthUser, body: CreateBookingBody): Promise<BookingDetail> {
    const machine = await this.machineRepository.findById(body.machineId)
    if (machine === null || machine.status === MachineStatus.RETIRED || !isMemberOf(user, machine.atelierId)) {
      throw new MachineNotBookableError(body.machineId)
    }

    if (machine.status !== MachineStatus.AVAILABLE) {
      throw new MachineUnavailableError(body.machineId, machine.status)
    }

    const now = this.clock.now()
    if (body.startAt.getTime() <= now.getTime()) throw new SlotInThePastError(body.machineId, body.startAt)

    if (machine.requiresCertification && !(await this.certificationRepository.isCertified(user.id, machine.id))) {
      throw new MissingCertificationError(body.machineId)
    }

    const booking = await this.bookingRepository.insert(
      BookingEntity.create({
        id: randomUUID(),
        user,
        machineId: machine.id,
        atelierId: machine.atelierId,
        slotDurationMinutes: machine.slotDurationMinutes,
        startAt: body.startAt,
        now,
      }).toJSON()
    )

    return toBookingDetail(booking, machine, now)
  }
}
