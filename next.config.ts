import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Allow qrcode.react and other packages to use client-only features
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
}

export default nextConfig
