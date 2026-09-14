import type { MetadataRoute } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

const robots = (): MetadataRoute.Robots => ({
  rules: [{ userAgent: '*', allow: '/', disallow: ['/tableau-de-bord', '/administration', '/api'] }],
  sitemap: `${siteUrl}/sitemap.xml`,
})

export default robots
