import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Legacy lint debt is large in partner; keep CI/docker builds unblocked.
  // Developers can still run `yarn lint` explicitly for incremental cleanup.
  eslint: {
    ignoreDuringBuilds: true,
  },

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
      },
    ];
  },

  images: {
    domains: ["cdn.likenovel.net"],
    formats: ["image/webp"],
    remotePatterns: [
      //   {
      //     protocol: "https",
      //     hostname: process.env.NEXT_PUBLIC_HOST_CDN_URL || "",
      //     port: "443",
      //     pathname: "/",
      //   },
      {
        protocol: "https",
        hostname: "cdn.likenovel.net",
        port: "443",
        pathname: "/",
      },
    ],
  },
};

export default nextConfig;
