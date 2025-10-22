import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true, // ✅ skip type-checking during build
  },
  // you can add other options here if needed
};

export default nextConfig;
