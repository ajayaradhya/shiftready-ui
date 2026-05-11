/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Critical for Docker/Cloud Run
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;