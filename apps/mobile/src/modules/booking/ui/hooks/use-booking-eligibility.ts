import type { MachineDetail } from '../../../atelier/core/model/atelier'
import { useMyCertifications } from '../../../certification/ui/hooks/use-my-certifications'
import { useSession } from '../../../identity/ui/hooks/use-session'
import { bookingEligibilityOf, type BookingEligibility } from '../../core/model/booking'

export const useBookingEligibility = (machine: MachineDetail | null): BookingEligibility | null => {
  const { user } = useSession()
  const mine = useMyCertifications()

  if (machine === null) return null
  if (user === null) return bookingEligibilityOf(machine, null)
  if (machine.requiresCertification && mine.isPending) return null

  return bookingEligibilityOf(machine, { memberships: user.memberships, certifications: mine.certifications })
}
