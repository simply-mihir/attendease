/** @type {import('next').NextConfig} */
const nextConfig = {
  // Reduce serverless function count by grouping API routes
  experimental: {
    serverComponentsExternalPackages: ["@neondatabase/serverless"],
  },
  // Compress responses
  compress: true,
  // Optimize images
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
  // Security + caching headers
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
    ];
  },
};

export default nextConfig;
