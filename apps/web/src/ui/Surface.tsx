import type { ReactNode } from 'react'

import { cn } from './cn'

export type SurfaceProps = {
  readonly children: ReactNode
  readonly className?: string
}

export const Surface = ({ children, className }: SurfaceProps) => (
  <div className={cn('border-graphite-800 bg-graphite-900 rounded-sm border p-6', className)}>{children}</div>
)
