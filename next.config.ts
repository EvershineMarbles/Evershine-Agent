/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ignore ESLint errors during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Ignore TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Suppress the "You're using the experimental image optimization" warning
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
