import type { NextConfig } from "next";

const uploadProxyUrl =
  process.env.INTERNAL_UPLOAD_PROXY_URL || "http://localhost:5000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: `${uploadProxyUrl}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;