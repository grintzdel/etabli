import type { ReactNode } from 'react'
import { Suspense } from 'react'

import { SiteFooter } from '@/ui/SiteFooter'
import { SignedOutLinks, SiteHeader } from '@/ui/SiteHeader'

import { CurrentSessionNav } from './session-nav'

export const SiteShell = ({ children }: { readonly children: ReactNode }) => (
  <>
    <SiteHeader
      session={
        <Suspense fallback={<SignedOutLinks />}>
          <CurrentSessionNav />
        </Suspense>
      }
    />
    <div className="flex-1">{children}</div>
    <SiteFooter />
  </>
)
