import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    '@stacks/connect',
    '@stacks/network',
    '@stacks/transactions',
    '@stacks/common',
    '@stacks/blockchain-api-client',
  ],
};

export default nextConfig;
