import { NextConfig } from 'next';

const config: NextConfig = {
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
