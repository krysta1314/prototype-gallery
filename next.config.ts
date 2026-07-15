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
      {
        protocol: "https",
        hostname: "assets.presslogic.com",
        port: "",
        pathname: "/cdn-cgi/image/**",
        search: "",
      },
      {
        protocol: "https",
        hostname: "assets.presslogic.com",
        port: "",
        pathname: "/buzzvideo/**",
        search: "",
      },
    ],
  },
};

export default nextConfig;
