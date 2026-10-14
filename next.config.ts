import path from "node:path";
import type { NextConfig } from "next";

const rootDir = path.resolve(__dirname);

const nextConfig: NextConfig = {
  output: "standalone",
  // O Header é client component: a flag precisa ir no bundle para servidor e navegador concordarem.
  env: {
    LOJA_NO_MENU: process.env.LOJA_NO_MENU ?? "",
  },
  outputFileTracingRoot: rootDir,
  experimental: {
    // Fotos de produto no admin (até 8 MB cada, uma por envio).
    serverActions: { bodySizeLimit: "10mb" },
  },
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
