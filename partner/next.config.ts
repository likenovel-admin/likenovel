import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

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
        hostname: "cdn.likenove.net",
        port: "443",
        pathname: "/",
      },
    ],
  },
};

export default nextConfig;
