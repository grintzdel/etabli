import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { groupSlotsByDay } from '@/modules/booking/core/lib/slots'
import type { AvailabilitySlot } from '@/modules/booking/core/model/booking'

import { SlotGrid } from './SlotGrid'

const free: AvailabilitySlot = {
  startAt: '2026-06-01T08:00:00.000Z',
  endAt: '2026-06-01T10:00:00.000Z',
  available: true,
  reason: 'FREE',
}

const booked: AvailabilitySlot = {
  startAt: '2026-06-01T10:00:00.000Z',
  endAt: '2026-06-01T12:00:00.000Z',
  available: false,
  reason: 'BOOKED',
}

const grid = (slots: ReadonlyArray<AvailabilitySlot>, selected: string | null, onSelect = vi.fn()) =>
  render(<SlotGrid days={groupSlotsByDay(slots)} selectedStartAt={selected} onSelect={onSelect} />)

describe('SlotGrid', () => {
  it('heads each day with its date', () => {
    grid([free], null)
    expect(screen.getByRole('heading', { name: 'lundi 1 juin' })).toBeInTheDocument()
  })

  it('names a slot by its hours and by what it is', () => {
    grid([free, booked], null)
    expect(screen.getByRole('button', { name: '10:00 – 12:00 — Libre' })).toBeEnabled()
    expect(screen.getByRole('button', { name: '12:00 – 14:00 — Déjà réservé' })).toBeDisabled()
  })

  it('hands the chosen slot back by its start', async () => {
    const onSelect = vi.fn()
    grid([free], null, onSelect)

    await userEvent.click(screen.getByRole('button', { name: /libre/i }))

    expect(onSelect).toHaveBeenCalledWith(free.startAt)
  })

  it('marks the chosen slot as pressed, and it alone', () => {
    grid([free, booked], free.startAt)

    expect(screen.getByRole('button', { name: /libre/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /déjà réservé/i })).toHaveAttribute('aria-pressed', 'false')
  })

  it('says nothing at all for a week without slots', () => {
    grid([], null)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
