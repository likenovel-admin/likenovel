/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    formats: ["image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.likenovel.dev",
      },
      {
        protocol: "https",
        hostname: "toodat-kr.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "dn-img-page.kakao.com",
      },
      {
        protocol: "https",
        hostname: "cdn.likenovel.net",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_SERVER_URI}/:path*`,
      },
    ];
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    return config;
  },
};

export default nextConfig;
