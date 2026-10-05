'use client'

import { Button } from '@etabli/ui'
import { keepPreviousData, QueryClient, QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query'
import { useActionState, useEffect, useState } from 'react'

import { fetchAvailability } from '@/modules/booking/core/lib/fetch-availability'
import { formatDay, formatRange } from '@/modules/booking/core/lib/format'
import { groupSlotsByDay } from '@/modules/booking/core/lib/slots'
import type { BookingActionState, BookingEligibility, MachineAvailability } from '@/modules/booking/core/model/booking'
import { ELIGIBILITY_HINTS } from '@/modules/booking/core/model/booking'

import { SlotGate } from './SlotGate'
import { SlotGrid } from './SlotGrid'

export type MachineWeekProps = {
  readonly machineId: string
  readonly atelierName: string
  readonly atelierSlug: string
  readonly eligibility: BookingEligibility
  readonly initialAvailability: MachineAvailability
  readonly initialStartAt: string | null
  readonly book: (state: BookingActionState, formData: FormData) => Promise<BookingActionState>
  readonly requestCertification: (formData: FormData) => Promise<void>
}

const weekLabelOf = (availability: MachineAvailability): string => {
  const first = availability.slots.at(0)
  const last = availability.slots.at(-1)
  if (first === undefined || last === undefined) return 'Aucun créneau sur cette semaine'

  return `Du ${formatDay(first.startAt)} au ${formatDay(last.startAt)}`
}

const Week = ({
  machineId,
  atelierName,
  atelierSlug,
  eligibility,
  initialAvailability,
  initialStartAt,
  book,
  requestCertification,
}: MachineWeekProps) => {
  const [weeks, setWeeks] = useState<ReadonlyArray<string>>([])
  const [selected, setSelected] = useState<string | null>(initialStartAt)
  const [state, submit, pending] = useActionState(book, { error: null })
  const queryClient = useQueryClient()
  const from = weeks.at(-1)

  const availability = useQuery({
    queryKey: ['availability', machineId, from ?? 'maintenant'],
    queryFn: () => fetchAvailability(machineId, from),
    initialData: () => (from === undefined ? initialAvailability : undefined),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })

  useEffect(() => {
    if (state.error === null) return
    void queryClient.invalidateQueries({ queryKey: ['availability', machineId] })
  }, [state.error, machineId, queryClient])

  const goTo = (next: ReadonlyArray<string>) => {
    setSelected(null)
    setWeeks(next)
  }

  const data = availability.data
  const slot = data?.slots.find((candidate) => candidate.startAt === selected)

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button
          variant="ghost"
          size="sm"
          disabled={weeks.length === 0 || availability.isFetching}
          onClick={() => goTo(weeks.slice(0, -1))}
        >
          Semaine précédente
        </Button>

        <p aria-live="polite" className="font-display text-graphite-200 text-sm tracking-wide">
          {data === undefined ? 'Chargement des créneaux…' : weekLabelOf(data)}
        </p>

        <Button
          variant="ghost"
          size="sm"
          disabled={data === undefined || availability.isFetching}
          onClick={() => goTo(data === undefined ? weeks : [...weeks, data.to])}
        >
          Semaine suivante
        </Button>
      </div>

      {availability.error === null ? null : (
        <p role="alert" className="text-status-danger">
          {availability.error.message}
        </p>
      )}

      {data === undefined ? null : (
        <SlotGrid days={groupSlotsByDay(data.slots)} selectedStartAt={selected} onSelect={setSelected} />
      )}

      {slot === undefined ? (
        <p className="text-graphite-400 text-sm">{ELIGIBILITY_HINTS[eligibility]}</p>
      ) : eligibility !== 'READY' ? (
        <div className="border-graphite-800 flex flex-col gap-4 border-t pt-6">
          <p className="text-graphite-100">
            {formatDay(slot.startAt)}, {formatRange(slot.startAt, slot.endAt)}
          </p>
          <SlotGate
            eligibility={eligibility}
            machineId={machineId}
            atelierName={atelierName}
            atelierSlug={atelierSlug}
            returnTo={`/machines/${machineId}?creneau=${encodeURIComponent(slot.startAt)}`}
            requestCertification={requestCertification}
          />
        </div>
      ) : (
        <form action={submit} className="border-graphite-800 flex flex-wrap items-center gap-4 border-t pt-6">
          <input type="hidden" name="machineId" value={machineId} />
          <input type="hidden" name="startAt" value={slot.startAt} />
          <p className="text-graphite-100">
            {formatDay(slot.startAt)}, {formatRange(slot.startAt, slot.endAt)}
          </p>
          <Button type="submit" disabled={pending}>
            {pending ? 'Réservation…' : 'Réserver ce créneau'}
          </Button>
        </form>
      )}

      {state.error === null ? null : (
        <p role="alert" className="text-status-danger">
          {state.error}
        </p>
      )}
    </div>
  )
}

export const MachineWeek = (props: MachineWeekProps) => {
  const [client] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={client}>
      <Week {...props} />
    </QueryClientProvider>
  )
}
