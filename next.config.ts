import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets.watermelon.sh",
      },
    ],
  },
};

export default nextConfig;
