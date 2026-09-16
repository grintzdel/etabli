import Image from 'next/image'
import Link from 'next/link'

import { coverArtFor } from '@/modules/atelier/core/lib/cover-art'
import { atelierPhotoFor } from '@/modules/atelier/core/lib/machine-photo'
import type { AtelierSummary } from '@/modules/atelier/core/model/atelier'
import { formatDistance, MACHINE_KIND_LABELS } from '@/modules/atelier/core/model/atelier'
import { StatusBadge } from '@/ui/StatusBadge'
import { Surface } from '@/ui/Surface'

export type AtelierCardProps = {
  readonly atelier: AtelierSummary
}

export const AtelierCard = ({ atelier }: AtelierCardProps) => (
  <Surface className="flex h-full flex-col gap-4 overflow-hidden p-0">
    <Image
      src={atelierPhotoFor(atelier.slug, atelier.machineKinds) ?? coverArtFor(atelier.slug)}
      alt=""
      width={1600}
      height={1067}
      sizes="(min-width: 1024px) 24rem, (min-width: 640px) 45vw, 90vw"
      className="h-40 w-full object-cover"
    />

    <div className="flex flex-1 flex-col gap-4 p-6 pt-0">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="font-display text-xl font-semibold tracking-wide uppercase">
          <Link href={`/ateliers/${atelier.slug}`} className="hover:text-signal-400">
            {atelier.name}
          </Link>
        </h3>
        {atelier.distanceKm === null ? null : (
          <StatusBadge tone="neutral" label={`à ${formatDistance(atelier.distanceKm)}`} />
        )}
      </div>

      <p className="text-graphite-400 text-sm">
        {atelier.city}, {atelier.country}
      </p>
      <p className="text-graphite-200 flex-1">{atelier.description}</p>

      <div className="flex flex-col gap-2">
        <p className="text-graphite-400 text-sm">
          {atelier.machineCount === 0
            ? 'Aucune machine publiée'
            : `${atelier.machineCount} machine${atelier.machineCount > 1 ? 's' : ''}`}
        </p>
        <ul aria-label="Types de machines" className="flex flex-wrap gap-2">
          {atelier.machineKinds.map((kind) => (
            <li key={kind}>
              <StatusBadge tone="neutral" label={MACHINE_KIND_LABELS[kind]} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  </Surface>
)
