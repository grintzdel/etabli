import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from './cn'

const badge = cva(
  'font-display inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-xs font-semibold tracking-wider uppercase',
  {
    variants: {
      tone: {
        ok: 'border-status-ok/40 bg-status-ok/10 text-status-ok',
        warn: 'border-status-warn/40 bg-status-warn/10 text-status-warn',
        danger: 'border-status-danger/40 bg-status-danger/10 text-status-danger',
        neutral: 'border-graphite-700 bg-graphite-800 text-graphite-200',
      },
    },
    defaultVariants: { tone: 'neutral' },
  }
)

export type StatusBadgeProps = VariantProps<typeof badge> & {
  readonly label: string
  readonly className?: string
}

export const StatusBadge = ({ tone, label, className }: StatusBadgeProps) => (
  <output className={cn(badge({ tone }), className)}>{label}</output>
)
