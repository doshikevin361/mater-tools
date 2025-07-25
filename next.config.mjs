/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      'mongodb',
      'puppeteer-extra',
      'puppeteer-extra-plugin-stealth',
      'puppeteer-extra-plugin',
      'clone-deep',
      'merge-deep'
    ],
  },
  env: {
    MONGODB_URI: process.env.MONGODB_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    MSG91_AUTH_KEY: process.env.MSG91_AUTH_KEY,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // MongoDB externals
      config.externals.push({
        'mongodb-client-encryption': 'commonjs mongodb-client-encryption',
        'aws4': 'commonjs aws4',
        'snappy': 'commonjs snappy',
        'kerberos': 'commonjs kerberos',
        '@mongodb-js/zstd': 'commonjs @mongodb-js/zstd',
      })

      // Puppeteer externals
      config.externals.push({
        'puppeteer-extra': 'commonjs puppeteer-extra',
        'puppeteer-extra-plugin-stealth': 'commonjs puppeteer-extra-plugin-stealth',
        'puppeteer-extra-plugin': 'commonjs puppeteer-extra-plugin',
        'clone-deep': 'commonjs clone-deep',
        'merge-deep': 'commonjs merge-deep',
        'puppeteer': 'commonjs puppeteer',
      })

      // Handle dynamic requires
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      }

      // Ignore dynamic require warnings
      config.module = {
        ...config.module,
        exprContextCritical: false,
        unknownContextCritical: false,
      }
    }
    return config
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig