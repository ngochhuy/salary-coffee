/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Edge runtime for API routes
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

module.exports = nextConfig;
