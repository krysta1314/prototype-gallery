import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.higgsfield.ai",
        port: "",
        pathname: "/application_main/**",
        search: "",
      },
    ],
  },
};

export default nextConfig;
