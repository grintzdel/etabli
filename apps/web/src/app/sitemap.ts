import type { MetadataRoute } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

const sitemap = (): MetadataRoute.Sitemap => [
  { url: siteUrl, changeFrequency: 'monthly', priority: 1 },
  { url: `${siteUrl}/ateliers`, changeFrequency: 'daily', priority: 0.8 },
]

export default sitemap
