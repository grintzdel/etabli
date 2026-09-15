import type { ReactNode } from 'react'

import { SiteShell } from '@/server/site-shell'

const AuthLayout = ({ children }: { children: ReactNode }) => <SiteShell>{children}</SiteShell>

export default AuthLayout
