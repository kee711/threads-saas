import { NextConfig } from 'next';

const config: NextConfig = {
  env: {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    THREADS_CLIENT_ID: process.env.THREADS_CLIENT_ID,
    THREADS_CLIENT_SECRET: process.env.THREADS_CLIENT_SECRET,
  },
  eslint: {
    // Vercel 배포 시 ESLint 검사를 건너뜁니다.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Vercel 배포 시 TypeScript 검사를 건너뜁니다.
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      crypto: false,
      path: false,
      os: false,
    };
    return config;
  },
};

export default config;
