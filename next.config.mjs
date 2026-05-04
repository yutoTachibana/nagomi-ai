import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // output: 'standalone', // ECS 用に無効化 (better-sqlite3 のネイティブモジュール問題)
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // libsodium needs WASM loading
  webpack: (config) => {
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    // Force CJS versions of libsodium packages (ESM dist has broken relative imports)
    config.resolve.alias = {
      ...config.resolve.alias,
      'libsodium-wrappers$': require.resolve('libsodium-wrappers'),
      'libsodium$': require.resolve('libsodium'),
    };
    return config;
  },
};

export default nextConfig;
