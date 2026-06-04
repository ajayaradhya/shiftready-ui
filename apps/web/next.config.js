// eslint-disable-next-line @typescript-eslint/no-require-imports
const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["@shiftready/types", "@shiftready/core", "@shiftready/api"],
  images: {
    minimumCacheTTL: 86400,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        pathname: "/**",
      },
    ],
  },
};

module.exports = withSentryConfig(nextConfig, {
  silent: true,
  disableLogger: true,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
});
