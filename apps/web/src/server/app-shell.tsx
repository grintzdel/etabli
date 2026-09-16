import type { ReactNode } from 'react'
import { Suspense } from 'react'

import { AppSidebar } from '@/ui/AppSidebar'
import { SignedOutLinks } from '@/ui/SiteHeader'

import { CurrentSessionNav } from './session-nav'

export const AppShell = ({ children }: { readonly children: ReactNode }) => (
  <div className="flex flex-1 flex-col lg:flex-row">
    <AppSidebar
      nav={
        <Suspense fallback={<SignedOutLinks />}>
          <CurrentSessionNav />
        </Suspense>
      }
    />
    <div className="min-w-0 flex-1">{children}</div>
  </div>
)
