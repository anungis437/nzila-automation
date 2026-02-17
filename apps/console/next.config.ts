import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@nzila/ui'],
  output: 'standalone',
}

export default nextConfig
