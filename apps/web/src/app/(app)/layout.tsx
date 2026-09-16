import type { ReactNode } from 'react'

import { AppShell } from '@/server/app-shell'
import { readTheme } from '@/server/preferences'

export const instant = false

const AppLayout = async ({ children }: { children: ReactNode }) => {
  const theme = await readTheme()

  return (
    <div data-theme={theme} className="bg-graphite-950 text-graphite-50 flex flex-1 flex-col">
      <AppShell>{children}</AppShell>
    </div>
  )
}

export default AppLayout
