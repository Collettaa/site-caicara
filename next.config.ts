import path from "node:path";
import type { NextConfig } from "next";

const rootDir = path.resolve(__dirname);

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: rootDir,
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "www.caicara.store",
          },
        ],
        destination: "https://caicara.store/:path*",
        permanent: true,
      },
    ];
  },
  turbopack: {
    root: rootDir,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
