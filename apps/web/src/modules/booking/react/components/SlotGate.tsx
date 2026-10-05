import { Button } from '@etabli/ui'
import { buttonVariants } from '@etabli/ui/web'
import Link from 'next/link'

import type { BookingEligibility } from '@/modules/booking/core/model/booking'

export type SlotGateProps = {
  readonly eligibility: Exclude<BookingEligibility, 'READY'>
  readonly machineId: string
  readonly atelierName: string
  readonly atelierSlug: string
  readonly returnTo: string
  readonly requestCertification: (formData: FormData) => Promise<void>
}

export const SlotGate = ({
  eligibility,
  machineId,
  atelierName,
  atelierSlug,
  returnTo,
  requestCertification,
}: SlotGateProps) => {
  const next = encodeURIComponent(returnTo)

  switch (eligibility) {
    case 'ANONYMOUS':
      return (
        <div className="flex flex-col gap-4">
          <p className="text-graphite-200">Connectez-vous pour réserver ce créneau : il vous attendra au retour.</p>
          <div className="flex flex-wrap gap-3">
            <Link href={`/connexion?next=${next}`} className={buttonVariants({ size: 'sm' })}>
              Se connecter pour réserver
            </Link>
            <Link href={`/inscription?next=${next}`} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
              Créer un compte
            </Link>
          </div>
        </div>
      )
    case 'NOT_MEMBER':
      return (
        <div className="flex flex-col gap-4">
          <p className="text-graphite-200">
            Les créneaux de <span className="text-graphite-50 font-semibold">{atelierName}</span> sont réservés à ses
            membres. Rejoignez l’atelier, puis revenez sur ce créneau.
          </p>
          <div>
            <Link
              href={`/bienvenue?atelier=${encodeURIComponent(atelierSlug)}&next=${next}`}
              className={buttonVariants({ size: 'sm' })}
            >
              Rejoindre {atelierName}
            </Link>
          </div>
        </div>
      )
    case 'CERTIFICATION_REQUIRED':
      return (
        <form action={requestCertification} className="flex flex-col gap-4">
          <input type="hidden" name="machineId" value={machineId} />
          <p className="text-graphite-200">
            Cette machine exige une habilitation, accordée par un fabmanager de l’atelier. Le créneau n’est pas retenu
            pendant la demande.
          </p>
          <div>
            <Button type="submit" size="sm">
              Demander l’habilitation
            </Button>
          </div>
        </form>
      )
    case 'CERTIFICATION_PENDING':
      return (
        <div className="flex flex-col gap-4">
          <p className="text-graphite-200">
            Votre demande d’habilitation attend la décision d’un fabmanager. Vous pourrez réserver dès qu’elle sera
            accordée.
          </p>
          <div>
            <Link href="/habilitations" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
              Mes habilitations
            </Link>
          </div>
        </div>
      )
  }
}
