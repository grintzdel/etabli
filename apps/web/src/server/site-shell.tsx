import type { ReactNode } from 'react'
import { Suspense } from 'react'

import { SiteFooter } from '@/ui/SiteFooter'
import { SignedOutLinks, SiteHeader } from '@/ui/SiteHeader'

import { MarketingSessionNav } from './marketing-session-nav'

export const SiteShell = ({ children }: { readonly children: ReactNode }) => (
  <>
    <SiteHeader
      session={
        <Suspense fallback={<SignedOutLinks />}>
          <MarketingSessionNav />
        </Suspense>
      }
    />
    <div className="flex-1">{children}</div>
    <SiteFooter />
  </>
)
