import { join } from 'node:path'

import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
  transpilePackages: ['@etabli/ui'],
  output: 'standalone',
  outputFileTracingRoot: join(import.meta.dirname, '../..'),
}

export default nextConfig
