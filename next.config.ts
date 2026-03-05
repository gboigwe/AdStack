import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    '@stacks/connect',
    '@stacks/network',
    '@stacks/transactions',
    '@stacks/common',
    '@stacks/blockchain-api-client',
  ],
};

export default nextConfig;
