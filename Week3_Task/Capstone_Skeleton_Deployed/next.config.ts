import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hide the Next.js dev-mode badge (bottom-left). Errors still show.
  devIndicators: false,
  images: {
    // GitHub avatars shown on the /health page (URLs include a ?v= query).
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
