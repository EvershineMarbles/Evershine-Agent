/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      domains: ['evershine-product.s3.us-east-1.amazonaws.com'],
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'evershine-product.s3.us-east-1.amazonaws.com',
          port: '',
          pathname: '/**',
        },
      ],
    },
  };
  
  export default nextConfig;
  
  