import type { ReactNode } from 'react'

import { readTheme } from '@/server/preferences'
import { SiteShell } from '@/server/site-shell'

/* The theme sits on the chrome, so the chrome is per-member and cannot be part of a
   prerendered shell. Streaming it below a boundary would flash the wrong palette first. */
export const instant = false

const AppLayout = async ({ children }: { children: ReactNode }) => {
  const theme = await readTheme()

  return (
    <div data-theme={theme} className="bg-graphite-950 text-graphite-50 flex flex-1 flex-col">
      <SiteShell>{children}</SiteShell>
    </div>
  )
}

export default AppLayout
