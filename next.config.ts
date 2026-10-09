import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The quickstart markdown is read from disk at build time
  outputFileTracingIncludes: { "/guide": ["./content/**/*"] },
};

export default nextConfig;
