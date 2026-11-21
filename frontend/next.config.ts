import type {NextConfig} from 'next';
import {BACKEND_API_URL} from './lib/config';

// Uploaded product / brand / banner images are served by the API at /uploads/… (WebP).
// The image host follows the API URL picked for this environment (lib/config.ts).
const backendUrl = new URL(BACKEND_API_URL);
const isLocalBackend = ['localhost', '127.0.0.1'].includes(backendUrl.hostname);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  // Allow access to remote image placeholder.
  images: {
    // Serve modern formats; the API already stores WebP, Next adds AVIF where supported
    formats: ['image/avif', 'image/webp'],
    // Uploaded filenames never change, so optimised copies can be cached for a long time
    minimumCacheTTL: 60 * 60 * 24 * 30,
    // Next 16 refuses to optimise images from localhost unless allowed (dev API only)
    dangerouslyAllowLocalIP: true,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5001',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '5001',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        pathname: '/**',
      },
      {
        protocol: backendUrl.protocol.replace(':', '') as 'http' | 'https',
        hostname: backendUrl.hostname,
        port: backendUrl.port || undefined,
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        pathname: '/**',
      },
    ],
  },
  output: 'standalone',
  async rewrites() {
    return [
      { source: '/shipping-policy', destination: '/policies/shipping' },
      { source: '/returns-refunds', destination: '/policies/returns' },
      { source: '/rental-terms', destination: '/policies/rental-terms' },
      { source: '/privacy-policy', destination: '/policies/privacy' },
      { source: '/terms-of-use', destination: '/policies/terms' },
    ];
  },
  transpilePackages: ['motion'],
  turbopack: {},
  webpack: (config, {dev}) => {
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // Do not modify—file watching is disabled to prevent flickering during agent edits.
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    return config;
  },
};

export default nextConfig;
