/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Critical for Docker/Cloud Run
  images: {
    unoptimized: true, // Recommended if not using a dedicated Image Optimizer service
  },
};

module.exports = nextConfig;