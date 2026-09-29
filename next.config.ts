import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // BuzzVideo APP 原型用 React Native 组件编写:react-native 换成 react-native-web,
  // 并让 .web.* 平台文件优先(React Native 的平台文件惯例)。
  turbopack: {
    resolveAlias: {
      "react-native": "react-native-web",
    },
    resolveExtensions: [".web.tsx", ".web.ts", ".web.jsx", ".web.js", ".tsx", ".ts", ".jsx", ".js", ".mjs", ".json"],
  },
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
      {
        protocol: "https",
        hostname: "assets.presslogic.com",
        port: "",
        pathname: "/aigc/**",
        search: "",
      },
    ],
  },
};

export default nextConfig;
