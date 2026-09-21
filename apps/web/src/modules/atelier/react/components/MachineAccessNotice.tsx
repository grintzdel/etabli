import { Surface } from '@etabli/ui'
import { buttonVariants } from '@etabli/ui/web'
import Link from 'next/link'

export type MachineAccessNoticeProps = {
  readonly signedIn: boolean
  readonly atelierName: string
  readonly atelierSlug: string
  readonly machineId: string
}

export const MachineAccessNotice = ({ signedIn, atelierName, atelierSlug, machineId }: MachineAccessNoticeProps) => (
  <Surface className="flex flex-col gap-4">
    <h2 className="font-display text-xl font-bold tracking-tight uppercase">Réserver cette machine</h2>

    <p className="text-graphite-200">
      Les créneaux de <span className="text-graphite-50 font-semibold">{atelierName}</span> sont ouverts à ses membres.
      {signedIn
        ? ' Rejoignez cet atelier pour ouvrir son calendrier.'
        : ' Connectez-vous pour voir la semaine et prendre un créneau.'}
    </p>

    <div className="flex flex-wrap gap-3">
      {signedIn ? null : (
        <Link
          href={`/connexion?next=${encodeURIComponent(`/machines/${machineId}`)}`}
          className={buttonVariants({ size: 'sm' })}
        >
          Se connecter
        </Link>
      )}
      <Link href={`/ateliers/${atelierSlug}`} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
        Voir l’atelier
      </Link>
    </div>
  </Surface>
)
