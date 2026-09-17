import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
  transpilePackages: ['@etabli/ui'],
}

export default nextConfig
