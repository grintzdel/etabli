import type { ReactNode } from 'react'

import { SiteShell } from '@/server/site-shell'

const MarketingLayout = ({ children }: { children: ReactNode }) => <SiteShell>{children}</SiteShell>

export default MarketingLayout
