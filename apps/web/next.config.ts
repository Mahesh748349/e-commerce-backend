import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  typedRoutes: true,
  agentRules: false
};

export default nextConfig;
