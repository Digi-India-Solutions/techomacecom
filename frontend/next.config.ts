import type {NextConfig} from 'next';

// Uploaded product / brand / banner images are served by the API at /uploads/… (WebP).
// Derive the image host from NEXT_PUBLIC_BACKEND_API_URL so dev and production both work.
const backendUrl = new URL(process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5001/api/v1');
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
    dangerouslyAllowLocalIP: isLocalBackend,
    remotePatterns: [
      {
        protocol: backendUrl.protocol.replace(':', '') as 'http' | 'https',
        hostname: backendUrl.hostname,
        port: backendUrl.port,
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**', // This allows any path under the hostname
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  output: 'standalone',
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
