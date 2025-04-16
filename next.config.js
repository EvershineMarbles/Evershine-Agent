/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // This allows production builds to successfully complete even if
    // your project has TypeScript errors.
    ignoreBuildErrors: true,
  },
  images: {
    domains: ["evershine-product.s3.us-east-1.amazonaws.com", "evershine-product.s3.amazonaws.com"],
    // This is the key setting - disable Vercel's image optimization
    unoptimized: true,
  },
}

module.exports = nextConfig
