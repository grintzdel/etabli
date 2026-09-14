import type { DirectoryFilters } from '@/modules/atelier/core/model/atelier'
import { MACHINE_KIND_LABELS, MACHINE_KINDS } from '@/modules/atelier/core/model/atelier'
import { buttonVariants } from '@/ui/Button'

export type AtelierDirectoryFiltersProps = {
  readonly filters: DirectoryFilters
}

const fieldClassName =
  'border-graphite-700 bg-graphite-950 text-graphite-50 focus:border-signal-500 h-10 rounded-sm border px-3 outline-none'

export const AtelierDirectoryFilters = ({ filters }: AtelierDirectoryFiltersProps) => (
  <form method="get" aria-label="Filtrer l'annuaire" className="flex flex-wrap items-end gap-4">
    <div className="flex flex-col gap-1.5">
      <label htmlFor="city" className="font-display text-graphite-400 text-xs tracking-wider uppercase">
        Ville
      </label>
      <input
        id="city"
        name="city"
        type="search"
        defaultValue={filters.city ?? ''}
        placeholder="Montreuil"
        className={fieldClassName}
      />
    </div>

    <div className="flex flex-col gap-1.5">
      <label htmlFor="machineKind" className="font-display text-graphite-400 text-xs tracking-wider uppercase">
        Type de machine
      </label>
      <select id="machineKind" name="machineKind" defaultValue={filters.machineKind ?? ''} className={fieldClassName}>
        <option value="">Toutes</option>
        {MACHINE_KINDS.map((kind) => (
          <option key={kind} value={kind}>
            {MACHINE_KIND_LABELS[kind]}
          </option>
        ))}
      </select>
    </div>

    <button type="submit" className={buttonVariants()}>
      Filtrer
    </button>
  </form>
)
