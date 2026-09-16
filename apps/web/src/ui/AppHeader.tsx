import { Wordmark } from './SiteHeader'

export type AppHeaderProps = {
  readonly nav: React.ReactNode
}

export const AppHeader = ({ nav }: AppHeaderProps) => (
  <header className="border-graphite-800 bg-graphite-950/80 sticky top-0 z-10 border-b backdrop-blur">
    <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-6 py-4">
      <Wordmark />
      <nav aria-label="Navigation de l’espace membre" className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {nav}
      </nav>
    </div>
  </header>
)
