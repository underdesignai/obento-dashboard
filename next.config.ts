import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  allowedDevOrigins: ["localhost:3627", "127.0.0.1:3627", "100.103.164.50:3627", "192.168.1.37:3627"],
};

export default nextConfig;
