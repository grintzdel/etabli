import { describe, expect, it, vi } from 'vitest'

import { FixedAuthContext } from '../../../../shared/testing/fixed.auth-context.ts'
import { FixedClock } from '../../../../shared/testing/fixed.clock.ts'
import { authUserFixture, fabmanagerOf, machineFixture, memberOf } from '../../../../shared/testing/fixtures.ts'
import { stub } from '../../../../shared/testing/stub.ts'
import type { IMachineRepository } from '../../../machine/domain/repositories/machine.repository.interface.ts'
import type { IUserRepository } from '../../../user/domain/repositories/user.repository.interface.ts'
import { BookingStatus, CheckInMethod } from '../../domain/constants/booking.constant.ts'
import { BookingEntity, type BookingProps } from '../../domain/entities/booking.entity.ts'
import {
  BookingNotCancellableError,
  BookingNotCheckInableError,
  BookingNotMarkableAsNoShowError,
  BookingUnknownError,
  CheckInWindowClosedError,
  CheckInTokenMismatchError,
} from '../../domain/errors/booking.errors.ts'
import type { IBookingRepository } from '../../domain/repositories/booking.repository.interface.ts'
import { CancelAtelierBookingUsecase } from './cancel-atelier-booking.usecase.ts'
import { CancelBookingUsecase } from './cancel-booking.usecase.ts'
import { CheckInBookingUsecase } from './check-in-booking.usecase.ts'
import { MarkNoShowUsecase } from './mark-no-show.usecase.ts'

const MACHINE = machineFixture({ checkInToken: 'qr-forge-laser-01' })
const OWNER = authUserFixture({ memberships: [memberOf(MACHINE.atelierId)] })

const bookingOf = (overrides: Partial<BookingProps> = {}): BookingEntity =>
  BookingEntity.from({
    id: 'booking-1',
    machineId: MACHINE.id,
    atelierId: MACHINE.atelierId,
    userId: OWNER.id,
    startAt: new Date('2026-09-16T10:00:00Z'),
    endAt: new Date('2026-09-16T11:00:00Z'),
    status: BookingStatus.CONFIRMED,
    checkedInAt: null,
    checkedInVia: null,
    cancelledAt: null,
    cancelledBy: null,
    createdAt: new Date('2026-09-15T10:00:00Z'),
    updatedAt: new Date('2026-09-15T10:00:00Z'),
    ...overrides,
  })

const machineRepository = stub<IMachineRepository>({ findById: vi.fn().mockResolvedValue(MACHINE) })
const userRepository = stub<IUserRepository>({
  namesOf: vi.fn().mockResolvedValue(new Map([[OWNER.id, 'Camille Roux']])),
})

describe('CancelBookingUsecase', () => {
  it('cancels a slot that has not started', async () => {
    const cancel = vi.fn(async (_id: string, at: Date, by: string) =>
      bookingOf({ status: BookingStatus.CANCELLED, cancelledAt: at, cancelledBy: by })
    )
    const usecase = new CancelBookingUsecase(
      stub<IBookingRepository>({ findById: vi.fn().mockResolvedValue(bookingOf()), cancel }),
      machineRepository,
      new FixedClock('2026-09-16T09:00:00Z'),
      new FixedAuthContext(OWNER)
    )

    const detail = await usecase.execute('booking-1')

    expect(detail.status).toBe(BookingStatus.CANCELLED)
    expect(cancel).toHaveBeenCalledWith('booking-1', new Date('2026-09-16T09:00:00Z'), OWNER.id)
  })

  it('hides a slot that is not the caller’s behind a 404', async () => {
    const usecase = new CancelBookingUsecase(
      stub<IBookingRepository>({ findById: vi.fn().mockResolvedValue(bookingOf({ userId: 'someone-else' })) }),
      machineRepository,
      new FixedClock('2026-09-16T09:00:00Z'),
      new FixedAuthContext(OWNER)
    )

    await expect(usecase.execute('booking-1')).rejects.toThrow(BookingUnknownError)
  })

  it('refuses a slot already started', async () => {
    const usecase = new CancelBookingUsecase(
      stub<IBookingRepository>({ findById: vi.fn().mockResolvedValue(bookingOf()) }),
      machineRepository,
      new FixedClock('2026-09-16T10:30:00Z'),
      new FixedAuthContext(OWNER)
    )

    await expect(usecase.execute('booking-1')).rejects.toThrow(BookingNotCancellableError)
  })
})

