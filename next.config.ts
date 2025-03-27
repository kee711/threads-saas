import { NextConfig } from 'next';

const config: NextConfig = {
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
