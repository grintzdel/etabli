import Link from 'next/link'
import type { ReactNode } from 'react'

import { Wordmark } from '@/ui/SiteHeader'

const AuthLayout = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-1 flex-col">
    <header className="border-graphite-800 border-b">
      <div className="mx-auto flex max-w-md items-center justify-between px-6 py-6">
        <Wordmark />
        <Link
          href="/"
          className="font-display text-graphite-400 hover:text-graphite-200 text-sm tracking-wide uppercase"
        >
          Retour au site
        </Link>
      </div>
    </header>

    <div className="flex flex-1 items-start justify-center">{children}</div>
  </div>
)

export default AuthLayout
