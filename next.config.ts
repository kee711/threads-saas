import { NextConfig } from 'next';

const config: NextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-Requested-With' },
          { key: 'Access-Control-Max-Age', value: '86400' },
        ],
      },
    ];
  },
  env: {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    THREADS_CLIENT_ID: process.env.THREADS_CLIENT_ID,
    THREADS_CLIENT_SECRET: process.env.THREADS_CLIENT_SECRET,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  eslint: {
    // Vercel 배포 시 ESLint 검사를 건너뜁니다.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Vercel 배포 시 TypeScript 검사를 건너뜁니다.
    ignoreBuildErrors: true,
  },
  webpack: (config, { dev }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      crypto: false,
      path: false,
      os: false,
    };

    // Only include stagewise in development mode
    if (!dev) {
      config.module.rules.push({
        test: /@stagewise/,
        loader: 'ignore-loader',
      });
    }

    if (dev) {
      // StagewiseToolbar 설정
      config.module.rules.push({
        test: /\.m?js/,
        resolve: {
          fullySpecified: false,
        },
      });
    }

    return config;
  },
};

export default config;
