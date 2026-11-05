import path from "path";
import { readFileSync } from "fs";
import type { NextConfig } from "next";

const pkg = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf-8")
) as { version?: string };

// GitHub Pages 部署在 /<仓库名> 子路径下；CI 通过 PAGES_BASE_PATH 注入。
// 本地开发不设置该变量，站点仍从根路径访问。
// 注意：Windows Git Bash 会把 /xxx 自动转换成盘符路径，校验不通过时忽略该值，
// 避免非法 basePath 让本地构建直接失败。
const rawBasePath = process.env.PAGES_BASE_PATH || "";
const pagesBasePath = /^\/[A-Za-z0-9._~-]+(?:\/[A-Za-z0-9._~-]+)*$/.test(rawBasePath)
  ? rawBasePath
  : "";

const nextConfig: NextConfig = {
  // 纯静态导出，产物为 out/，由 GitHub Actions 推到 gh-pages 分支
  output: "export",
  ...(pagesBasePath ? { basePath: pagesBasePath } : {}),
  // 静态站点没有 Next.js 图片优化服务
  images: { unoptimized: true },
  reactCompiler: true,
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version ?? "0.0.0",
  },
  webpack(config) {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      jotai: path.resolve(__dirname, "node_modules/jotai"),
      "jotai/vanilla": path.resolve(__dirname, "node_modules/jotai/vanilla"),
    };
    config.module.rules.push({
      test: /\.mp3$/,
      type: "asset/resource",
      generator: {
        filename: "static/media/[name].[hash][ext]",
      },
    });
    return config;
  },
};

export default nextConfig;
