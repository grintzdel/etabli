import { Inject, Injectable } from '@nestjs/common'

import type { IClock } from '../../../../shared/domain/clock.interface.ts'
import { CLOCK } from '../../../../shared/domain/clock.token.ts'
import { MachineStatus } from '../../../machine/domain/constants/machine.constant.ts'
import type { IMachineRepository } from '../../../machine/domain/repositories/machine.repository.interface.ts'
import { MACHINE_REPOSITORY } from '../../../machine/domain/repositories/machine.repository.token.ts'
import { availabilityWindow, buildSlots, type MachineAvailability } from '../../domain/entities/availability.entity.ts'
import { MachineNotBookableError } from '../../domain/errors/booking.errors.ts'
import type { IBookingRepository } from '../../domain/repositories/booking.repository.interface.ts'
import { BOOKING_REPOSITORY } from '../../domain/repositories/booking.repository.token.ts'
import type { MachineAvailabilityQuery } from '../../presentation/dtos/machine-availability.request.dto.ts'

@Injectable()
export class GetMachineAvailabilityUsecase {
  constructor(
    @Inject(BOOKING_REPOSITORY) private readonly bookingRepository: IBookingRepository,
    @Inject(MACHINE_REPOSITORY) private readonly machineRepository: IMachineRepository,
    @Inject(CLOCK) private readonly clock: IClock
  ) {}

  async execute(machineId: string, query: MachineAvailabilityQuery): Promise<MachineAvailability> {
    const machine = await this.machineRepository.findById(machineId)
    if (machine === null || machine.status === MachineStatus.RETIRED) throw new MachineNotBookableError(machineId)

    const now = this.clock.now()
    const window = availabilityWindow(query.from ?? now)
    const bookings = await this.bookingRepository.listActiveForMachineBetween(machineId, window.from, window.to)

    return {
      machineId: machine.id,
      machineName: machine.name,
      atelierId: machine.atelierId,
      atelierName: machine.atelierName,
      atelierSlug: machine.atelierSlug,
      machineStatus: machine.status,
      requiresCertification: machine.requiresCertification,
      slotDurationMinutes: machine.slotDurationMinutes,
      from: window.from,
      to: window.to,
      slots: buildSlots({
        from: window.from,
        now,
        slotDurationMinutes: machine.slotDurationMinutes,
        bookings,
        machineAvailable: machine.status === MachineStatus.AVAILABLE,
      }),
    }
  }
}
