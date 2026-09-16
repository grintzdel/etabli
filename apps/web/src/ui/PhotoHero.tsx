import Image from 'next/image'
import type { ReactNode } from 'react'

import { cn } from './cn'

export type PhotoHeroProps = {
  readonly src: string
  readonly children: ReactNode
  readonly priority?: boolean
  readonly className?: string
}

export const PhotoHero = ({ src, children, priority = false, className }: PhotoHeroProps) => (
  <div className={cn('border-graphite-800 relative isolate overflow-hidden rounded-sm border', className)}>
    <Image
      src={src}
      alt=""
      width={1600}
      height={1067}
      priority={priority}
      sizes="(min-width: 1024px) 64rem, 100vw"
      className="absolute inset-0 -z-20 h-full w-full object-cover"
    />
    <div className="from-graphite-950 via-graphite-950/90 to-graphite-950/65 absolute inset-0 -z-10 bg-gradient-to-t" />
    {children}
  </div>
)
