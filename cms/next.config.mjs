/** @type {import('next').NextConfig} */
const nextConfig = {
    // images: ['image/avif', 'image/webp'],
    output: 'standalone',
    async rewrites() {
        return [
        {
            source: "/api/:path*",
            destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
        },
        ];
    },
};

export default nextConfig;
