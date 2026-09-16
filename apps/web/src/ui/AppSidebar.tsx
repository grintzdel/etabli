import Link from 'next/link'
import type { ReactNode } from 'react'

export type AppSidebarProps = {
  readonly nav: ReactNode
}

export const AppSidebar = ({ nav }: AppSidebarProps) => (
  <header className="border-graphite-800 bg-graphite-950/80 border-b backdrop-blur lg:sticky lg:top-0 lg:h-dvh lg:w-64 lg:shrink-0 lg:overflow-y-auto lg:border-r lg:border-b-0">
    <div className="flex h-full flex-col gap-6 px-6 py-5 lg:py-8">
      <Link
        href="/tableau-de-bord"
        className="font-display text-signal-500 text-xl font-bold tracking-widest uppercase"
      >
        Établi
      </Link>

      <nav aria-label="Navigation de l’espace membre" className="flex flex-1 flex-col gap-6">
        {nav}
      </nav>
    </div>
  </header>
)

export const SidebarSection = ({ title, children }: { readonly title: string; readonly children: ReactNode }) => (
  <div className="flex flex-col gap-2">
    <h2 className="font-display text-graphite-500 text-xs tracking-widest uppercase">{title}</h2>
    <ul className="flex flex-wrap gap-x-4 gap-y-1 lg:flex-col lg:gap-0">{children}</ul>
  </div>
)

export const SidebarLink = ({ href, children }: { readonly href: string; readonly children: ReactNode }) => (
  <li>
    <Link
      href={href}
      className="font-display text-graphite-300 hover:bg-graphite-900 hover:text-graphite-50 focus-visible:outline-signal-500 -mx-2 block rounded-sm px-2 py-1.5 text-sm tracking-wide uppercase focus-visible:outline-2"
    >
      {children}
    </Link>
  </li>
)
