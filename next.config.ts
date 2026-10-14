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
  // demo-shop 是放在 public/ 下的纯静态测试商品页(BuzzVideo 商品页 URL → 广告视频测试用),
  // public/ 不会自动把目录映射到 index.html,这里补上。
  // 页面 canonical 带结尾斜杠,外部工具会直接抓带斜杠的网址,所以关掉默认的斜杠 308 重定向。
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      { source: "/demo-shop", destination: "/demo-shop/index.html" },
      { source: "/demo-shop/", destination: "/demo-shop/index.html" },
      { source: "/demo-shop/products/:slug", destination: "/demo-shop/products/:slug/index.html" },
      { source: "/demo-shop/products/:slug/", destination: "/demo-shop/products/:slug/index.html" },
    ];
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
