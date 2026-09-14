import type { Metadata } from 'next'
import { Barlow_Condensed, Inter } from 'next/font/google'
import type { ReactNode } from 'react'

import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-barlow-condensed',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: { default: 'Établi', template: '%s · Établi' },
  description: "Le réseau d'ateliers partagés où l'habilitation conditionne la réservation.",
}

const RootLayout = ({ children }: { children: ReactNode }) => (
  <html lang="fr" className={`${inter.variable} ${barlowCondensed.variable}`}>
    <body>{children}</body>
  </html>
)

export default RootLayout
