import type { MetadataRoute } from 'next'

import { PRIVATE_PREFIXES } from '@/proxy'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

const robots = (): MetadataRoute.Robots => ({
  rules: [{ userAgent: '*', allow: '/', disallow: [...PRIVATE_PREFIXES, '/api'] }],
  sitemap: `${siteUrl}/sitemap.xml`,
})

export default robots