describe('CancelAtelierBookingUsecase', () => {
  const fabmanager = authUserFixture({ memberships: [fabmanagerOf(MACHINE.atelierId)] })

  it('reaches a slot the member can no longer call off', async () => {
    const usecase = new CancelAtelierBookingUsecase(
      stub<IBookingRepository>({
        findById: vi.fn().mockResolvedValue(bookingOf()),
        cancel: vi.fn(async () => bookingOf({ status: BookingStatus.CANCELLED })),
      }),
      machineRepository,
      userRepository,
      new FixedClock('2026-09-16T10:30:00Z'),
      new FixedAuthContext(fabmanager)
    )

    expect((await usecase.execute('booking-1')).status).toBe(BookingStatus.CANCELLED)
  })

  it('stops at the end of the slot', async () => {
    const usecase = new CancelAtelierBookingUsecase(
      stub<IBookingRepository>({ findById: vi.fn().mockResolvedValue(bookingOf()) }),
      machineRepository,
      userRepository,
      new FixedClock('2026-09-16T11:00:00Z'),
      new FixedAuthContext(fabmanager)
    )

    await expect(usecase.execute('booking-1')).rejects.toThrow(BookingNotCancellableError)
  })

  it('hides a slot of an atelier the fabmanager does not run', async () => {
    const stranger = authUserFixture({ memberships: [fabmanagerOf('another-atelier')] })
    const usecase = new CancelAtelierBookingUsecase(
      stub<IBookingRepository>({ findById: vi.fn().mockResolvedValue(bookingOf()) }),
      machineRepository,
      userRepository,
      new FixedClock('2026-09-16T10:30:00Z'),
      new FixedAuthContext(stranger)
    )

    await expect(usecase.execute('booking-1')).rejects.toThrow(BookingUnknownError)
  })
})

describe('CheckInBookingUsecase', () => {
  const usecaseWith = (booking: BookingEntity, now: string, token: string = MACHINE.checkInToken) =>
    new CheckInBookingUsecase(
      stub<IBookingRepository>({
        findById: vi.fn().mockResolvedValue(booking),
        checkIn: vi.fn(async (_id: string, at: Date, via) =>
          bookingOf({ status: BookingStatus.CHECKED_IN, checkedInAt: at, checkedInVia: via })
        ),
      }),
      stub<IMachineRepository>({ findById: vi.fn().mockResolvedValue({ ...MACHINE, checkInToken: token }) }),
      new FixedClock(now),
      new FixedAuthContext(OWNER)
    )

  it('stamps the slot when the tag matches inside the window', async () => {
    const detail = await usecaseWith(bookingOf(), '2026-09-16T09:50:00Z').execute('booking-1', {
      checkInToken: 'qr-forge-laser-01',
    })

    expect(detail.status).toBe(BookingStatus.CHECKED_IN)
    expect(detail.checkedInAt).toStrictEqual(new Date('2026-09-16T09:50:00Z'))
  })

  it('is not idempotent: a second stamp is refused', async () => {
    await expect(
      usecaseWith(bookingOf({ status: BookingStatus.CHECKED_IN }), '2026-09-16T09:50:00Z').execute('booking-1', {
        checkInToken: 'qr-forge-laser-01',
      })
    ).rejects.toThrow(BookingNotCheckInableError)
  })

  it('refuses a stamp outside the window', async () => {
    await expect(
      usecaseWith(bookingOf(), '2026-09-16T10:31:00Z').execute('booking-1', {
        checkInToken: 'qr-forge-laser-01',
      })
    ).rejects.toThrow(CheckInWindowClosedError)
  })

  it('refuses a token that is not the machine’s', async () => {
    await expect(
      usecaseWith(bookingOf(), '2026-09-16T09:50:00Z').execute('booking-1', { checkInToken: 'qr-autre' })
    ).rejects.toThrow(CheckInTokenMismatchError)
  })

  it('writes QR as the method', async () => {
    const checkIn = vi.fn(async (_id: string, at: Date, via: CheckInMethod) =>
      bookingOf({ status: BookingStatus.CHECKED_IN, checkedInAt: at, checkedInVia: via })
    )
    const usecase = new CheckInBookingUsecase(
      stub<IBookingRepository>({ findById: vi.fn().mockResolvedValue(bookingOf()), checkIn }),
      stub<IMachineRepository>({ findById: vi.fn().mockResolvedValue(MACHINE) }),
      new FixedClock('2026-09-16T09:50:00Z'),
      new FixedAuthContext(OWNER)
    )

    await usecase.execute('booking-1', { checkInToken: 'qr-forge-laser-01' })

    expect(checkIn).toHaveBeenCalledWith('booking-1', expect.any(Date), CheckInMethod.QR)
  })
})

describe('MarkNoShowUsecase', () => {
  const fabmanager = authUserFixture({ memberships: [fabmanagerOf(MACHINE.atelierId)] })

  const usecaseWith = (booking: BookingEntity, now: string) =>
    new MarkNoShowUsecase(
      stub<IBookingRepository>({
        findById: vi.fn().mockResolvedValue(booking),
        markNoShow: vi.fn(async () => bookingOf({ status: BookingStatus.NO_SHOW })),
      }),
      machineRepository,
      userRepository,
      new FixedClock(now),
      new FixedAuthContext(fabmanager)
    )

  it('marks an absence once the check-in window has closed', async () => {
    expect((await usecaseWith(bookingOf(), '2026-09-16T10:31:00Z').execute('booking-1')).status).toBe(
      BookingStatus.NO_SHOW
    )
  })

  it('waits for the window to close, not for the slot to end', async () => {
    await expect(usecaseWith(bookingOf(), '2026-09-16T10:30:00Z').execute('booking-1')).rejects.toThrow(
      BookingNotMarkableAsNoShowError
    )
  })

  it('leaves a stamped slot alone', async () => {
    await expect(
      usecaseWith(bookingOf({ status: BookingStatus.CHECKED_IN }), '2026-09-16T12:00:00Z').execute('booking-1')
    ).rejects.toThrow(BookingNotMarkableAsNoShowError)
  })
})
