import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  // Allow serving uploads
  async rewrites() {
    return [];
  },
};

export default nextConfig;
