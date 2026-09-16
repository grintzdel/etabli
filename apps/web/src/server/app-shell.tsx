import type { ReactNode } from 'react'
import { Suspense } from 'react'

import { AppHeader } from '@/ui/AppHeader'
import { SiteFooter } from '@/ui/SiteFooter'
import { SignedOutLinks } from '@/ui/SiteHeader'

import { CurrentSessionNav } from './session-nav'

export const AppShell = ({ children }: { readonly children: ReactNode }) => (
  <>
    <AppHeader
      nav={
        <Suspense fallback={<SignedOutLinks />}>
          <CurrentSessionNav />
        </Suspense>
      }
    />
    <div className="flex-1">{children}</div>
    <SiteFooter />
  </>
)
